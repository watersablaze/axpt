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

---

#### 🛠 Planned Future Commands:
- `bin/dev` → start local dev with pre-checks
- `bin/reset` → reset .env or clear tokens
- `bin/test` → run test suite (TBD)

---

For any custom commands or additions, modify `bin/` or scripts in `app/scripts/`. Each script logs to `/logs/` with timestamps.
