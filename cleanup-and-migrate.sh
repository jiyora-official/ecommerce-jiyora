#!/bin/bash
#
# cleanup-and-migrate.sh — Bersihkan file .bak dari git & cek status migration Prisma
# Pakai: ./cleanup-and-migrate.sh

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

# 1. Hapus prisma/seed.ts.bak dari git tracking (kalau masih ter-track)
if git ls-files --error-unmatch prisma/seed.ts.bak > /dev/null 2>&1; then
  git rm --cached prisma/seed.ts.bak
  info "prisma/seed.ts.bak dihapus dari tracking git."
else
  warn "prisma/seed.ts.bak tidak sedang di-track, dilewati."
fi

# 2. Tambahkan *.bak ke .gitignore kalau belum ada
if ! grep -qxF '*.bak' .gitignore 2>/dev/null; then
  echo '*.bak' >> .gitignore
  info ".gitignore diperbarui dengan pola *.bak"
else
  warn "*.bak sudah ada di .gitignore, dilewati."
fi

# 3. Commit & push kalau ada perubahan
git add .gitignore
if ! git diff --cached --quiet; then
  git commit -m "chore: ignore .bak files"
  info "Commit dibuat untuk .gitignore."
  if [ -f ./push.sh ]; then
    ./push.sh
  else
    git push origin "$(git rev-parse --abbrev-ref HEAD)"
  fi
else
  warn "Tidak ada perubahan untuk di-commit."
fi

# 4. Cek status migration Prisma
echo ""
info "Mengecek status migration Prisma..."
npx prisma migrate status || true

# 5. Generate ulang Prisma Client supaya sesuai schema terbaru
echo ""
info "Menjalankan prisma generate..."
npx prisma generate

echo ""
warn "Kalau status di atas menunjukkan skema berbeda dari migration terakhir, jalankan manual:"
echo "   npx prisma migrate dev --name <nama_perubahan>"
