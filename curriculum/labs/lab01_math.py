"""Checked original examples: shapes, least squares, derivatives, SVD and uncertainty."""
import numpy as np
from common import arguments, record_environment, write_json, paired_bootstrap


def run(seed=7):
    X=np.array([[1.,2.],[3.,4.]])
    W=np.array([[2.,-1.],[0.,3.]])
    z=X@W+np.array([1.,-2.])
    np.testing.assert_allclose(z, [[3,3],[7,7]])
    # Unequal batch/output dimensions prevent an accidental square-shape shortcut.
    batch=np.array([[1.,2.],[3.,4.],[5.,6.]])
    weights=np.array([[2.,-1.,0.,3.],[0.,3.,1.,2.]])
    np.testing.assert_allclose((batch@weights)[0], [2.,5.,2.,7.])
    assert (batch@weights).shape == (3,4)
    assert (np.zeros(5)-np.zeros((5,1))).shape == (5,5)

    A=np.column_stack([np.ones(3),np.arange(3.)]); y=np.array([1.,2.,2.])
    theta,_,rank,s=np.linalg.lstsq(A,y,rcond=None)
    residual=A@theta-y
    np.testing.assert_allclose(theta,[7/6,1/2])
    np.testing.assert_allclose(A.T@residual,0,atol=1e-12)
    np.testing.assert_allclose(residual@residual,1/6)

    target=np.array([1.,2.]); w=np.array([.2,-.1])
    def loss(v): return np.mean((X@v-target)**2)/2
    analytic=X.T@(X@w-target)/len(target)
    numeric=np.zeros_like(w)
    for j in range(len(w)):
        delta=np.zeros_like(w);delta[j]=1e-5
        numeric[j]=(loss(w+delta)-loss(w-delta))/(2e-5)
    np.testing.assert_allclose(analytic,numeric,rtol=1e-6,atol=1e-8)
    assert loss(w-.01*analytic)<loss(w)

    matrix=np.diag([5.,2.,1.]);u,s,vt=np.linalg.svd(matrix,full_matrices=False)
    reconstruction=(u[:,:1]*s[:1])@vt[:1]
    error=float(np.linalg.norm(matrix-reconstruction,'fro')**2)
    np.testing.assert_allclose(error,5.)
    def descent(eta):
        point=1.; path=[point]
        for _ in range(8): point-=eta*4*point;path.append(point)
        return path
    stable,unstable=descent(.1),descent(.6)
    assert abs(stable[-1])<.02 and abs(unstable[-1])>1
    a=np.array([1]*80+[1]*5+[0]*10+[0]*5)
    b=np.array([1]*80+[0]*5+[1]*10+[0]*5)
    comparison=paired_bootstrap(a,b,seed)
    np.testing.assert_allclose(comparison['mean_difference'],.05)
    return {'affine_output':z,'least_squares':theta,'rank':int(rank),
      'gradient':analytic,'finite_difference':numeric,
      'gradient_max_absolute_error':float(np.abs(analytic-numeric).max()),
      'rank_one_squared_error':error,'stable_trajectory':stable,
      'unstable_trajectory':unstable,'paired_comparison':comparison,
      'checks':'passed','scope':'Original mathematical examples, not a paper reproduction.'}


if __name__=='__main__':
    args=arguments(__doc__);record_environment(args.output,args.seed)
    result=run(args.seed);write_json(args.output/'math.json',result)
    print('Math checks passed. Results:',args.output/'math.json')
