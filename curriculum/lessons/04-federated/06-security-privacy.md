# Federated security, secure aggregation and privacy boundaries

**Core time:** 120 minutes. **Prerequisites:** threat models, DP and FedAvg. **Outcomes:** distinguish transport security, aggregation confidentiality and DP; explain cancellation of pairwise masks conceptually; identify poisoning and participation assumptions; avoid claiming security from locality alone.

## 1. Draw the information flow

Clients hold data, receive a model, compute updates and communicate with a coordinator. Ask what the coordinator, another client, a network observer or a compromised participant can see and change. Transport encryption protects a communication channel under its security assumptions, but the endpoint still receives the plaintext message. Secure aggregation can hide individual contributions while revealing an aggregate. Differential privacy bounds how released output distributions depend on a protected contribution. These mechanisms solve different problems.

Model updates can contain information about local data. A server that never downloads raw examples may still infer sensitive properties from updates or outputs. The statement “data never leave the device” therefore does not by itself establish a statistical privacy guarantee.

## 2. Worked mask-cancellation intuition

Three clients hold scalar updates a,b,c. Give each client pair a random mask with opposite signs at its two endpoints. Client A sends `a+r_ab+r_ac`, B sends `b-r_ab+r_bc`, and C sends `c-r_ac-r_bc`. Adding all three cancels masks, leaving a+b+c. The arithmetic explains the idea, not a complete secure protocol.

```python
a,b,c = 2.,5.,-1.
r_ab,r_ac,r_bc = 7.,-3.,4.
messages = [a+r_ab+r_ac,b-r_ab+r_bc,c-r_ac-r_bc]
assert sum(messages) == a+b+c
print({'masked_messages_for_public_toy_example':messages,'sum':sum(messages)})
```

These fixed public masks provide no real confidentiality. A deployable protocol needs appropriate cryptography, authenticated key establishment, dropout recovery, collusion assumptions, finite-field/encoding rules and implementation review. If one participant disappears, simple cancellation may fail; the original secure-aggregation work handles substantially more than the few lines above.

## 3. An aggregate can still reveal information

If the aggregate contains only one client's update, hiding individual messages does not hide that contribution. If an observer knows all but one contribution, the remaining one can be inferred from the sum. Repeated aggregates with changing cohorts can also reveal information depending on the protocol and observer knowledge. Minimum cohort sizes and cryptographic protections should be analyzed in the actual threat model, not treated as universal privacy guarantees.

DP may be combined with aggregation to limit contribution influence, but the clipping, noise, trust and accounting assumptions must be explicit. Record-level and user-level guarantees are different. Who generates noise, who can remove it and what the server observes before noise are central questions.

## 4. Confidentiality does not ensure honest updates

A malicious client may send a manipulated update rather than follow the prescribed training procedure. Robust aggregation, anomaly detection and validation can address some threats under specific assumptions, but no single rule is universally safe. Secure aggregation can limit inspection of individual updates, creating a design tradeoff with some detection methods. Report assumptions about the fraction of compromised clients and their knowledge/control.

Authentication limits who participates, while authorization limits what an authenticated actor can do. Neither proves that an authorized client sends a statistically benign update. A realistic deployment also needs rate limits, logging, model/version integrity and incident handling. Our local simulator does not implement those production controls and must not be represented as a secure deployment.

## 5. Audit checklist as evidence questions

For a proposed system, identify protected information, adversary access, neighboring relation if DP is claimed, minimum cohort assumptions, dropout behavior, update validation, released artifacts and residual risks. For each claimed guarantee, cite the exact mechanism and assumptions. If a property has not been tested or formally established, label it unresolved rather than assigning it a green checkmark.

## Exercises and self-check

1. Remove client C's message from the toy sum. Explain why masks no longer cancel. **Check:** pairwise terms involving C remain.
2. Why does secure aggregation not by itself prevent poisoning? **Check:** hiding a contribution does not ensure that it was computed honestly.
3. Compare server-added noise and client-added noise under a curious-server threat model. Identify what the server sees before any protection.
4. Write a precise correction to “Federated learning guarantees privacy.” **Check:** federation changes data placement; privacy depends on specified mechanisms and assumptions.

## Primary reading

- [Bonawitz et al.: Practical Secure Aggregation for Privacy-Preserving Machine Learning](https://research.google/pubs/practical-secure-aggregation-for-privacy-preserving-machine-learning/): study the protocol's setting and dropout requirements.
- [Dwork and Roth: differential privacy foundations](https://www.cis.upenn.edu/~aaroth/privacybook.html): distinguish statistical privacy from encrypted aggregation.
