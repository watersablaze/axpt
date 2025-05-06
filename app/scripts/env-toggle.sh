📁 `app/scripts/env-toggle.sh`
```bash
#!/bin/bash

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env file not found. Please ensure it's in the root directory."
  exit 1
fi

FLAG="ENABLE_AUTH"
CURRENT=$(grep "^$FLAG=" $ENV_FILE | cut -d '=' -f2)

if [[ "$CURRENT" == "true" ]]; then
  echo "🔒 $FLAG is currently ENABLED."
  read -p "Disable it? (y/n): " confirm
  if [[ "$confirm" == "y" ]]; then
    sed -i'' -e "s/^$FLAG=true/$FLAG=false/" $ENV_FILE
    echo "✅ Disabled $FLAG."
  else
    echo "🔁 No changes made."
  fi
else
  echo "🔓 $FLAG is currently DISABLED."
  read -p "Enable it? (y/n): " confirm
  if [[ "$confirm" == "y" ]]; then
    sed -i'' -e "s/^$FLAG=false/$FLAG=true/" $ENV_FILE
    echo "✅ Enabled $FLAG."
  else
    echo "🔁 No changes made."
  fi
fi
```

📁 `.env` (Ensure this line exists)
```
ENABLE_AUTH=false
```

📁 `components/SessionProviderWrapper.tsx`
```tsx
'use client';

import { SessionProvider } from 'next-auth/react';

const isAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true';

const SessionProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthEnabled) return <>{children}</>; // fallback if auth disabled
  return <SessionProvider>{children}</SessionProvider>;
};

export default SessionProviderWrapper;
```

📁 `next.config.js` → expose to frontend
```js
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_ENABLE_AUTH: process.env.ENABLE_AUTH,
  },
};

module.exports = nextConfig;
```