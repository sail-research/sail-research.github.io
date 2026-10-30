# Communication, participation and system budgets

**Core time:** 100–120 minutes. **Prerequisites:** federation rounds and resource units. **Outcomes:** calculate a declared payload model; distinguish bytes, rounds and wall time; identify participation bias; compare compression without ignoring metadata.

## 1. A round is not a unit of communication

Two methods with the same round count can send different numbers of models, different model sizes or different precision formats. Count uplink and downlink separately. State whether a broadcast is counted once at a server interface or once per receiving client; both conventions can be useful but are not interchangeable. Include optimizer state, indices, scales or protocol metadata when relevant.

If a model has P scalar parameters stored in b bytes each and K clients receive/send one dense model per round, a simple per-client-sum payload model is `2*K*P*b` bytes per round. This excludes transport headers, retransmissions, cryptography and other protocol state. Label it an analytical payload estimate rather than measured network traffic.

## 2. Worked accounting example

For 1,000,000 parameters, float32 and ten participating clients, downlink is 40,000,000 bytes and uplink another 40,000,000 bytes under per-client accounting. One round totals 80 MB in decimal units, or about 76.29 MiB. One hundred such rounds total 8 GB before overhead. If only uplink is compressed to one byte per parameter, the downlink remains 40 MB unless it is also changed.

```python
parameters,clients,bytes_per_scalar,rounds = 1_000_000,10,4,100
per_round = 2*parameters*clients*bytes_per_scalar
print({'payload_bytes_per_round':per_round,
       'payload_MB_per_round':per_round/1e6,
       'payload_MiB_per_round':per_round/2**20,
       'total_payload_GB':per_round*rounds/1e9})
```

A low-rank or sparse representation may transmit fewer values but needs shapes, indices, scales or factors. For an unstructured sparse update, index storage can dominate at modest sparsity. A compression ratio calculated only from retained floating values is incomplete.

## 3. More local work changes several budgets

Increasing local steps may reduce the rounds needed to reach a target validation quality while increasing client computation and drift. Compare quality against both rounds and cumulative bytes, and report local work. If time matters, measure actual wall-clock behavior in an appropriate system. A sequential CPU simulator's runtime is not the latency of parallel clients over a network.

Define time-to-target with a threshold chosen before evaluation and a maximum budget. If a method never reaches the target, report that fact rather than excluding it from the mean. The target should be based on development criteria, not selected after seeing which method wins.

## 4. Availability can bias the participating population

Suppose well-connected clients participate more often and have systematically different data. The training process may optimize their distribution disproportionately. Uniformly sampling from currently available clients is not the same as uniformly sampling from the full client population. Record eligibility, sampling probabilities, dropout handling and any reweighting assumption.

Straggler mitigation is a policy choice: waiting, deadlines, partial aggregation or asynchronous updates each changes the process. Discarding late updates may improve throughput while excluding important client groups. A benchmark that simulates random dropout independent of data does not demonstrate robustness to data-correlated availability.

## 5. Compression can introduce optimization error

Quantizing or sparsifying a client update changes the vector aggregated by the server. The error can be biased or unbiased depending on the compressor. Error-feedback methods retain residual compression error for future updates, introducing state that must be implemented and reset according to the protocol. A compressed method should be compared at matched payload or quality targets, with the same evaluation population.

## Exercises and self-check

1. A five-parameter logistic model communicates float32 weights with five clients for 30 rounds. Compute dense two-way payload. **Check:** `2*5*5*4*30=6,000` bytes under the stated per-client convention, excluding overhead.
2. Why can fewer rounds still consume more total bytes? **Check:** payload per round or participating-client count may increase.
3. Design a participation experiment where availability depends on class mixture. State how it differs from independent random dropout.
4. A sparse update sends 100 float32 values and 100 int32 indices. What is the minimum represented payload before other metadata? **Check:** 800 bytes, not 400.

## Primary reading

- [McMahan et al.: communication-efficient federation](https://proceedings.mlr.press/v54/mcmahan17a.html): identify which communication reduction is measured in the original experiments.
- [Suresh et al.: Distributed Mean Estimation with Limited Communication](https://proceedings.mlr.press/v70/suresh17a.html): study the relationship between communication and aggregation error.
