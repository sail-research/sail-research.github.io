"""Training-only preprocessing, validation selection, then frozen test evaluation."""
import numpy as np
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix, log_loss
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from common import arguments, digits_split, save_split, record_environment, write_json, table_csv


def run(seed, split_seed, output):
    X,y,split=digits_split(split_seed)
    tr,va,te=(split[k] for k in ['train','validation','test'])
    split_hash=save_split(output,split)
    choices=[]; fitted=[]
    for C in [.01,.1,1.,10.]:
        model=make_pipeline(StandardScaler(),LogisticRegression(C=C,max_iter=2000,random_state=seed))
        model.fit(X[tr],y[tr])
        # Validate the fitted transform against an independent training-only statistic.
        np.testing.assert_allclose(model[0].mean_,X[tr].mean(axis=0,dtype=np.float64),atol=1e-10)
        pred=model.predict(X[va]);score=f1_score(y[va],pred,average='macro')
        choices.append({'C':C,'validation_macro_f1':float(score)})
        fitted.append(model)
    winner=max(range(len(choices)),key=lambda i:choices[i]['validation_macro_f1'])
    selected=fitted[winner]  # Earliest/smallest C wins exact ties; test has not been read.
    dummy=DummyClassifier(strategy='most_frequent').fit(X[tr],y[tr])
    rows=[]
    for name,model in [('majority',dummy),('logistic',selected)]:
        pred=model.predict(X[te]);prob=model.predict_proba(X[te])
        cm=confusion_matrix(y[te],pred,labels=np.arange(10))
        assert cm.sum()==len(te)
        np.testing.assert_allclose(prob.sum(axis=1),1.,atol=1e-7)
        rows.append({'model':name,'accuracy':float(accuracy_score(y[te],pred)),
          'macro_f1':float(f1_score(y[te],pred,average='macro',zero_division=0)),
          'negative_log_likelihood':float(log_loss(y[te],prob,labels=np.arange(10)))})
        write_json(output/f'{name}_predictions.json',{'indices':te,'targets':y[te],
          'predictions':pred,'probabilities':prob,'confusion_matrix':cm})
    table_csv(output/'validation_search.csv',choices);table_csv(output/'test_metrics.csv',rows)
    write_json(output/'protocol.json',{'seed':seed,'split_seed':split_seed,'split_sha256':split_hash,
        'selection_metric':'validation macro F1','tie_rule':'earliest candidate (smallest C)',
        'selected_C':choices[winner]['C'],'search':choices,
        'refit_on_train_plus_validation':False,'test_metrics':rows})
    return rows


if __name__=='__main__':
    args=arguments(__doc__);record_environment(args.output,args.seed)
    print(run(args.seed,args.split_seed,args.output))
