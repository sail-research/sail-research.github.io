"""Small CPU neural models; training/selection never inspect test observations."""
from copy import deepcopy
import numpy as np
import torch
from torch import nn
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix, log_loss


def setup(seed):
    torch.set_num_threads(1)
    torch.manual_seed(seed)
    torch.use_deterministic_algorithms(True)


def make_model(kind='mlp',width=32):
    if kind=='mlp':
        return nn.Sequential(nn.Linear(64,width),nn.ReLU(),nn.Linear(width,10))
    if kind=='cnn':
        return nn.Sequential(nn.Unflatten(1,(1,8,8)),nn.Conv2d(1,8,3,padding=1),
            nn.ReLU(),nn.MaxPool2d(2),nn.Flatten(),nn.Linear(128,10))
    raise ValueError('Unknown architecture')


def logits(model,X):
    model.eval()
    with torch.no_grad(): return model(torch.as_tensor(X,dtype=torch.float32)).cpu().numpy()


def metrics(model,X,y):
    z=logits(model,X)
    prob=torch.as_tensor(z).softmax(-1).numpy();pred=prob.argmax(-1)
    cm=confusion_matrix(y,pred,labels=np.arange(10))
    assert cm.sum()==len(y) and np.isfinite(prob).all()
    return {'accuracy':float(accuracy_score(y,pred)),
        'macro_f1':float(f1_score(y,pred,average='macro',zero_division=0)),
        'negative_log_likelihood':float(log_loss(y,prob,labels=np.arange(10))),
        'confusion_matrix':cm,'predictions':pred,'probabilities':prob}


def train_model(Xtrain,ytrain,Xval,yval,seed=7,kind='mlp',width=32,epochs=35,lr=.003):
    setup(seed);model=make_model(kind,width)
    optimizer=torch.optim.AdamW(model.parameters(),lr=lr,weight_decay=1e-4)
    X=torch.as_tensor(Xtrain,dtype=torch.float32);y=torch.as_tensor(ytrain,dtype=torch.long)
    generator=torch.Generator().manual_seed(seed+123)
    history=[];best_score=-1.;best_state=None;best_epoch=None
    for epoch in range(1,epochs+1):
        model.train();order=torch.randperm(len(y),generator=generator)
        total_loss=0.
        for batch in order.split(64):
            optimizer.zero_grad(set_to_none=True)
            loss=nn.functional.cross_entropy(model(X[batch]),y[batch])
            if not torch.isfinite(loss): raise FloatingPointError('Non-finite training loss')
            loss.backward();optimizer.step()
            total_loss+=float(loss.detach())*len(batch)
        validation=metrics(model,Xval,yval)
        score=validation['macro_f1']
        history.append({'epoch':epoch,'training_loss':total_loss/len(y),
            'validation_accuracy':validation['accuracy'],'validation_macro_f1':score})
        if score>best_score:
            best_score=score;best_state=deepcopy(model.state_dict());best_epoch=epoch
    model.load_state_dict(best_state);model.eval()
    return model,history,best_epoch
