# AXPT Readiness Matrix
Operational readiness framework for real-value deployment.

---

## Status Legend

- NOT STARTED
- IN PROGRESS
- NEEDS REVIEW
- PASSED
- BLOCKED

---

## Severity Legend

- BLOCKER → Must be resolved before real funds / pilot
- HIGH → Critical before scale / broader operations
- MEDIUM → Important but non-blocking for limited pilot
- LOW → Enhancement / refinement

---

# Tier 1 — Authority & Trust Boundary

| ID | Requirement | Severity | Owner | Evidence | Exit Criterion | Status | Target Date | Notes |
|----|-------------|----------|-------|----------|----------------|--------|-------------|-------|
| A1 | Unified Authentication Model | BLOCKER | Core Dev | Auth/session architecture review pending | Single canonical auth/session system across admin/treasury/ops; no parallel legacy/dev auth paths in production | IN PROGRESS | TBD | Multiple auth/session paths currently exist |
| A2 | Role-Based Authorization | BLOCKER | Core Dev | Permission audit pending | Centralized role/permission enforcement across backend routes and UI | IN PROGRESS | TBD | Treasury/admin/elder checks partially fragmented |
| A3 | Sensitive Action Protection | HIGH | Core Dev | Command/intent review pending | High-risk actions require confirmation/logging and proper privilege enforcement | IN PROGRESS | TBD | Partial simulation/confirm flow exists |

---

# Tier 2 — Ledger / Value Integrity

| ID | Requirement | Severity | Owner | Evidence | Exit Criterion | Status | Target Date | Notes |
|----|-------------|----------|-------|----------|----------------|--------|-------------|-------|
| L1 | Integer/Base Unit Accounting | BLOCKER | Core Dev | Wallet service review found legacy float conversion path | All critical financial logic uses only base units / precise decimals; no JS float contamination in value logic | IN PROGRESS | TBD | Current transfer path still converts to legacy float in places |
| L2 | Concurrency Safety | BLOCKER | Core Dev | Not yet tested | Concurrent balance/debit/credit operations proven safe under race/load testing | NOT STARTED | TBD | Requires transactional audit/load testing |
| L3 | Idempotent Financial Operations | BLOCKER | Core Dev | Partial idempotency patterns present | All financial operations retry/replay safe with enforced idempotency keys | IN PROGRESS | TBD | Needs full-path verification |

---

# Tier 3 — Chain / Settlement Correctness

| ID | Requirement | Severity | Owner | Evidence | Exit Criterion | Status | Target Date | Notes |
|----|-------------|----------|-------|----------|----------------|--------|-------------|-------|
| C1 | Canonical Mirror Encoding Spec | HIGH | Core Dev | TokenType decoding under refinement | Encoding/decoding spec finalized and verified against real chain events | IN PROGRESS | TBD | Mirror encoding still stabilizing |
| C2 | Reliable Chain Sync Cursor | HIGH | Core Dev | Sync state active | Chain sync cursor proven replay-safe and duplicate-safe | IN PROGRESS | TBD | Needs hardened verification |
| C3 | Reconciliation Against Chain | HIGH | Core Dev | Three-layer reconciliation live | Ledger/mirror/chain reconcile deterministically in real scenarios | IN PROGRESS | TBD | Functional but not battle-tested |

---

# Tier 4 — Contract / Asset Safety

| ID | Requirement | Severity | Owner | Evidence | Exit Criterion | Status | Target Date | Notes |
|----|-------------|----------|-------|----------|----------------|--------|-------------|-------|
| S1 | Final Token Architecture Chosen | HIGH | Core Dev | Stablecoin direction mostly set | Single canonical production token architecture finalized | IN PROGRESS | TBD | Parallel experimentation still narrowing |
| S2 | Access Controls Hardened | BLOCKER | Core Dev | Contract audit pending | All privileged contract actions reviewed and secured | NEEDS REVIEW | TBD | Must review before deployment |
| S3 | Contract Test Coverage | BLOCKER | Core Dev | Only minimal bridge tests present | Critical contracts covered by unit/invariant/integration/fork tests | NOT STARTED | TBD | Current test suite insufficient for production |

---

# Tier 5 — Failure / Incident Safety

| ID | Requirement | Severity | Owner | Evidence | Exit Criterion | Status | Target Date | Notes |
|----|-------------|----------|-------|----------|----------------|--------|-------------|-------|
| F1 | Degraded Mode Safe | BLOCKER | Core Dev | Initial degraded mode implemented | Risky actions blocked and UI degrades safely under infra failure | IN PROGRESS | TBD | Needs broader enforcement |
| F2 | Circuit Breakers Functional | BLOCKER | Core Dev | Pause system exists but not fail-safe verified | Pause/restrict/resume proven fail-closed under degraded/failure conditions | IN PROGRESS | TBD | Feature exists; fail-safe behavior not yet proven |
| F3 | Incident Runbooks (Technical) | HIGH | Ops/Core Dev | None | Technical recovery runbooks documented/testable | NOT STARTED | TBD | Missing ops documentation |
| F4 | Incident Runbooks (Human Ops) | HIGH | Ops/Core Dev | None | Human operational procedures documented | NOT STARTED | TBD | Missing pilot/ops procedures |

---

# Tier 6 — Audit / Governance / Explainability

| ID | Requirement | Severity | Owner | Evidence | Exit Criterion | Status | Target Date | Notes |
|----|-------------|----------|-------|----------|----------------|--------|-------------|-------|
| E1 | Action Audit Trail | HIGH | Core Dev | Partial admin logging exists | All critical actions logged with actor/time/payload/result | IN PROGRESS | TBD | Needs full coverage |
| E2 | Decision Explainability | MEDIUM | Core Dev | Replay/divergence live | Intent decisions fully explainable/replayable | PASSED | TBD | Strong implementation present |
| E3 | Governance Auditability | MEDIUM | Core Dev | Governor policy logging partial | Governance/policy changes fully versioned/logged | IN PROGRESS | TBD | Still maturing |

---

# Tier 7 — Operational Readiness

| ID | Requirement | Severity | Owner | Evidence | Exit Criterion | Status | Target Date | Notes |
|----|-------------|----------|-------|----------|----------------|--------|-------------|-------|
| O1 | Operator Console Trustworthy | HIGH | Core Dev | Treasury/Admin console active | Dashboard reflects true state without misleading/stale data | IN PROGRESS | TBD | Strong foundation, still refining |
| O2 | Operator Procedures / Onboarding | MEDIUM | Ops/Core Dev | None | New operator can run system from docs/runbooks | NOT STARTED | TBD | Tribal knowledge still dominant |

---

# Tier 8 — Pilot Readiness

| ID | Requirement | Severity | Owner | Evidence | Exit Criterion | Status | Target Date | Notes |
|----|-------------|----------|-------|----------|----------------|--------|-------------|-------|
| P1 | Pilot Constraints Defined | BLOCKER | Ops/Core Dev | None | Transaction limits / participant constraints / review thresholds documented | NOT STARTED | TBD | No pilot policy defined |
| P2 | Human Oversight Required | BLOCKER | Core Dev | Partial autonomous gating exists | No unsupervised value execution during pilot | IN PROGRESS | TBD | Must hard-enforce before pilot |

---

# Tier 9 — External Dependency / Vendor Risk

| ID | Requirement | Severity | Owner | Evidence | Exit Criterion | Status | Target Date | Notes |
|----|-------------|----------|-------|----------|----------------|--------|-------------|-------|
| D1 | Database Provider Reliability Understood | HIGH | Core Dev | Neon incidents observed | DB provider limitations/failure modes documented and mitigated | IN PROGRESS | TBD | Active Neon considerations |
| D2 | RPC Provider Reliability | HIGH | Core Dev | TBD | RPC fallback/redundancy strategy documented | NOT STARTED | TBD | No failover yet |
| D3 | Critical Notification Reliability | MEDIUM | Core Dev | Partial email infra | Critical alerts resilient beyond single provider | NOT STARTED | TBD | Needs redundancy planning |
| D4 | Custodian / Exchange Dependency Risk | HIGH | Ops/Core Dev | TBD | Manual fallback/escalation paths documented | NOT STARTED | TBD | Critical for settlement operations |

---