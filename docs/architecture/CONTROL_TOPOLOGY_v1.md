AXPT has one decision engine: ExecutionTruthKernel.

All execution flow must follow:

signals → spine → ETK → decision → executor → ledger/log

No treasury, wallet, admin, system, governance, or visualization module may independently decide execution outcomes.