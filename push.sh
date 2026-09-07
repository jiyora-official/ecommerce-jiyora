#!/bin/bash
#
# push.sh — Auto commit & push semua perubahan ke GitHub
# Pakai: ./push.sh ["pesan commit"]

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}✔${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✘${NC} $1"; }

if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  error "Folder ini bukan repository git."
  exit 1
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "HEAD" ]; then
  error "Sedang dalam detached HEAD state, tidak ada branch aktif untuk di-push."
  exit 1
fi

if ! git remote get-url origin > /dev/null 2>&1; then
  error "Remote 'origin' belum di-set. Jalankan: git remote add origin <url>"
  exit 1
fi

if ! git ls-remote origin > /dev/null 2>&1; then
  error "Tidak bisa terhubung ke remote 'origin'. Cek koneksi internet atau kredensial GitHub."
  exit 1
fi

info "Menyinkronkan dengan remote..."
if ! git fetch origin "$BRANCH" 2>/dev/null; then
  warn "Branch '$BRANCH' belum ada di remote, akan dibuat saat push."
else
  LOCAL=$(git rev-parse @)
  REMOTE=$(git rev-parse "origin/$BRANCH" 2>/dev/null || echo "")
  if [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
    warn "Branch lokal tertinggal dari remote. Mencoba rebase..."
    if ! git pull --rebase origin "$BRANCH"; then
      error "Rebase gagal karena konflik. Selesaikan manual:"
      echo "    git status"
      echo "    (perbaiki file konflik)"
      echo "    git add ."
      echo "    git rebase --continue"
      exit 1
    fi
    info "Rebase berhasil."
  fi
fi

git add -A

if git diff --cached --quiet; then
  warn "Tidak ada perubahan untuk di-commit."
  exit 0
fi

MSG=${1:-"update: $(date '+%Y-%m-%d %H:%M:%S')"}
git commit -m "$MSG"
info "Commit dibuat: \"$MSG\""

if git push origin "$BRANCH"; then
  info "Berhasil push ke branch '$BRANCH'"
else
  warn "Push ditolak, mencoba fetch + rebase ulang lalu push lagi..."
  git pull --rebase origin "$BRANCH"
  git push origin "$BRANCH"
  info "Berhasil push ke branch '$BRANCH' (setelah rebase ulang)"
fi
