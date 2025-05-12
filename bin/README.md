### `bin/` Command Reference for AXPT.io

This directory contains the key terminal scripts for managing and deploying AXPT.io. Use `chmod +x <script>` if you need to make a script executable.

---

#### 🔁 `bin/deploy`
A flexible CLI shortcut to run deployment rituals with or without preflight checks.

**Usage:**
```bash
bin/deploy              # Launch with prompt
bin/deploy --vercel     # Force Vercel deploy
bin/deploy --git        # Force Git push deploy
```

**Behind the scenes:**
- Executes `app/scripts/deployOnly.sh`
- All output is logged to `/logs/deployOnly_<timestamp>.log`

---

#### 🧪 `bin/preflight`
Runs the full pre-deploy ritual with validation, cleanup, type-checking, and more.

**Usage:**
```bash
bin/preflight
```

**Runs:**
- `validate-canonical-structure.sh`
- `check-useSession-client-boundary.sh`
- `validate-aliases-from-tsconfig.sh`
- `tsc --noEmit`
- `prisma generate`
- `npm run build`
- `audit-dashboard-remnants.sh`

---

#### 🔐 `bin/token`
Interactive and flag-based access token utility.

**Usage:**
```bash
bin/token generate              # Interactive token creation
bin/token verify <token>        # Manually verify a token
bin/token list                  # Show all partner tiers
bin/token lookup <partner>      # Show tier for partner
```

---

#### 🔐 `bin/token-debug-live`
Verifies a token using the live Vercel `PARTNER_SECRET` value directly via shell injection.

**Usage:**
```bash
bin/token-debug-live <token>
```

---

#### 🧬 `bin/env-sync`
Compares the `PARTNER_SECRET` from your local `.env` with the deployed value in Vercel.

**Usage:**
```bash
bin/env-sync
```

Use this to catch desync issues between environments.

---

#### 🛠 Planned Future Commands:
- `bin/dev` → start local dev with pre-checks
- `bin/reset` → reset .env or clear tokens
- `bin/test` → run test suite (TBD)

---

For any custom commands or additions, modify `bin/` or scripts in `app/scripts/`. Each script logs to `/logs/` with timestamps.
