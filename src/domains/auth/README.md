# AXPT Canonical Authority Layer

This directory contains the canonical identity and permission system.

Primary authority flow:

SESSION_COOKIE_NAME
→ getSessionFromCookie()
→ getPrincipal()
→ permission enforcement

Control Center, Treasury, Wallet, Governance, and Operator systems
must resolve identity through getPrincipal() only.

Legacy systems remain transitional until removed.