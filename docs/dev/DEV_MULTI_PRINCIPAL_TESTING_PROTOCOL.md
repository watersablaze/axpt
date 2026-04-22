# DEV_MULTI_PRINCIPAL_TESTING_PROTOCOL

## Purpose

Establish a disciplined, repeatable workflow for testing AXPT multi-principal systems locally without session contamination or authority ambiguity.

This protocol governs testing for:

- Admin / Operator flows
- Resident portal flows
- Partner onboarding / token flows
- Governance / Council actions
- Treasury / Contract approval chains
- Any route protected by canonical auth/permission guards

---

## Core Principle

> **One Browser Context = One Principal**

A browser context is any isolated cookie/session storage container.

Examples:

- Separate browsers
- Separate browser profiles
- Firefox containers
- Incognito/private window (only if isolated from other contexts)

Never test multiple principals in the same cookie jar.

---

## Recommended Browser Mapping

### Option A — Multi Browser (Preferred)

```text
Chrome   = Admin
Firefox  = Resident 1
Safari   = Resident 2
Brave    = Partner
Arc      = Council

Option B — Browser Profiles

Chrome Profile: Admin
Chrome Profile: Resident
Chrome Profile: Partner
Chrome Profile: Council

Option C — Firefox Containers

Red Container    = Admin
Blue Container   = Resident
Green Container  = Partner
Purple Container = Council


⸻

Bootstrap Routes

Each browser context must explicitly bootstrap its own session.

Admin

await fetch('http://localhost:3000/api/dev/auth/bootstrap-admin', {
  method: 'POST'
}).then(r => r.json())

Resident 1

await fetch('http://localhost:3000/api/dev/auth/bootstrap-resident', {
  method: 'POST'
}).then(r => r.json())

Resident 2

await fetch('http://localhost:3000/api/dev/auth/bootstrap-resident2', {
  method: 'POST'
}).then(r => r.json())

Partner

await fetch('http://localhost:3000/api/dev/auth/bootstrap-partner', {
  method: 'POST'
}).then(r => r.json())

Council / Elder

await fetch('http://localhost:3000/api/dev/auth/bootstrap-council', {
  method: 'POST'
}).then(r => r.json())


⸻

Mandatory Principal Verification

Before testing ANY protected route, verify the active principal.

Debug Route

await fetch('http://localhost:3000/api/debug/principal')
  .then(r => r.json())

Expected Output Shape

{
  "userId": "...",
  "email": "...",
  "roles": ["..."],
  "permissions": ["..."]
}


⸻

Verification Rule

If the principal is not what you expect:

STOP TESTING

Re-bootstrap or clear cookies first.

⸻

Standard Testing Workflows

Resident Transfer Test
	1.	Bootstrap Resident 1
	2.	Verify principal
	3.	Bootstrap Resident 2 in isolated context
	4.	Verify principal
	5.	Initialize wallets if needed
	6.	Execute transfer Resident1 → Resident2
	7.	Verify balances/journal entries

⸻

Treasury Approval Test
	1.	Bootstrap Treasury Operator
	2.	Submit treasury intent
	3.	Bootstrap Treasury Approver in separate context
	4.	Approve / reject intent

⸻

Governance Vote Test
	1.	Bootstrap Elder A
	2.	Bootstrap Elder B
	3.	Bootstrap Elder C
	4.	Submit proposal
	5.	Cast votes independently

⸻

Contract Admin Test
	1.	Bootstrap Contract Operator
	2.	Execute contract mutation route
	3.	Verify audit trail / chain mirror

⸻

Debug Route Standards

Maintain these routes in development permanently.

Principal Debug

/api/debug/principal

Returns:
	•	userId
	•	email
	•	roles
	•	permissions
	•	auth source
	•	session expiry

⸻

Session Debug

/api/debug/session

Returns:
	•	raw session payload
	•	iat
	•	exp
	•	session metadata

⸻

Wallet Debug

/api/debug/wallet/:userId

Returns:
	•	wallet
	•	balances
	•	blockchain wallet
	•	journal entries

⸻

Reset Protocol

When browser/session state becomes uncertain:

Clear Cookies

Use browser devtools:

Storage/Application → Cookies → Clear

Inspect Database State

pnpm prisma studio

Review:
	•	User
	•	Session
	•	Wallet
	•	Balance
	•	Journal / Ledger Tables

⸻

Team Operating Rules

Rule 1

Never test protected routes without verifying principal first.

Rule 2

Never trust browser tabs/windows alone.
Trust /api/debug/principal.

Rule 3

Never combine multiple actor roles in one browser context.

Rule 4

Multi-actor workflows must simulate real separation.

⸻

Recommended Future Enhancement

Build a dedicated dev switchboard:

/admin/dev/principals

With explicit buttons for:
	•	Become Admin
	•	Become Resident 1
	•	Become Resident 2
	•	Become Partner
	•	Become Elder

Dev-only visibility.

⸻

Why This Exists

AXPT is a multi-principal financial/governance platform.

Improper testing discipline can hide:
	•	Privilege escalation bugs
	•	Session contamination
	•	Broken guard logic
	•	Invalid authority assumptions

This protocol ensures:

Trust boundaries are tested as they will exist in reality.

⸻

