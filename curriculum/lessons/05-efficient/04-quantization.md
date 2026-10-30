# Quantization: representation error and actual execution

**Core time:** 120 minutes. **Prerequisites:** numerical precision and resource measurement. **Outcomes:** implement a simple quantizer; calculate clipping/rounding error; distinguish weight storage from integer inference; explain calibration and quantization-aware training.

## 1. A quantizer maps a continuous range to a finite codebook

Uniform affine quantization represents a real value approximately as a scale times an integer offset from a zero point. The code is rounded and clipped to the allowed integer range. Scale sets the spacing between representable values; clipping bounds the range. Both create error, and a few outliers can force a scale that is too coarse for most values.

```math
q=\operatorname{clip}(\operatorname{round}(x/s)+z,q_{min},q_{max}),
\qquad \hat x=s(q-z).
```

Symmetric quantization often uses zero point zero and a signed range; asymmetric quantization can represent an offset range. Per-tensor scaling shares one scale across a tensor, while per-channel scaling uses separate scales. Specify the axis and metadata format. “INT8” alone does not describe all these decisions.

## 2. Worked example: a symmetric weight quantizer

Use signed codes from -127 to 127 and choose `scale=max(abs(weight))/127`. For weights `[-1,0,0.5,1]`, the endpoints are represented exactly and the middle positive value is rounded to a neighboring code. Without clipping, nearest rounding produces at most half a scale of reconstruction error. A zero tensor needs an explicit nonzero scale convention to avoid division by zero.

```python
import numpy as np
w = np.array([-1.,0.,.5,1.],dtype=np.float32)
scale = max(float(np.abs(w).max())/127,np.finfo(np.float32).tiny)
q = np.clip(np.rint(w/scale),-127,127).astype(np.int8)
restored = q.astype(np.float32)*scale
assert np.max(np.abs(restored-w)) <= scale/2+1e-7
print(q,scale,restored)
```

The integer codes occupy one byte each, but the scale and any zero point also need storage. A file/container adds metadata. If restored weights are used by float32 matrix multiplication, inference is still floating-point execution; only the storage representation and parameter approximation were changed.

## 3. Weight-only simulation is not an integer kernel benchmark

The core lab quantizes weight tensors, saves integer codes and scales, then dequantizes to float32 for evaluation. It reports the packed artifact size and approximation effect separately from the float runtime model. Its latency measurement is explicitly labeled dequantized float inference. This prevents a common false claim: observing a smaller file and calling it faster INT8 inference without using an integer backend.

Actual integer inference must handle activation scales, accumulator precision, requantization, bias representation and supported operators. Backend/compiler support determines whether operations stay quantized or repeatedly convert. A conversion-heavy graph can lose the expected benefit. Validate the actual execution path before making a speed or energy claim.

## 4. Calibration and quantization-aware training

Post-training activation quantization often estimates ranges from representative calibration data. Those data belong to development, not the final test set. Poorly representative calibration can produce clipping on future inputs. Range-estimation choices and outlier handling are hyperparameters that should be recorded.

Quantization-aware training simulates quantization effects during optimization, often using a surrogate gradient for the nondifferentiable rounding operation. That surrogate is an optimization device, not the true derivative of rounding almost everywhere. The resulting artifact still needs conversion and backend validation. It should be compared with a baseline under a stated training budget.

## 5. Error should be measured at multiple levels

Measure weight reconstruction error, changes in logits and predictive quality. Small average weight error can still alter a decision near a boundary. Check classwise performance and calibration when relevant. Report saturation/clipping rates for activations if using them. A model with acceptable average accuracy can fail badly on rare but important input ranges.

## Exercises and self-check

1. Quantize an all-zero tensor and explain your scale convention. **Check:** avoid division by zero while restoring exact zeros.
2. If scale is 0.02 and no clipping occurs, what is the usual nearest-rounding absolute error bound? **Check:** 0.01, apart from finite-precision implementation tolerance.
3. Compare per-tensor and per-row scales on a matrix with one outlier row. Count scale metadata and reconstruction error.
4. Explain why the lab's packed artifact size and float inference latency cannot be combined into an “INT8 speedup” claim.

## Primary reading

- [Jacob et al.: Quantization and Training of Neural Networks for Efficient Integer-Arithmetic-Only Inference](https://arxiv.org/abs/1712.05877): inspect scale/zero-point arithmetic and the difference between training simulation and integer execution.
- [Han et al.: Deep Compression](https://arxiv.org/abs/1510.00149): compare quantized representations with pruning and coding stages.
