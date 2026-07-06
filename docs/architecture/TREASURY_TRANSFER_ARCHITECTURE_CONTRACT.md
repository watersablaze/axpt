# AXPT Treasury Gateway

## Treasury Transfer Architecture Contract

**Status:** Architectural contract  
**Scope:** AXPT Treasury Gateway  
**Governing sequence:**

```text
INTENT
→ AUTHORITY
→ CAPACITY
→ PLANNING
→ EXECUTION
→ EXTERNAL REALITY
→ EVIDENCE
→ OUTCOME
```

---

# 1. Purpose

This contract defines the architectural law for governed value movement inside the AXPT Treasury Gateway.

It exists to prevent Treasury intent, planning, execution, external rail behavior, operator surfaces, and finality from collapsing into one authority.

The Treasury Gateway governs value movement.

External systems may:

```text
act
report
fail
return evidence
```

They do not define Treasury truth.

---

# 2. Governing Invariant

```text
The Gateway owns lifecycle law.

Adapters own operational jurisdiction.

External systems own external reality.

Reconciliation determines what that reality proves.
```

Only Gateway domain law may advance authoritative Treasury state.

No worker, adapter, bank, wallet, provider, queue, operator surface, or external status may directly declare Gateway finality.

---

# 3. Canonical Architecture

The canonical flow is:

```text
PROGRAM / COMMERCIAL AUTHORITY
        ↓
TREASURY TRANSFER
        ↓
TRANSFER AUTHORITY
        ↓
TRANSFER CAPACITY ASSESSMENT
        ↓
TREASURY EXECUTION PLAN
        ↓
EXECUTABLE TRANCHE
        ↓
FX / SETTLEMENT / ESCROW INSTRUCTIONS
        ↓
TREASURY EXECUTION
        ↓
ADAPTER CUSTODY
        ↓
EXTERNAL REALITY
        ↓
OBSERVATION
        ↓
RECONCILIATION
        ↓
EXECUTION STATE ADVANCEMENT
        ↓
TRANSFER STATE ADVANCEMENT
        ↓
SETTLEMENT / ESCROW / RELEASE OUTCOME
```

The system must not move directly from broad Treasury intent into operational execution.

---

# 4. Ownership of Truth

## 4.1 Treasury Gateway

The Treasury Gateway owns:

```text
Treasury lifecycle law
transfer state
execution state
state-transition rules
authority posture
capacity posture
planning posture
evidence interpretation
finality rules
```

## 4.2 ExecutionTruthKernel

ExecutionTruthKernel remains the execution decision kernel for privileged execution decisions.

It does not replace Treasury domain law.

The relationship is:

```text
Treasury Gateway
→ determines what action is lawful and eligible
→ requests privileged execution decision
→ ETK evaluates execution decision
→ executor performs authorized action
→ external reality returns evidence
→ Treasury reconciliation determines what may advance
```

ETK must not invent:

```text
TreasuryTransfer state
TransferAuthority state
TransferCapacityAssessment results
TreasuryExecutionPlan structure
SettlementInstruction identity
Escrow funding finality
Release authority
```

## 4.3 Command Center

The Command Center may:

```text
observe
request
approve
intervene
```

It must not:

```text
invent Treasury state
mutate Gateway aggregates directly
interpret raw persistence rows as final Treasury truth
bypass Control API or domain orchestration for privileged actions
```

The lawful operator path is:

```text
Command Center
→ Control API
→ Treasury Gateway domain orchestration
→ ETK where privileged execution decision is required
→ execution / adapter layer
```

## 4.4 Adapters

Adapters translate Gateway intent into rail-specific operations.

Adapters may:

```text
accept governed handoff
translate canonical instructions
invoke external systems
retain operational custody evidence
observe external status
return typed evidence
```

Adapters may not:

```text
authorize Treasury intent
change transfer capacity
declare transfer finality
rewrite Gateway lifecycle state
manufacture release authority
```

---

# 5. Existing Authority Foundations

The upper Treasury architecture must build on existing Gateway domains rather than recreate them.

## 5.1 TreasuryInstruction

`TreasuryInstruction` may provide authenticated and approved instruction authority.

It answers:

```text
What has been instructed?
Who submitted it?
How was it authenticated?
Was it approved?
```

A TreasuryTransfer may reference or derive authority from one or more lawful Treasury instructions.

A TreasuryInstruction is not itself a transfer.

## 5.2 TreasuryAllocation

`TreasuryAllocation` provides bounded program or capital authority.

It answers:

```text
What capital has been allocated?
For what purpose?
From which program account?
How much remains available?
```

A TreasuryTransfer may consume or depend on allocation authority.

A TreasuryAllocation does not execute movement.

## 5.3 ProgramCapitalReceipt

`ProgramCapitalReceipt` provides declared, verified, and recognized capital evidence.

It answers:

```text
What value was reported received?
What amount was verified?
What amount was recognized?
What evidence supports the receipt?
```

A TreasuryTransfer may use recognized capital as source-funds evidence.

A ProgramCapitalReceipt does not by itself establish transfer authority.

## 5.4 Composition Rule

Existing foundations feed the upper Treasury law:

```text
TreasuryInstruction
→ may provide authenticated instruction authority

TreasuryAllocation
→ may provide bounded program or capital authority

ProgramCapitalReceipt
→ may provide verified and recognized capital evidence

TreasuryTransfer
→ composes relevant authority and evidence into intended value movement
```

No new upper-layer domain may duplicate these responsibilities without explicit architectural review.

---

# 6. TreasuryTransfer

`TreasuryTransfer` is the canonical expression of intended value movement.

It answers:

```text
What value movement are we trying to accomplish?
```

It may own:

```text
identity
reference
purpose
program relationship
source
destination
requested amount
currencies
authority posture
capacity posture
planning relationships
aggregate settlement posture
aggregate escrow posture
aggregate release posture
completion posture
```

It must not directly:

```text
mutate wallet balances
mutate bank balances
mutate FX balances
mutate escrow balances
submit rail-specific instructions
perform adapter operations
```

TreasuryTransfer expresses intended movement.

It is not the operational actuator.

---

# 7. TransferAuthority

`TransferAuthority` determines whether a TreasuryTransfer may proceed and within what bounds.

It may evaluate:

```text
program authority
authenticated Treasury instructions
approved Treasury allocations
party authority
authorized signers
transaction purpose
jurisdictional constraints
internal approvals
limits
expiry
```

It answers:

```text
May this transfer proceed?
For what amount?
Under which authority?
Until when?
```

Authority does not prove funds availability.

Authority does not prove market capacity.

Authority does not execute movement.

---

# 8. TransferCapacityAssessment

`TransferCapacityAssessment` determines what portion of an intended transfer is operationally eligible to move.

The governing rule is:

```text
funds exist
≠
funds can move now
```

A capacity assessment may include:

```text
SourceFundsCapacity
AuthorityCapacity
ComplianceCapacity
ConversionCapacity
RailCapacity
CounterpartyCapacity
SettlementCapacity
EscrowCapacity
ProgramCapacity
```

General computation:

```text
executableNow
=
minimum of all applicable constraints
```

For same-currency transfers:

```text
ConversionCapacity = NOT_REQUIRED
```

A capacity assessment should be treated as bounded evidence, not as permission to mutate balances.

---

# 9. TreasuryExecutionPlan

`TreasuryExecutionPlan` determines how an authorized and capacity-bounded transfer will be decomposed into operational work.

Capacity answers:

```text
What is possible?
```

Planning answers:

```text
How will we carry it out?
```

A plan may define:

```text
strategy
execution windows
rail sequence
conversion sequence
settlement sequence
tranche structure
dependencies
deferred capacity
supersession relationships
```

A TreasuryExecutionPlan must not directly perform execution.

The plan describes and bounds action.

---

# 10. ExecutableTranche

An `ExecutableTranche` is a bounded portion of a TreasuryTransfer that has become presently actionable.

It may define:

```text
amount
currency
window
capacity basis
plan relationship
rail constraints
instruction relationships
```

An ExecutableTranche does not execute itself.

The lawful corridor is:

```text
approved executable tranche
        ↓
execution eligibility / authorization law
        ↓
TreasuryExecution creation
```

An ExecutableTranche may authorize or request TreasuryExecution creation only through explicit Gateway law.

---

# 11. SettlementInstruction

`SettlementInstruction` preserves stable external settlement intent.

The governing distinction is:

```text
SettlementInstruction
≠
attempt to submit SettlementInstruction
```

A SettlementInstruction may own:

```text
transfer relationship
amount
currency
debtor
creditor
purpose
end-to-end reference
remittance information
validity posture
```

A TreasuryExecution may perform:

```text
SUBMIT_SETTLEMENT_INSTRUCTION
```

If submission fails:

```text
SettlementInstruction survives.
TreasuryExecution may fail.
A later TreasuryExecution may retry.
```

This preserves:

```text
stable intent
+
repeatable operational attempts
```

---

# 12. TreasuryExecution

`TreasuryExecution` performs one governed operational act.

It answers:

```text
What exact act should happen now?
```

It owns:

```text
one operational act
execution lifecycle
adapter dispatch
custody ownership
operational evidence
execution reconciliation
execution finality
```

It must not own:

```text
transfer purpose
program authority
source-funds verification
aggregate transfer capacity
quote strategy
tranche planning
aggregate escrow lifecycle
release lifecycle
```

TreasuryExecution is the operational actuator.

It is not the Treasury domain itself.

Current execution lifecycle:

```text
CREATED
→ VALIDATING
→ READY_FOR_AUTHORIZATION
→ AUTHORIZED
→ QUEUED
→ INITIATED
→ CONFIRMED
```

Execution state advances from evidence rather than operational claims.

---

# 13. Reconciliation

Reconciliation is the evidence return path.

The canonical pattern is:

```text
unfinished governed object
        ↓
discover
        ↓
identify lawful observer / custodian
        ↓
load external evidence
        ↓
interpret evidence under domain-specific law
        ↓
advance state if warranted
        ↓
persist durable history
```

The adapter changes.

The reconciliation pattern remains.

Examples:

```text
INTERNAL_WALLET
→ TreasuryAction evidence
→ paired ledger evidence
→ execution advancement
```

```text
FX_PROVIDER
→ execution report
→ sold amount / bought amount / rate / fees
→ FX state advancement
```

```text
BANK_SETTLEMENT
→ accepted / in flight / credited / returned
→ amount / currency / reference matching
→ settlement state advancement
```

```text
ESCROW_BANK
→ observed credit
→ arrangement / reference / currency / amount matching
→ escrow funding advancement
```

Reconciliation determines what evidence proves.

It does not merely copy external status.

---

# 14. State Advancement Law

The following distinctions are mandatory:

```text
FX executed
≠
settlement completed
```

```text
SWIFT or bank instruction sent
≠
beneficiary credited
```

```text
beneficiary credited
≠
escrow funded
```

```text
escrow funded
≠
release authorized
```

```text
execution finality
≠
transfer finality
```

Execution evidence may feed transfer advancement.

Execution finality does not automatically determine transfer finality.

TreasuryTransfer state must advance through its own law.

---

# 15. Conceptual Relationships

The current conceptual relationships are:

```text
TreasuryTransfer
1 → many TreasuryExecutionPlans

TreasuryExecutionPlan
1 → many ExecutableTranches

ExecutableTranche
1 → many TreasuryExecutions
```

These are conceptual relationships, not yet fixed database cardinalities.

Possible future law may include:

```text
many historical plans
→ one active plan at a time
```

or:

```text
many TreasuryExecutions
→ some attempts supersede or retry others
```

Persistence cardinality must emerge from domain design, not from this diagram alone.

---

# 16. Aggregate Boundary Discipline

The conceptual architecture is stable.

Exact aggregate boundaries are not yet final.

Do not assume that all of the following are direct children of one TreasuryTransfer aggregate:

```text
TransferAuthority
TransferCapacityAssessment
TreasuryExecutionPlan
FXQuote
FXReservation
SettlementInstruction
EscrowArrangement
ReleaseAuthority
TreasuryExecution
```

Likely independent identities may include:

```text
SettlementInstruction
EscrowArrangement
TreasuryExecutionPlan
TransferCapacityAssessment
```

Possible reasons include:

```text
reuse across transfers
immutable assessment evidence
versioned planning
retry-safe business identity
independent lifecycle law
```

Avoid creating a giant TreasuryTransfer aggregate.

---

# 17. Adapter Permissions

Adapters may:

```text
translate canonical Gateway intent
submit rail-specific operations
retain external identifiers
observe external status
return typed evidence
```

Adapters may not:

```text
create Treasury authority
expand approved capacity
change transfer intent
skip execution authorization
declare Gateway confirmation
mark escrow funded without reconciliation
mark value releasable
```

The canonical relationship is:

```text
Gateway authorizes
→ Adapter interprets
→ Operational engine executes
→ External system acts
→ Reconciliation interprets evidence
```

---

# 18. Command Center Boundary

The Command Center is an operator surface, not a Treasury authority engine.

It may receive operator-safe projections such as:

```text
current status
summary
failure posture
lifecycle history
required intervention
available lawful actions
```

It must not:

```text
read raw Prisma rows and infer finality
mutate Gateway aggregates directly
rewrite reconciliation outcomes
manufacture authority grants
bypass domain transitions
```

The Command Center gets eyes and governed controls.

It does not get ownership of Treasury truth.

---

# 19. Forbidden Architectural Shortcuts

The following are forbidden without an explicit architecture change:

```text
Command Center directly mutating Treasury state

Adapter declaring Gateway finality

Worker status being treated as settlement proof

TreasuryExecution absorbing transfer intent or planning law

TreasuryTransfer directly mutating balances

SettlementInstruction being recreated for every retry

FX execution being treated as settlement

Settlement being treated as escrow funding

Escrow funding being treated as release authority

External rail integration preceding internal authority law

Bank-specific or provider-specific models becoming canonical Treasury models

A single completed boolean collapsing conversion, settlement, escrow, and release
```

---

# 20. Required Build Sequence

The next build sequence is:

```text
1. Define TreasuryTransfer

2. Define TransferAuthority

3. Define TransferCapacityAssessment

4. Define TreasuryExecutionPlan

5. Define ExecutableTranche

6. Permit an approved executable tranche to authorize or request TreasuryExecution creation

7. Define SettlementInstruction

8. Add external settlement adapter contract

9. Add settlement observations

10. Define EscrowArrangement

11. Add escrow funding reconciliation

12. Define ReleaseAuthority

13. Integrate a real bank / FX / payment provider
```

Do not connect a powerful external rail before the internal law is mature enough to govern it.

---

# 21. Final Doctrine

The Treasury Gateway is not primarily a money-moving system.

It is a system for governing value movement across:

```text
intent
authority
capacity
planning
execution
external reality
evidence
finality
```

The money rails are adapters.

The Treasury Gateway owns the law.

Reconciliation is the evidence nervous system.

TreasuryExecution is the hand that acts.

TreasuryTransfer carries the intended movement.

TreasuryExecutionPlan determines how that movement is decomposed.

SettlementInstruction preserves stable settlement intent.

External systems may act, report, and fail.

They do not invent Treasury truth.
