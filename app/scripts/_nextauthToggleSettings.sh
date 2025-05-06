#!/bin/bash

# Target files (add more as needed)
files=(
  "components/SessionProviderWrapper.tsx"
  "app/layout.tsx"
  "app/api/auth/[...nextauth]/route.ts"
)

# Regex patterns to match lines to comment/uncomment
patterns=(
  "SessionProvider"
  "getServerSession"
  "authOptions"
  "next-auth/react"
  "next-auth/next"
)