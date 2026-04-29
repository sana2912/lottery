#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.local.yml}"
DOTENV_FILE="${DOTENV_FILE:-.env.development}"

export COMPOSE_FILE

if [ "$#" -eq 0 ]; then
  set -- up --build
fi

exec docker compose --env-file "$DOTENV_FILE" -f "$COMPOSE_FILE" "$@"
