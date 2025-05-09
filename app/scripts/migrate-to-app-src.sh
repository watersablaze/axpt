#!/bin/bash

echo '🔁 Migrating project structure for future-ready imports...'

mkdir -p app/src/components
mv src/components/* app/src/components/

mkdir -p app/src/lib
mv src/lib/* app/src/lib/

echo '✅ Migration complete. Verify tsconfig.json and next.config.ts aliases are aligned.'