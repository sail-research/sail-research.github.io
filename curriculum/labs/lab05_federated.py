"""Inspectable CPU federation: weighted FedAvg, label skew, FedProx and payloads."""
import numpy as np
from scipy.special import expit
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from common import arguments, record_environment, write_json, table_csv


def gradient(X,y,w): return X.T@(expit(X@w)-y)/len(y)


def local_update(X,y,reference,steps,lr,mu=0.):
    local=reference.copy()
    for _ in range(steps): local-=lr*(gradient(X,y,local)+mu*(local-reference))
    return local


def aggregate(models,sizes):
    sizes=np.asarray(sizes,dtype=float)
    if len(sizes)==0 or (sizes<=0).any(): raise ValueError('Nonempty positive client sizes required.')
    return np.average(np.asarray(models),axis=0,weights=sizes)


def partition(indices,y,kind,seed):
    rng=np.random.default_rng(seed);K=5
    if kind=='iid': result=list(np.array_split(rng.permutation(indices),K))
    else:
        # Explicit class-allocation proportions; this is NOT a Dirichlet partition.
        proportions=np.array([.45,.30,.15,.07,.03])
        result=[[] for _ in range(K)]
        for label in [0,1]:
            pool=rng.permutation(indices[y[indices]==label])
            p=proportions if label==0 else proportions[::-1]
            boundaries=np.floor(np.cumsum(p)[:-1]*len(pool)).astype(int)
            for k,part in enumerate(np.split(pool,boundaries)): result[k].extend(part.tolist())
        result=[np.asarray(x,dtype=int) for x in result]
    flat=np.concatenate(result)
    assert all(len(x)>0 for x in result)
    assert len(np.unique(flat))==len(indices)
    np.testing.assert_array_equal(np.sort(flat),np.sort(indices))
    return result


def quality(X,y,w):
    z=X@w;pred=z>=0
    return {'accuracy':float(np.mean(pred==y)),
      'log_loss':float(np.mean(np.logaddexp(0,z)-y*z))}


def checks(X,y,clients):
    np.testing.assert_allclose(aggregate([[2.,0.],[0.,4.]],[3,1]),[1.5,1.])
    start=np.array([.1,-.1,.2,0.,.3]);lr=.1
    updates=[local_update(X[c],y[c],start,1,lr) for c in clients]
    pooled=np.concatenate(clients)
    expected=start-lr*gradient(X[pooled],y[pooled],start)
    np.testing.assert_allclose(aggregate(updates,[len(c) for c in clients]),expected,atol=1e-12)
    c=clients[0]
    np.testing.assert_allclose(local_update(X[c],y[c],start,5,lr,0),
                              local_update(X[c],y[c],start,5,lr),rtol=0,atol=0)
    np.testing.assert_array_equal(start,[.1,-.1,.2,0.,.3])


def run(seed,split_seed,output,rounds=30,steps=5):
    raw,y=make_classification(n_samples=1500,n_features=4,n_informative=3,
        n_redundant=0,n_clusters_per_class=1,class_sep=1.,flip_y=.03,random_state=seed)
    idx=np.arange(len(y));tr,rest=train_test_split(idx,test_size=.4,stratify=y,random_state=split_seed)
    va,te=train_test_split(rest,test_size=.5,stratify=y[rest],random_state=split_seed+1)
    assert not (set(tr)&set(va) or set(tr)&set(te) or set(va)&set(te))
    mean=raw[tr].mean(0);std=raw[tr].std(0);assert (std>0).all()
    X=np.column_stack([(raw-mean)/std,np.ones(len(y))])
    write_json(output/'data_protocol.json',{'generator_seed':seed,'split_seed':split_seed,
      'train':tr,'validation':va,'test':te,'training_feature_mean':mean,'training_feature_std':std,
      'non_iid':'fixed label allocations [.45,.30,.15,.07,.03] and reverse; NOT Dirichlet',
      'feature_count_with_bias':5})
    partitions={kind:partition(tr,y,kind,seed+10) for kind in ['iid','skew']}
    test_partitions={kind:partition(te,y,kind,seed+11) for kind in ['iid','skew']}
    checks(X,y,partitions['skew'])
    summaries=[];all_history=[]
    for name,kind,mu in [('fedavg_iid','iid',0.),('fedavg_skew','skew',0.),('fedprox_skew','skew',.2)]:
        clients=partitions[kind];sizes=[len(c) for c in clients];w=np.zeros(X.shape[1]);history=[]
        for round_id in range(1,rounds+1):
            local=[local_update(X[c],y[c],w,steps,.3,mu) for c in clients]
            delta_norms=[np.linalg.norm(local_w-w) for local_w in local]
            w=aggregate(local,sizes);v=quality(X[va],y[va],w)
            history.append({'method':name,'round':round_id,'validation_accuracy':v['accuracy'],
                'validation_log_loss':v['log_loss'],'mean_client_delta_l2':float(np.mean(delta_norms)),
                'cumulative_payload_bytes':round_id*2*len(clients)*w.size*4,
                'local_full_gradient_steps_per_client':round_id*steps})
        # Fixed final round; no selection on test outcomes.
        test=quality(X[te],y[te],w);client_metrics=[]
        for k,c in enumerate(test_partitions[kind]):
            correct=int(((X[c]@w>=0)==y[c]).sum())
            client_metrics.append({'client':k,'test_count':len(c),'correct':correct,
                'accuracy':correct/len(c),'positive_fraction':float(y[c].mean())})
        weighted=sum(c['correct'] for c in client_metrics)/sum(c['test_count'] for c in client_metrics)
        np.testing.assert_allclose(weighted,test['accuracy'])
        summary={'method':name,'test_accuracy':test['accuracy'],'test_log_loss':test['log_loss'],
            'macro_client_accuracy':float(np.mean([c['accuracy'] for c in client_metrics])),
            'worst_client_accuracy':float(min(c['accuracy'] for c in client_metrics)),
            'payload_bytes':history[-1]['cumulative_payload_bytes'],'rounds':rounds,'local_steps':steps,'mu':mu}
        summaries.append(summary);all_history.extend(history)
        write_json(output/f'{name}.json',{'summary':summary,'weights':w,'test_indices':te,
          'test_predictions':(X[te]@w>=0).astype(int),'test_targets':y[te],
          'train_clients':clients,'test_clients':test_partitions[kind],
          'client_train_sizes':sizes,'client_train_positive_fraction':[float(y[c].mean()) for c in clients],
          'client_metrics':client_metrics,'history':history})
    pooled=local_update(X[tr],y[tr],np.zeros(X.shape[1]),rounds*steps,.3)
    central=quality(X[te],y[te],pooled)
    write_json(output/'pooled_reference.json',{'test':central,'weights':pooled,
        'full_gradient_steps':rounds*steps,'scope':'Pooled training access; not a federated deployment.'})
    table_csv(output/'summary.csv',summaries);table_csv(output/'history.csv',all_history)
    fig,axes=plt.subplots(1,2,figsize=(10,4))
    for name in [s['method'] for s in summaries]:
        h=[r for r in all_history if r['method']==name]
        for ax,key,label in [(axes[0],'round','Round'),(axes[1],'cumulative_payload_bytes','Calculated payload bytes')]:
            ax.plot([r[key] for r in h],[r['validation_accuracy'] for r in h],label=name)
            ax.set(xlabel=label,ylabel='Validation accuracy',ylim=(0,1))
    axes[0].legend(fontsize=8);fig.tight_layout();fig.savefig(output/'federated.svg');plt.close(fig)
    write_json(output/'scope.json',{'checks':'passed','execution':'sequential single CPU process',
      'communication':'Analytical dense float32 parameter payload; uplink+downlink per client; excludes all overhead',
      'privacy_security':'No DP, cryptographic secure aggregation or malicious-client protection implemented',
      'selection':'Fixed final round; default configurations are illustrative, not tuned optima'})
    return summaries


if __name__=='__main__':
    def configure(parser):
        parser.add_argument('--rounds',type=int,default=30)
        parser.add_argument('--local-steps',type=int,default=5)
    args=arguments(__doc__,configure);record_environment(args.output,args.seed)
    if args.rounds<1 or args.local_steps<1: raise ValueError('Positive rounds/steps required.')
    print(run(args.seed,args.split_seed,args.output,args.rounds,args.local_steps))
