"""Measured CPU tradeoffs; dense pruning, dequantized storage, SVD and distillation."""
from copy import deepcopy
from time import perf_counter_ns
import numpy as np
import torch
from torch import nn
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from common import arguments, digits_split, save_split, record_environment, write_json, table_csv
from neural import train_model, metrics, logits, make_model, setup


def prune_dense(model,fraction=.5):
    out=deepcopy(model)
    weights=[p for p in out.parameters() if p.ndim==2]
    flat=torch.cat([p.detach().flatten() for p in weights])
    count=int(flat.numel()*fraction)
    order=torch.argsort(flat.abs(),stable=True)[:count]
    flat[order]=0;offset=0
    with torch.no_grad():
        for p in weights:
            p.copy_(flat[offset:offset+p.numel()].reshape_as(p));offset+=p.numel()
    assert sum(p.numel() for p in out.parameters())==sum(p.numel() for p in model.parameters())
    return out,{'selected_weight_count':flat.numel(),'zeroed_count':count,
                'representation':'dense float32 tensors; no sparse execution or fine-tuning'}


def quantized_storage(model,path):
    out=deepcopy(model);packed={};errors=[]
    with torch.no_grad():
        for i,(name,p) in enumerate(out.named_parameters()):
            source=p.detach().numpy()
            if p.ndim==2:
                scale=np.float32(max(float(np.abs(source).max())/127,np.finfo(np.float32).tiny))
                q=np.clip(np.rint(source/scale),-127,127).astype(np.int8)
                reconstructed=q.astype(np.float32)*scale
                error=float(np.max(np.abs(source-reconstructed)))
                assert error<=float(scale)/2+1e-6
                p.copy_(torch.from_numpy(reconstructed))
                packed[f'weight_{i}_int8']=q;packed[f'weight_{i}_scale']=np.array([scale])
                errors.append({'parameter':name,'scale':float(scale),'max_absolute_error':error})
            else: packed[f'bias_{i}_float32']=source.copy()
    np.savez(path,**packed)
    return out,{'format':'NPZ, signed symmetric [-127,127], per-weight-tensor scale; biases float32',
        'packed_array_bytes':sum(a.nbytes for a in packed.values()),'actual_npz_bytes':path.stat().st_size,
        'inference':'DEQUANTIZED float32, NOT integer kernels','errors':errors}


def factorize(model,rank=8):
    original=model[0];W=original.weight.detach()
    U,s,Vh=torch.linalg.svd(W,full_matrices=False)
    first=nn.Linear(W.shape[1],rank,bias=False)
    second=nn.Linear(rank,W.shape[0],bias=True)
    with torch.no_grad():
        first.weight.copy_(s[:rank].sqrt().unsqueeze(1)*Vh[:rank])
        second.weight.copy_(U[:,:rank]*s[:rank].sqrt().unsqueeze(0))
        second.bias.copy_(original.bias)
    rebuilt=second.weight@first.weight
    error=float((torch.linalg.norm(W-rebuilt)**2).detach())
    torch.testing.assert_close(torch.tensor(error),s[rank:].square().sum(),rtol=1e-4,atol=1e-5)
    out=nn.Sequential(first,second,deepcopy(model[1]),deepcopy(model[2])).eval()
    return out,{'rank':rank,'first_weight_shape':list(W.shape),
        'weight_squared_frobenius_error':error,'fine_tuning':False}


def distill(teacher,Xtr,ytr,Xva,yva,seed,epochs=35,T=2.,weight=.5):
    setup(seed);student=make_model('mlp',16)
    optimizer=torch.optim.AdamW(student.parameters(),lr=.003,weight_decay=1e-4)
    X=torch.as_tensor(Xtr);y=torch.as_tensor(ytr)
    teacher.eval();teacher_before=deepcopy(teacher.state_dict())
    generator=torch.Generator().manual_seed(seed+123)
    history=[];best=-1.;state=None;selected=None
    for epoch in range(1,epochs+1):
        student.train();total=0.
        for batch in torch.randperm(len(y),generator=generator).split(64):
            optimizer.zero_grad(set_to_none=True)
            with torch.no_grad(): teacher_prob=(teacher(X[batch])/T).softmax(-1)
            z=student(X[batch])
            soft=nn.functional.kl_div((z/T).log_softmax(-1),teacher_prob,reduction='batchmean')*T*T
            loss=(1-weight)*nn.functional.cross_entropy(z,y[batch])+weight*soft
            assert torch.isfinite(loss)
            loss.backward();optimizer.step();total+=float(loss.detach())*len(batch)
        score=metrics(student,Xva,yva)['macro_f1']
        history.append({'epoch':epoch,'training_combined_loss':total/len(y),'validation_macro_f1':score})
        if score>best: best=score;state=deepcopy(student.state_dict());selected=epoch
    student.load_state_dict(state);student.eval()
    for name,value in teacher.state_dict().items(): torch.testing.assert_close(value,teacher_before[name],rtol=0,atol=0)
    return student,history,selected


def benchmark(model,X,repetitions=100,warmup=20):
    model.eval();tensor=torch.as_tensor(X,dtype=torch.float32);samples=[]
    with torch.inference_mode():
        for _ in range(warmup): model(tensor)
        for _ in range(repetitions):
            start=perf_counter_ns();model(tensor);samples.append((perf_counter_ns()-start)/1e6)
    return {'batch_size':len(X),'warmup':warmup,'repetitions':repetitions,'samples_ms':samples,
        'median_batch_ms':float(np.median(samples)),'p95_batch_ms':float(np.quantile(samples,.95)),
        'derived_examples_per_second':float(len(X)/(np.median(samples)/1000))}


def lora_check():
    torch.manual_seed(19)
    base=torch.randn(4,3);A=torch.randn(2,3,requires_grad=True)
    B=torch.zeros(4,2,requires_grad=True);x=torch.randn(5,3)
    separate=x@base.T+(x@A.T)@B.T
    merged=x@(base+B@A).T
    torch.testing.assert_close(separate,merged)
    separate.square().mean().backward()
    assert float(B.grad.abs().sum())>0 and float(A.grad.abs().sum())==0
    return {'merged_arithmetic':'passed','zero_B_nonzero_A_gradient_check':'passed',
        'scope':'Arithmetic only; no large-model fine-tuning claim'}


def run(seed,split_seed,output):
    X,y,split=digits_split(split_seed);tr,va,te=(split[k] for k in ['train','validation','test'])
    digest=save_split(output,split)
    teacher,teacher_history,teacher_epoch=train_model(X[tr],y[tr],X[va],y[va],seed,width=64)
    pruned,prune_info=prune_dense(teacher)
    quant,quant_info=quantized_storage(teacher,output/'quantized_weights.npz')
    lowrank,rank_info=factorize(teacher,8)
    hard,hard_history,hard_epoch=train_model(X[tr],y[tr],X[va],y[va],seed+1,width=16)
    distilled,distill_history,distill_epoch=distill(teacher,X[tr],y[tr],X[va],y[va],seed+1)
    methods=[('reference_width64',teacher),('pruned_dense_50pct',pruned),
             ('int8_storage_dequantized_float',quant),('svd_rank8',lowrank),
             ('student16_hard_labels',hard),('student16_distilled',distilled)]
    rows=[];timings={}
    for name,model in methods:
        quality=metrics(model,X[te],y[te])
        artifact=output/f'{name}.pt';torch.save(model.state_dict(),artifact)
        b1=benchmark(model,X[te][:1]);b64=benchmark(model,X[te][:64]);timings[name]={'batch1':b1,'batch64':b64}
        rows.append({'method':name,'test_accuracy':quality['accuracy'],'test_macro_f1':quality['macro_f1'],
            'parameters':sum(p.numel() for p in model.parameters()),
            'raw_float_parameter_bytes':sum(p.numel()*p.element_size() for p in model.parameters()),
            'actual_float_checkpoint_bytes':artifact.stat().st_size,
            'batch1_median_ms':b1['median_batch_ms'],'batch1_p95_ms':b1['p95_batch_ms'],
            'batch64_median_ms':b64['median_batch_ms'],'batch64_derived_examples_per_second':b64['derived_examples_per_second']})
        write_json(output/f'{name}_predictions.json',{'test_indices':te,'targets':y[te],**quality})
    frontier=[]
    for row in rows:
        dominated=any(other['test_accuracy']>=row['test_accuracy'] and
            other['raw_float_parameter_bytes']<=row['raw_float_parameter_bytes'] and
            (other['test_accuracy']>row['test_accuracy'] or other['raw_float_parameter_bytes']<row['raw_float_parameter_bytes'])
            for other in rows)
        if not dominated: frontier.append(row['method'])
    table_csv(output/'tradeoffs.csv',rows);write_json(output/'raw_timings.json',timings)
    table_csv(output/'teacher_history.csv',teacher_history);table_csv(output/'hard_student_history.csv',hard_history)
    table_csv(output/'distilled_student_history.csv',distill_history)
    fig,ax=plt.subplots(figsize=(8,5))
    for row in rows:
        ax.scatter(row['raw_float_parameter_bytes'],row['test_accuracy'])
        ax.annotate(row['method'],(row['raw_float_parameter_bytes'],row['test_accuracy']),fontsize=7,xytext=(3,4),textcoords='offset points')
    ax.set(xlabel='Raw runtime float parameter bytes (not peak RAM)',ylabel='Test accuracy')
    fig.tight_layout();fig.savefig(output/'quality_storage.svg');plt.close(fig)
    write_json(output/'protocol.json',{'seed':seed,'student_seed':seed+1,'split_seed':split_seed,'split_sha256':digest,
        'teacher_selected_epoch':teacher_epoch,'hard_student_selected_epoch':hard_epoch,'distilled_selected_epoch':distill_epoch,
        'student_selection':'validation macro F1; same 35 epochs and initialization/order seed',
        'distillation':{'T':2.,'soft_weight':.5,'teacher_frozen_check':'passed'},
        'pruning':prune_info,'quantization':quant_info,'svd':rank_info,'lora':lora_check(),
        'measurement':'CPU, one PyTorch thread, model-only inference; 20 warmups, 100 calls, batch 1/64',
        'not_measured':['peak process/device memory','energy','network','integer inference'],
        'frontier_accuracy_vs_float_parameter_bytes':frontier,'tradeoffs':rows})
    return rows


if __name__=='__main__':
    args=arguments(__doc__);record_environment(args.output,args.seed)
    print(run(args.seed,args.split_seed,args.output))
