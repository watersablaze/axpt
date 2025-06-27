# 🌐 AXPT.io – Axis Point Investments

**The Crossroads of Technology, Trade, and Cultural Exchange.**

Welcome to the AXPT.io codebase! This platform serves as an interactive portal connecting global partners through digital innovation, cultural integrity, and financial technology. Together, we build scalable systems with a spirit of excellence and creative elegance.

---

## 🚀 Project Vision

AXPT.io exists to:
- Enable seamless partner collaboration via token-based access.
- Provide a secure and interactive portal for document sharing (whitepapers, agreements, research).
- Uphold cultural respect, global outreach, and technological integrity.
- Integrate modern front-end architecture with a stable and secure back-end flow.

---

## 🛠️ Tech Stack

- **Next.js 15**  
- **TypeScript**  
- **Prisma + PostgreSQL**  
- **Lottie Animations / Motion Graphics**  
- **Environment-based token verification system**  
- **Styled with CSS Modules and Design Tokens**  

---

## 🧰 Local Development Setup

1. **Clone the Repo:**
   ```bash
   git clone https://github.com/your-username/axpt.io.git
   cd axpt.io

   AXPT Partner Onboarding CLI

A secure and elegant command-line onboarding tool for generating signed AXPT tokens, syncing partner data to the database, and producing QR code credentials.

⸻

✨ Features
	•	Interactive terminal prompts
	•	Generates signed partner tokens with document permissions
	•	Saves token + QR image to disk
	•	Copies token to clipboard
	•	Automatically syncs partner info to the database (Prisma)
	•	Logs onboarding events to logs/partner-onboard-log.jsonl
	•	Inline token verification + decoding after generation

⸻

🚀 Quick Start

pnpm onboard

This command runs the interactive onboarding CLI:
	•	Prompts for partner name, slug, tier, and docs
	•	Generates token + QR code
	•	Logs event and syncs to database

⸻

🛠️ File Structure

cli/
├── onboard.ts               # Main CLI flow
├── generateTokenForCLI.ts   # Token + QR generator

app/
├── src/
│   ├── components/shared/TokenGate.tsx  # Web-based verifier gate
│   ├── components/shared/WelcomeScreen.tsx  # Entry screen with orb + terms
├── onboard/investor/page.tsx           # Portal route using TokenGate

app/scripts/
├── partner-tokens/utils/
│   ├── signToken.ts         # Token HMAC signer
│   ├── verifyToken.ts       # Verifier
│   ├── decodeToken.ts       # Decoder
│   ├── readEnv.ts           # Loads PARTNER_SECRET


⸻

🔐 Environment Setup

Create a .env file in your root:

PARTNER_SECRET=your_hmac_sha256_secret_here


⸻

🧪 Example Output

✓ Token generated for: maya-redding
📄 QR saved to: /public/qr/maya-redding.png
🔗 Token: eyJwYXJ0bmVyIjoibWF...:deadbeef...
✅ Token is valid


⸻

🧾 JSONL Logging

Each onboarding entry is logged in:

logs/partner-onboard-log.jsonl

Format:

{
  "timestamp": "2025-06-18T10:55:02.119Z",
  "partner": "maya-redding",
  "tier": "Investor",
  "docs": ["AXPT-Whitepaper.pdf"],
  "token": "...",
  "qrPath": "/public/qr/maya-redding.png"
}


⸻

🧭 Notes
	•	The token is passed automatically via query param to /onboard/investor?token=...
	•	If not detected, a manual input fallback is available.
	•	WelcomeScreen includes an orb animation, velvet background, and sigil reveal upon agreement.

⸻

📡 Upcoming
	•	Partner edit CLI
	•	Admin portal for monitoring + token management
	•	Token expiration support + renewals
	•	Tier-based portal access controls

⸻

Made with 💎 for Earth-rooted investors by AXPT.io