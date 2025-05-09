#!/bin/bash

# 🧪 AXPT Env Loader
# Loads all env variables from .env.local into the current shell session

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE not found. Cannot load environment variables."
  exit 1
fi

echo "🔄 Loading variables from $ENV_FILE..."
export $(grep -v '^#' "$ENV_FILE" | xargs)

echo "✅ Environment variables loaded."
