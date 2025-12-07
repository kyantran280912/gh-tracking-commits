#!/bin/bash

# Wrapper script to run commands with clean environment
# Unsets conflicting environment variables and loads from .env file

# Unset potentially conflicting environment variables
unset TELEGRAM_BOT_TOKEN
unset TELEGRAM_CHAT_ID
unset GITHUB_TOKEN
unset GITHUB_REPOS

# Load environment variables from .env file
if [ -f .env ]; then
  # Export variables from .env, handling quoted values
  export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
fi

# Run the command passed as arguments
exec "$@"
