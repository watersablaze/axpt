AXPT has one decision engine: ExecutionTruthKernel.

All execution flow must follow:

signals → spine → ETK → decision → executor → ledger/log

No treasury, wallet, admin, system, governance, or visualization module may independently decide execution outcomes.


Control Center is the single operator surface.

All execution, treasury, system, and spine operations must flow through:

Control Center UI → Control API → Domain Orchestrators → ETK → Wallet

No domain may bypass ETK or Control API for privileged actions.