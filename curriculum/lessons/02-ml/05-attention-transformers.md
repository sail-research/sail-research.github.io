# Attention and Transformers: a small calculation before a large model

**Core time:** 2 hours. **Prerequisites:** matrix multiplication, softmax and neural layers. **Outcomes:** track query/key/value shapes; calculate attention weights; explain scaling, masking and positional information; distinguish a toy attention block from a trained language model.

## 1. Attention constructs a data-dependent mixture

In a sequence, a token may need information from other positions. Attention compares a query at one position with keys at candidate positions, normalizes those scores and uses the resulting weights to mix values. Queries and keys determine where to look; values determine what information is combined. They are usually learned projections of the input, not three unrelated external datasets.

For a sequence of length n and hidden width d, input X has shape `(n,d)`. Project to Q and K with key width `d_k`, and V with value width `d_v`. Scores `Q@K.T` have shape `(n,n)`. Row-wise softmax produces one distribution over key positions for each query. Multiplying it by V returns `(n,d_v)`.

```math
\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}+M\right)V.
```

M is an additive mask: permitted entries contribute zero and forbidden entries receive negative infinity in the mathematical idealization. Do not confuse a Boolean mask's library-specific convention with the additive formulation. Different APIs can interpret True differently; read the documentation for the exact function used.

## 2. Worked example with two tokens

Let Q and K both be the 2-by-2 identity and let V contain scalar values `[2,6]`. The scaled score matrix has `1/sqrt(2)` on the diagonal and zero off it. The first row's self-weight is `exp(1/sqrt(2))/(exp(1/sqrt(2))+1)`, approximately 0.6697615. Its output is approximately 3.320954, and the second output is approximately 4.679046. Neither output must equal an original value; attention mixes them.

```python
import torch
Q = torch.eye(2)
K = torch.eye(2)
V = torch.tensor([[2.],[6.]])
scores = Q@K.T / (Q.shape[-1]**0.5)
weights = scores.softmax(dim=-1)
out = weights@V
torch.testing.assert_close(weights.sum(-1),torch.ones(2))
assert out.shape == (2,1)
mask = torch.triu(torch.ones(2,2,dtype=torch.bool),diagonal=1)
causal = scores.masked_fill(mask,float('-inf')).softmax(-1)@V
torch.testing.assert_close(causal[0],V[0])
print(weights,out,causal)
```

The first causal position can see only itself, so its output is exactly 2. An all-masked row has no valid probability distribution and can produce NaNs; a valid sequence/mask construction must prevent or explicitly handle that case.

## 3. Why scale and why use multiple heads?

Under a simplified independent zero-mean unit-variance model of query/key coordinates, the variance of their dot product grows with key dimension. Dividing by its square root controls this scale. The assumptions are an intuition, not a guarantee that trained coordinates remain independent. Without reasonable score scales, softmax can become highly concentrated and gradients can become difficult to use.

Multiple heads use separate learned projections and combine the resulting outputs. They allow different learned comparisons, but a head is not automatically assigned a human-interpretable concept. Labeling one “syntax” or “fairness” requires evidence. Attention weights are internal computations and are not a universal causal explanation of a prediction.

## 4. Attention alone does not encode sequence order

Without positional information, self-attention is permutation equivariant under consistent permutation of tokens. A Transformer adds position-related information, residual connections, normalization and feed-forward sublayers. Encoder attention often permits bidirectional context; autoregressive decoder attention uses causal restrictions. Training objectives and data define the task. A matrix-multiplication demonstration is not a pretrained language model and does not show language understanding.

In straightforward full attention, an n-by-n score matrix creates quadratic storage/computation terms in sequence length. Optimized kernels can reduce materialized intermediate storage and improve runtime without changing every aspect of the underlying dense interaction pattern. Claims about memory or asymptotic behavior should name the exact implementation and quantity being measured.

## Guided implementation and exercises

Use the attention checks in `lab03_neural.py`, then:

1. Add a third token, derive the causal mask and verify that changing the future value cannot change the first output. **Check:** with correct masking the first output is independent of future V entries.
2. For batch 4, length 12, heads 3 and key width 8, state per-head Q and score shapes. **Check:** Q `(4,3,12,8)`, scores `(4,3,12,12)` under this layout.
3. Permute a sequence with no positional information and verify consistent output permutation. Add positional vectors and explain why the experiment changes.
4. Compare full and causal attention on the same input. Explain why an autoregressive benchmark would be invalid if future tokens leaked through an incorrect mask.

## Primary reading

- [Vaswani et al.: Attention Is All You Need](https://arxiv.org/abs/1706.03762): read the scaled attention and architecture definitions; distinguish our toy illustration from the paper's trained translation experiments.
- [PyTorch: scaled dot-product attention](https://docs.pytorch.org/docs/2.9/generated/torch.nn.functional.scaled_dot_product_attention.html): inspect mask and dropout semantics before replacing the explicit implementation.
