# PyTorch: autograd and a complete training loop

**Core time:** 2–3 hours. **Prerequisites:** gradients, baselines and Python functions. **Outcomes:** build an MLP; explain every training-step operation; separate training/evaluation modes; save and restore a validation-selected checkpoint.

## 1. Match tensors to the task

Digit inputs are floating tensors of shape `(batch,64)` and targets are integer tensors `(batch,)`. An MLP maps the features through a hidden layer and a nonlinearity to ten raw logits. In this classification mode, cross-entropy expects those logits and integer class indices. Applying softmax first is unnecessary. Floating one-hot targets represent a different supported mode and should not appear accidentally through a dtype conversion.

A parameter is a tensor registered with a module so the optimizer can find it. The forward computation constructs a graph when gradient tracking is enabled. Backward propagates derivatives of the scalar loss through that graph and accumulates them into leaf parameters. The optimizer then reads the gradients and updates parameters. Backward does not itself perform the optimizer step.

## 2. Understand the complete step

Clear previous gradients, compute predictions, compute loss, backpropagate and update. Gradients accumulate by default, so omitting the clearing operation changes the algorithm. Accumulation can be intentional when simulating a larger batch, but losses and partial batches must be scaled consistently. Trace what happens to one weight rather than memorizing an incantation.

```python
import torch
from torch import nn
torch.manual_seed(7)
model = nn.Sequential(nn.Linear(64,32), nn.ReLU(), nn.Linear(32,10))
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
X = torch.rand(12,64)
y = torch.arange(12) % 10
model.train()
optimizer.zero_grad(set_to_none=True)
logits = model(X)
loss = nn.CrossEntropyLoss()(logits,y)
loss.backward()
assert logits.shape == (12,10)
assert all(p.grad is not None and torch.isfinite(p.grad).all()
           for p in model.parameters())
optimizer.step()
print(float(loss.detach()))
```

The random inputs verify mechanics only. `lab03_neural.py` supplies a real held-out split of the bundled digits and records a validation-selected checkpoint. Check that its parameters change after a step and that the loss remains finite before trusting its accuracy.

## 3. Evaluation mode and gradient mode are independent

`model.eval()` changes dropout and batch-normalization behavior. It does not disable gradient tracking. `torch.no_grad()` avoids building the usual backward graph but does not disable dropout. Use both for ordinary predictive evaluation. During adversarial evaluation, however, keep the network in evaluation mode while enabling input gradients; “evaluation means no gradients” is not a universal rule.

Dropout randomly masks activations during training and uses its defined deterministic inference behavior in evaluation. Batch normalization can maintain running statistics and use them during evaluation. Accidentally evaluating with training behavior may make results depend on batch composition or stochastic masks. These issues can hide behind apparently reasonable aggregate scores.

## 4. Average over the correct denominator

With 130 examples and batch size 64, batch sizes are 64,64,2. The unweighted average of three batch-mean losses gives the final two examples as much influence as each group of 64. Multiply each batch-mean loss by its batch size, sum, then divide by 130. Accuracy counts correct predictions and divides by total examples. Weighted or masked losses may use other denominators; inspect their reduction semantics before reproducing an epoch statistic.

## 5. A checkpoint records a selection decision

Select the checkpoint using a declared validation rule, such as highest validation accuracy and earliest epoch on ties. Deep-copy the best state: a reference to mutable weights can silently become the final epoch instead. Save the state dictionary together with architecture, preprocessing, selected epoch, seed and environment. Resuming training also requires optimizer/scheduler state and relevant random-generator states.

The teaching lab saves only locally created model state. Do not load arbitrary serialized checkpoints from untrusted sources. For your own checkpoint, reload it into the same architecture and compare evaluation logits within a justified tolerance. A seed is not a guarantee of bitwise equality across platforms; record device and deterministic settings.

## 6. Worked diagnosis: loss remains near log(10)

A ten-class classifier with approximately uniform probabilities has loss near `log(10)`. If it stays there, inspect target values and shapes, gradient presence, finite values and parameter changes. Try to overfit 32 examples. If the small-batch test fails, investigate a detached graph, an optimizer linked to a different model instance or labels shuffled separately from inputs. Longer training does not repair those mistakes.

## Guided lab, exercises and self-check

Run `python lab03_neural.py --output outputs/neural`, then inspect history, selected epoch and saved split. Do not tune after reading test output.

1. Call backward twice on two identical forward computations without clearing. **Check:** gradients add; this is not two optimizer updates.
2. Add dropout and compare repeated outputs with `train()` and `eval()`. **Check:** eval removes dropout randomness; `no_grad()` alone does not.
3. Reload the saved best state and report the maximum absolute difference in evaluation logits. Explain the tolerance.
4. Construct uneven batches with very different losses and expose the unweighted-batch-average error. **Check:** use example counts in the denominator.
5. Explain how you would resume a run exactly within one fixed environment. **Check:** weights alone omit optimizer, schedule, random-generator and data-order state.

## Primary reading

- [PyTorch: Learn the Basics](https://docs.pytorch.org/tutorials/beginner/basics/index.html): connect tensors, data loading, autograd and optimization into one workflow.
- [PyTorch: reproducibility](https://docs.pytorch.org/docs/2.9/notes/randomness.html): document deterministic settings and their limitations.
