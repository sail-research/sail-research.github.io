"""Bounded robustness/backdoor experiments on your own local digit models."""
from pathlib import Path
import numpy as np
import torch
from torch import nn
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from common import arguments, digits_split, save_split, record_environment, write_json, table_csv
from neural import train_model, metrics, logits


def attack(model, X, y, epsilon, steps=20, restarts=2, seed=7):
    """Untargeted L-inf PGD with all-candidate failure tracking, including clean input.

    Returned adversarial inputs maximize observed CE; suite survival separately tracks
    ANY observed misclassification. Neither is a certificate over the entire threat set.
    """
    model.eval()
    original=torch.as_tensor(X,dtype=torch.float32)
    target=torch.as_tensor(y,dtype=torch.long)
    with torch.no_grad():
        z=model(original);best_loss=nn.functional.cross_entropy(z,target,reduction='none')
        failed=z.argmax(-1)!=target
    best=original.clone();generator=torch.Generator().manual_seed(seed)
    alpha=epsilon/4 if steps>1 else epsilon
    for restart in range(restarts):
        if steps==1: current=original.clone()
        else:
            noise=(2*torch.rand(original.shape,generator=generator)-1)*epsilon
            current=(original+noise).clamp(0,1)
        for _ in range(steps):
            current=current.detach().requires_grad_(True)
            loss=nn.functional.cross_entropy(model(current),target,reduction='sum')
            gradient=torch.autograd.grad(loss,current)[0]
            assert torch.isfinite(gradient).all()
            current=current.detach()+alpha*gradient.sign()
            current=torch.maximum(torch.minimum(current,original+epsilon),original-epsilon).clamp(0,1)
            assert float((current-original).abs().max())<=epsilon+1e-6
            with torch.no_grad():
                candidate_logits=model(current)
                candidate_loss=nn.functional.cross_entropy(candidate_logits,target,reduction='none')
                failed |= candidate_logits.argmax(-1)!=target
                improve=candidate_loss>best_loss
                best[improve]=current[improve];best_loss=torch.maximum(best_loss,candidate_loss)
    assert float(best.min())>=0 and float(best.max())<=1
    if epsilon==0: torch.testing.assert_close(best,original,rtol=0,atol=0)
    return best.numpy(),failed.numpy()


def trigger(X):
    changed=np.array(X,copy=True).reshape(-1,8,8)
    changed[:,-2:,-2:]=1.
    return changed.reshape(-1,64)


def privacy_arithmetic(seed):
    gradients=np.array([[3.,4.],[.3,.4],[0.,0.]])
    C=1.;norm=np.linalg.norm(gradients,axis=1,keepdims=True)
    clipped=gradients/np.maximum(1.,norm/C)
    assert np.all(np.linalg.norm(clipped,axis=1)<=C+1e-12)
    n=100;epsilon=.5;sensitivity=1/n
    noise=np.random.default_rng(seed).laplace(0,sensitivity/epsilon,5000)
    return {'clipped_gradients':clipped,'replace_one_bounded_mean_sensitivity':sensitivity,
        'illustrative_epsilon':epsilon,'laplace_scale':sensitivity/epsilon,
        'noise_sample_std':float(noise.std(ddof=1)),
        'scope':'Public synthetic arithmetic only. Fixed public seed; NOT a private release or DP-SGD guarantee.'}


def run(seed,split_seed,output):
    X,y,split=digits_split(split_seed);tr,va,te=(split[k] for k in ['train','validation','test'])
    digest=save_split(output,split);snapshot=X.copy()
    clean,history,epoch=train_model(X[tr],y[tr],X[va],y[va],seed)
    clean_metrics=metrics(clean,X[te],y[te]);clean_correct=clean_metrics['predictions']==y[te]
    rows=[];details=[]
    for epsilon in [0.,.05,.1,.2]:
        fgsm,fgsm_failed=attack(clean,X[te],y[te],epsilon,steps=1,restarts=1,seed=seed)
        pgd,pgd_failed=attack(clean,X[te],y[te],epsilon,steps=20,restarts=2,seed=seed)
        failed=fgsm_failed|pgd_failed
        surviving=~failed  # Clean misclassifications are already included in failed.
        assert np.all(~surviving|clean_correct)
        eligible=int(clean_correct.sum())
        successful=int((failed&clean_correct).sum())
        rows.append({'epsilon':epsilon,'clean_accuracy':float(clean_correct.mean()),
            'empirical_suite_survival':float(surviving.mean()),
            'clean_correct_denominator':eligible,'successful_on_clean_correct':successful,
            'conditional_attack_success':successful/eligible if eligible else None,
            'returned_pgd_linf_max':float(np.abs(pgd-X[te]).max())})
        details.append({'epsilon':epsilon,'test_indices':te,'failed_any_candidate':failed,
            'fgsm_failed':fgsm_failed,'pgd_failed':pgd_failed})
    table_csv(output/'robustness.csv',rows);write_json(output/'attack_outcomes.json',details)
    fig,ax=plt.subplots(figsize=(6,4));ax.plot([r['epsilon'] for r in rows],
        [r['empirical_suite_survival'] for r in rows],marker='o',label='FGSM + tested PGD candidates')
    ax.axhline(float(clean_correct.mean()),color='gray',linestyle='--',label='Clean accuracy')
    ax.set(xlabel='L-infinity budget in [0,1] units',ylabel='Fraction correct / surviving',ylim=(0,1))
    ax.legend();fig.tight_layout();fig.savefig(output/'robustness.svg');plt.close(fig)

    # Only a copy of training examples is poisoned; test and validation stay clean.
    target=0;fraction=.10;rng=np.random.default_rng(seed+90)
    eligible_positions=np.flatnonzero(y[tr]!=target);count=int(len(tr)*fraction)
    positions=rng.choice(eligible_positions,size=count,replace=False)
    Xpoison=X[tr].copy();ypoison=y[tr].copy()
    Xpoison[positions]=trigger(Xpoison[positions]);ypoison[positions]=target
    np.testing.assert_array_equal(X,snapshot)
    poisoned,poison_history,poison_epoch=train_model(Xpoison,ypoison,X[va],y[va],seed)
    non_target=y[te]!=target
    test_trigger=trigger(X[te][non_target])
    clean_trigger_pred=logits(clean,test_trigger).argmax(-1)
    poison_trigger_pred=logits(poisoned,test_trigger).argmax(-1)
    poison_clean=metrics(poisoned,X[te],y[te])
    backdoor={'target':target,'trigger':'bottom-right 2x2 white patch on [0,1] 8x8 image',
        'requested_poison_fraction_of_all_training':fraction,'poison_count':count,'training_count':len(tr),
        'poison_original_indices':tr[positions],'source_pool':'non-target training examples',
        'non_target_test_count':int(non_target.sum()),'non_target_test_indices':te[non_target],
        'clean_model_clean_accuracy':clean_metrics['accuracy'],
        'poisoned_model_clean_accuracy':poison_clean['accuracy'],
        'clean_model_trigger_target_rate':float((clean_trigger_pred==target).mean()),
        'poisoned_model_non_target_ASR':float((poison_trigger_pred==target).mean()),
        'poisoned_trigger_predictions':poison_trigger_pred,'clean_trigger_predictions':clean_trigger_pred,
        'clean_selected_epoch':epoch,'poison_selected_epoch':poison_epoch,
        'selection':'clean validation macro F1 for both models',
        'scope':'Original educational experiment, not a numerical reproduction of BadNets.'}
    write_json(output/'backdoor.json',backdoor)
    table_csv(output/'clean_training.csv',history);table_csv(output/'poison_training.csv',poison_history)
    write_json(output/'privacy_arithmetic.json',privacy_arithmetic(seed))
    write_json(output/'protocol.json',{'seed':seed,'split_seed':split_seed,'split_sha256':digest,
      'attack':'untargeted white-box L-infinity; FGSM and PGD20, 2 restarts',
      'input_range':[0,1],'pgd_step_size':'epsilon/4','model':'64-32-10 ReLU MLP',
      'no_certification_claim':True,'training_data_mutation_check':'passed',
      'robustness':rows,'backdoor_ASR':backdoor['poisoned_model_non_target_ASR']})
    return {'clean_accuracy':clean_metrics['accuracy'],'robustness':rows,
        'backdoor_ASR':backdoor['poisoned_model_non_target_ASR'],'checks':'passed'}


if __name__=='__main__':
    args=arguments(__doc__);record_environment(args.output,args.seed)
    print(run(args.seed,args.split_seed,args.output))
