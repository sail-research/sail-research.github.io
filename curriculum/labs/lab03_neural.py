"""Validation-selected MLP/CNN plus attention, gradient and checkpoint checks."""
import numpy as np
import torch
from common import arguments, digits_split, save_split, record_environment, write_json, table_csv
from neural import make_model, train_model, logits, metrics


def concept_checks():
    # Independent analytic gradient in double precision, not a copy of autograd internals.
    X=torch.tensor([[1.,2.],[3.,4.]],dtype=torch.float64)
    y=torch.tensor([1.,2.],dtype=torch.float64)
    w=torch.tensor([.2,-.1],dtype=torch.float64,requires_grad=True)
    loss=((X@w-y)**2).mean()/2;loss.backward()
    torch.testing.assert_close(w.grad,torch.tensor([-3.2,-4.6],dtype=torch.float64))
    Q=torch.eye(2);K=torch.eye(2);V=torch.tensor([[2.],[6.]])
    scores=Q@K.T/(2**.5)
    weights=scores.softmax(-1)
    torch.testing.assert_close(weights.sum(-1),torch.ones(2))
    mask=torch.triu(torch.ones(2,2,dtype=torch.bool),diagonal=1)
    causal_weights=scores.masked_fill(mask,float('-inf')).softmax(-1)
    torch.testing.assert_close((causal_weights@V)[0],V[0])
    changed=V.clone();changed[1]=1000.
    torch.testing.assert_close((causal_weights@changed)[0],(causal_weights@V)[0])
    return {'gradient':w.grad.tolist(),'attention_weights':weights.tolist(),
            'attention_output':(weights@V).tolist(),'future_token_mask_check':'passed'}


def run(seed,split_seed,output,kind='mlp',epochs=35,width=32):
    X,y,split=digits_split(split_seed);tr,va,te=(split[k] for k in ['train','validation','test'])
    digest=save_split(output,split)
    model,history,epoch=train_model(X[tr],y[tr],X[va],y[va],seed,kind,width,epochs)
    # The selection procedure above has never received test inputs or labels.
    result=metrics(model,X[te],y[te])
    torch.save(model.state_dict(),output/'model_state.pt')
    restored=make_model(kind,width)
    restored.load_state_dict(torch.load(output/'model_state.pt',map_location='cpu',weights_only=True))
    np.testing.assert_allclose(logits(model,X[te]),logits(restored,X[te]),rtol=0,atol=0)
    table_csv(output/'history.csv',history)
    write_json(output/'test_predictions.json',{'indices':te,'targets':y[te],**result})
    summary={'seed':seed,'split_seed':split_seed,'split_sha256':digest,'architecture':kind,
      'width':width,'max_epochs':epochs,'selected_epoch':epoch,'batch_size':64,'learning_rate':.003,
      'optimizer':'AdamW','weight_decay':1e-4,'selection':'validation macro F1; earliest tie',
      'parameter_count':sum(p.numel() for p in model.parameters()),
      'test_accuracy':result['accuracy'],'test_macro_f1':result['macro_f1'],
      'checkpoint_prediction_max_error':0.,'concept_checks':concept_checks()}
    write_json(output/'neural.json',summary);return summary


if __name__=='__main__':
    def configure(parser):
        parser.add_argument('--model',choices=['mlp','cnn'],default='mlp')
        parser.add_argument('--epochs',type=int,default=35)
        parser.add_argument('--width',type=int,default=32)
    args=arguments(__doc__,configure);record_environment(args.output,args.seed)
    if args.epochs<1 or args.width<1: raise ValueError('epochs and width must be positive')
    print(run(args.seed,args.split_seed,args.output,args.model,args.epochs,args.width))
