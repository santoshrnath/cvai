#!/usr/bin/env bash
# =============================================================================
# CV Intelligence Agent — Hetzner one-shot deploy
# =============================================================================
# Run from the project root on your laptop:
#
#   CVAI_SSH_HOST=root@1.2.3.4 ./deploy/hetzner/deploy.sh
#
# Optional overrides:
#   CVAI_PORT=3070               host port on the server
#   CVAI_ENV_FILE=.env.local     where the secrets live on your laptop
#   REMOTE_DIR=/opt/cvai         target dir on the server
#   CVAI_REPO=https://github.com/santoshrnath/cvai.git
#                                public repo to clone/pull on the server
#   CVAI_BRANCH=main
#
# What it does:
#   1. SSH to the server and `git clone` (or `git fetch + reset --hard`) the
#      project to /opt/cvai. This works from Windows / macOS / Linux —
#      no rsync needed.
#   2. scp's your local .env.local to the server as .env (this is where the
#      secrets land; never touches git).
#   3. docker compose up -d --build on the server.
#   4. prisma db push to apply the schema.
# =============================================================================
set -euo pipefail

: "${CVAI_SSH_HOST:?Set CVAI_SSH_HOST=user@ip (e.g. root@1.2.3.4)}"
CVAI_PORT="${CVAI_PORT:-3070}"
CVAI_ENV_FILE="${CVAI_ENV_FILE:-.env.local}"
REMOTE_DIR="${REMOTE_DIR:-/opt/cvai}"
CVAI_REPO="${CVAI_REPO:-https://github.com/santoshrnath/cvai.git}"
CVAI_BRANCH="${CVAI_BRANCH:-main}"

if [ ! -f "$CVAI_ENV_FILE" ]; then
  echo "✗ Missing env file at $CVAI_ENV_FILE" >&2
  echo "  Copy .env.example to .env.local and fill in ANTHROPIC_API_KEY at minimum." >&2
  exit 1
fi

echo "→ Project: cv-intelligence-agent"
echo "→ Target:  $CVAI_SSH_HOST:$REMOTE_DIR"
echo "→ Port:    $CVAI_PORT"
echo "→ Repo:    $CVAI_REPO ($CVAI_BRANCH)"
echo

echo "▸ git sync on server"
ssh "$CVAI_SSH_HOST" "set -e; \
  mkdir -p $REMOTE_DIR; \
  cd $REMOTE_DIR; \
  if [ -d .git ]; then \
    echo '  [update]'; \
    git fetch --depth=1 origin $CVAI_BRANCH && git reset --hard origin/$CVAI_BRANCH; \
  else \
    echo '  [clone]'; \
    git clone --depth=1 -b $CVAI_BRANCH $CVAI_REPO .; \
  fi; \
  git log -1 --oneline"

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
PUBLIC_HOST="${PUBLIC_HOST:-cv.oneplaceplatform.com}"

echo
echo "✓ Deployed."
echo "  Public (via Traefik): https://${PUBLIC_HOST}"
echo "  Direct (smoke test):  http://${HOST_IP}:${CVAI_PORT}"
echo
echo "  Tail logs with:  ssh ${CVAI_SSH_HOST} 'cd ${REMOTE_DIR} && docker compose logs -f'"
