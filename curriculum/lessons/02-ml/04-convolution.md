# Convolutional networks: locality, shared weights and shapes

**Core time:** 120 minutes. **Prerequisites:** affine layers and PyTorch training. **Outcomes:** compute convolution output dimensions and parameter counts; explain weight sharing; implement a small CNN; compare architectures under a declared budget.

## 1. Why preserve image structure?

Flattening an image treats all input positions as separate coordinates. A dense layer can learn useful features but does not explicitly share a detector across positions. A convolutional layer applies the same small filter at many locations. This encodes a preference for local patterns that can appear in multiple places. It reduces parameters relative to a fully connected map of similar spatial size, but does not guarantee better performance for every task.

Deep-learning libraries commonly implement cross-correlation, without reversing the kernel, under the name convolution. A learned filter can still represent the needed patterns; the convention matters when manually reproducing a numerical result. A filter spans all input channels and produces one output channel. Multiple filters create multiple learned feature maps.

## 2. Compute dimensions before running code

For one spatial dimension with input size H, kernel k, padding p, stride s and dilation d, the output size follows the formula below. Apply it independently to height and width. Padding adds boundary values; stride controls sampling locations; dilation spaces filter taps. Their effects are not interchangeable.

```math
H_{out}=\left\lfloor\frac{H+2p-d(k-1)-1}{s}+1\right\rfloor,
\qquad P=C_{out}(C_{in}k_hk_w+1)
```

The parameter formula includes one bias per output channel; remove that term when bias is disabled. With one input channel, eight output channels and 3-by-3 kernels, there are `8*(9+1)=80` parameters. An 8-by-8 input with padding 1 and stride 1 remains 8-by-8. A 2-by-2 pooling operation with stride 2 reduces it to 4-by-4.

## 3. Worked example: one filter response

Take a 3-by-3 patch `[[1,2,3],[4,5,6],[7,8,9]]` and a filter with -1 in its left column, 0 in the middle and 1 in the right. The response is `(-1+3)+(-4+6)+(-7+9)=6`, before bias or activation. This filter responds to a horizontal intensity change. A learned CNN need not learn exactly this filter, but a manual response check confirms indexing conventions.

```python
import torch
from torch import nn
patch = torch.arange(1.,10.).reshape(1,1,3,3)
kernel = torch.tensor([[-1.,0.,1.],[-1.,0.,1.],[-1.,0.,1.]]).reshape(1,1,3,3)
response = torch.nn.functional.conv2d(patch,kernel)
assert response.item() == 6
model = nn.Sequential(nn.Conv2d(1,8,3,padding=1),nn.ReLU(),
    nn.MaxPool2d(2),nn.Flatten(),nn.Linear(8*4*4,10))
assert model(torch.zeros(5,1,8,8)).shape == (5,10)
print(sum(p.numel() for p in model.parameters()))
```

The total parameter count is 80 plus `128*10+10`, giving 1,370. Pooling and ReLU have no learned scalar parameters in this architecture. They still perform computation and can affect accuracy, so parameter count alone is not a complete cost measure.

## 4. Receptive fields and invariance need careful language

Stacking local operations grows the region of the input that can influence an output. For stride-one 3-by-3 layers without dilation, two layers have a 5-by-5 theoretical receptive field. Strides and pooling change the spacing between receptive-field centers. The theoretical receptive field only identifies possible influence, not the magnitude of learned influence.

Convolution is translation equivariant under suitable idealized boundary and stride conditions: translating the input translates the feature map. Classification invariance requires additional design or learning and is not exact under every crop, padding rule and downsampling. Do not claim “CNNs are invariant to rotation” merely because convolution shares weights. Data augmentation can encourage particular robustness, but should reflect legitimate label-preserving transformations.

## 5. Compare fairly on tiny images

An 8-by-8 digit has little spatial resolution. Repeated pooling can erase useful structure. A large image architecture copied unchanged can be inappropriate. Compare a compact CNN with a simple MLP using the same split, selection metric and declared training budget. If parameter counts or optimizer schedules differ, report that instead of attributing all differences solely to “convolution.”

Run the CNN option in `lab03_neural.py` as described in the bundle README. Inspect both parameter count and validation trajectory. Treat runtime as a measurement on your CPU, with warm-up and repetitions handled in the efficiency module; one training duration is not an inference benchmark.

## Exercises and self-check

1. For H=15,k=3,p=1,s=2,d=1, find output size. **Check:** 8.
2. A layer has 3 input channels, 16 output channels and 5-by-5 filters with bias. Count parameters. **Check:** `16*(75+1)=1,216`.
3. Why can an unstructured sparse convolution have unchanged dense-kernel latency? **Check:** zeros do not automatically change the operator or hardware workload.
4. Implement a shifted-input test away from boundaries, then show how stride or padding changes the correspondence. Explain which equivariance claim your test actually examines.

## Primary reading

- [PyTorch: Conv2d](https://docs.pytorch.org/docs/2.9/generated/torch.nn.Conv2d.html): verify channel conventions, cross-correlation and output dimensions.
- [Goodfellow, Bengio and Courville: Convolutional Networks](https://www.deeplearningbook.org/contents/convnets.html): study locality and parameter sharing, then connect them to the small example.
