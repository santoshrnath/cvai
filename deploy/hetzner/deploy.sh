#!/usr/bin/env bash
# =============================================================================
# CV Intelligence Agent — Hetzner one-shot deploy
# =============================================================================
# Run from the project root on your laptop:
#
#   CVAI_SSH_HOST=root@1.2.3.4 ./deploy/hetzner/deploy.sh
#
# Optional overrides:
#   CVAI_PORT=3060               host port on the server
#   CVAI_ENV_FILE=.env.local     where the secrets live on your laptop
#   REMOTE_DIR=/opt/cvai         target dir on the server
#
# What it does:
#   1. rsyncs the project to /opt/cvai on the server
#      — excludes node_modules, .next, .git, and all .env* files
#   2. scp's your local .env.local to the server as .env
#      — this is where the secrets land; never touches git
#   3. runs `docker compose up -d --build` on the server
#   4. prints the public URL
# =============================================================================
set -euo pipefail

: "${CVAI_SSH_HOST:?Set CVAI_SSH_HOST=user@ip (e.g. root@1.2.3.4)}"
CVAI_PORT="${CVAI_PORT:-3060}"
CVAI_ENV_FILE="${CVAI_ENV_FILE:-.env.local}"
REMOTE_DIR="${REMOTE_DIR:-/opt/cvai}"

if [ ! -f "$CVAI_ENV_FILE" ]; then
  echo "✗ Missing env file at $CVAI_ENV_FILE" >&2
  echo "  Copy .env.example to .env.local and fill in ANTHROPIC_API_KEY at minimum." >&2
  exit 1
fi

echo "→ Project: cv-intelligence-agent"
echo "→ Target:  $CVAI_SSH_HOST:$REMOTE_DIR"
echo "→ Port:    $CVAI_PORT"
echo

echo "▸ rsync to server (excluding node_modules / .next / .env*)"
ssh "$CVAI_SSH_HOST" "mkdir -p $REMOTE_DIR"
rsync -az --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude ".env*" \
  --exclude "*.tsbuildinfo" \
  --exclude "storage-local" \
  ./ "$CVAI_SSH_HOST:$REMOTE_DIR/"

echo "▸ writing .env on server (from $CVAI_ENV_FILE)"
scp "$CVAI_ENV_FILE" "$CVAI_SSH_HOST:$REMOTE_DIR/.env"

echo "▸ docker compose up -d --build"
ssh "$CVAI_SSH_HOST" \
  "cd $REMOTE_DIR && CVAI_PORT=$CVAI_PORT docker compose up -d --build"

echo "▸ prisma db push"
ssh "$CVAI_SSH_HOST" \
  "cd $REMOTE_DIR && docker compose exec -T cvai-app npx prisma db push --skip-generate || true"

HOST_IP="${CVAI_SSH_HOST#*@}"
PUBLIC_HOST=$(grep -E '^PUBLIC_HOSTNAME=' "$CVAI_ENV_FILE" | head -n1 | cut -d= -f2-)
PUBLIC_HOST="${PUBLIC_HOST:-cvai.oneplaceplatform.com}"

echo
echo "✓ Deployed."
echo "  Public (via Traefik): https://${PUBLIC_HOST}"
echo "  Direct (smoke test):  http://${HOST_IP}:${CVAI_PORT}"
echo
echo "  Tail logs with:  ssh ${CVAI_SSH_HOST} 'cd ${REMOTE_DIR} && docker compose logs -f'"
