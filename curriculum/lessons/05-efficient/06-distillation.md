# Knowledge distillation: a teacher, a student and a fair comparison

**Core time:** 2 hours. **Prerequisites:** logits, cross-entropy and training loops. **Outcomes:** define a temperature-scaled distillation objective; keep the teacher frozen; compare with an equally trained hard-label student; report teacher-training cost separately.

## 1. The student learns from more than the winning class

A teacher's probability distribution can encode relative preferences among incorrect classes. A student can learn from those soft targets alongside observed labels. This can be useful when the student has fewer parameters or a different architecture, but the teacher can also transmit errors, biases or overconfidence. Distillation is a training method, not a guarantee that the student becomes both smaller and equally accurate.

Use the same legal training inputs for the hard-label and distilled students unless an additional-data regime is explicitly part of the experiment. Teacher logits on test inputs must not become training targets. A teacher selected using test labels would also contaminate the comparison.

## 2. Temperature changes the target distribution

Dividing logits by a positive temperature greater than one softens the probability distribution. The student loss can combine ordinary hard-label cross-entropy with KL divergence from teacher probabilities to student probabilities at that temperature. A conventional T-squared factor compensates for the gradient scale introduced by temperature in this formulation.

```math
L=(1-\lambda)\,CE(y,z_s)+\lambda T^2\,KL\left(p_t(T)\;\|\;p_s(T)\right).
```

State which coefficient multiplies which term; papers and code can use opposite naming conventions. KL direction also matters. In PyTorch's common `kl_div(log_student,teacher_probability)` usage, the arguments are not both raw probabilities and the student input is log probability. Read the API rather than guessing from the function name.

## 3. Worked objective calculation

Suppose hard-label loss is 0.8, KL at temperature 2 is 0.1 and lambda is 0.5. The combined loss is `0.5*0.8 + 0.5*4*0.1 = 0.6`. Omitting T-squared would give 0.45, changing the relative gradient contribution. This arithmetic does not establish the best lambda or temperature; select those on validation under a stated budget.

```python
import torch
import torch.nn.functional as F
student = torch.tensor([[1.,0.,-1.]],requires_grad=True)
teacher = torch.tensor([[2.,1.,0.]])
y = torch.tensor([0])
T,weight = 2.,.5
soft = F.kl_div(F.log_softmax(student/T,dim=-1),
               F.softmax(teacher/T,dim=-1),reduction='batchmean')*T*T
loss = (1-weight)*F.cross_entropy(student,y)+weight*soft
loss.backward()
assert torch.isfinite(student.grad).all()
assert teacher.grad is None
print(float(loss.detach()))
```

In this particular example, the two logit vectors differ by a constant, so their softened probabilities coincide and KL is approximately zero. This is a useful invariance check. Change one teacher coordinate to make the soft term nonzero and inspect the resulting gradient.

## 4. Freeze the teacher and preserve the baseline

Set the teacher to evaluation mode and compute its targets without parameter gradients. Train one student on hard labels only and another with the combined objective, matching architecture, initialization seed, optimizer, epochs and selection rule. The distillation method adds teacher forward computation, so the training compute is not identical even when student update counts match. Report that difference.

The core efficiency lab trains a width-64 teacher and width-16 students. It uses fixed illustrative temperature and mixing weight, selects checkpoints on validation and evaluates test after selection. It does not assume the distilled student wins. If it does not, inspect teacher quality, student capacity, optimization and the chosen hyperparameters before generalizing.

## 5. Account for the lifecycle

A small student may reduce deployment cost while distillation increases development cost. If the teacher already exists, amortization differs from training a new teacher solely for one small deployment. Report teacher parameters, student parameters, training procedure and inference benchmark separately. A student can mimic unwanted teacher behavior, so rerun relevant robustness, calibration and group evaluations rather than assuming compression preserves all properties.

## Exercises and self-check

1. Explain why adding a constant to every teacher logit leaves soft targets unchanged. **Check:** softmax's numerator and denominator share the same exponential factor.
2. What comparison is missing if only teacher and distilled student are reported? **Check:** the same student trained without distillation under a comparable selection/update budget.
3. Verify that teacher weights do not change during student training.
4. Design a temperature sweep using validation and state how you will avoid test-driven selection.

## Primary reading

- [Hinton, Vinyals and Dean: Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531): inspect temperature and the motivation for soft targets.
- [PyTorch: KLDivLoss](https://docs.pytorch.org/docs/2.9/generated/torch.nn.KLDivLoss.html): verify input/log-target and reduction conventions.
