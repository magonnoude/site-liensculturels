#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  Liens Culturels — Manual Deploy Script
#  Usage: cd ~/RMS_Projects/www.liensculturels.org && ./deploy.sh "message de commit"
#
#  Normal path is GitHub Actions (.github/workflows/deploy.yml) on push to main.
#  Use this script for a direct manual sync (e.g. GH Actions is down, or you
#  want to push a change without going through git first — not recommended,
#  prefer committing so the repo stays the source of truth).
# ═══════════════════════════════════════════════════════════════════
set -e

REPO=~/RMS_Projects/www.liensculturels.org
BUCKET=www.liensculturels.org
REGION=eu-west-3
CF_ID=E27Z3FWSMEYT5U
MSG="${1:-deploy: $(date '+%Y-%m-%d %H:%M')}"

cd "$REPO" || { echo "ERROR: repo not found at $REPO"; exit 1; }

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Liens Culturels — Deploy  •  $(date '+%Y-%m-%d %H:%M')"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "▸ Git status:"
git status --short
echo ""

if [ -n "$(git status --short)" ]; then
  git add .
  git commit -m "$MSG"
  git push origin main
  echo ""
  echo "▸ Pushed to main — GitHub Actions will deploy automatically."
  echo "  Monitor: https://github.com/magonnoude/site-liensculturels/actions"
  echo ""
  read -p "  Press ENTER once GitHub Actions shows green, or Ctrl+C to skip the manual sync below. "
fi

echo ""
echo "▸ Manual S3 sync (mirrors .github/workflows/deploy.yml)..."
aws s3 sync . "s3://$BUCKET" \
  --exclude ".git/*" \
  --exclude ".github/*" \
  --exclude ".claude/*" \
  --exclude "tasks/*" \
  --exclude "*.md" \
  --exclude ".gitignore" \
  --exclude "*.docx" \
  --exclude "*:Zone.Identifier" \
  --exclude "*.Zone.Identifier" \
  --region "$REGION"

echo ""
echo "▸ Re-applying no-cache on HTML..."
for f in $(find . -name "*.html" -not -path "./.git/*" -not -path "./.github/*"); do
  key="${f#./}"
  aws s3 cp "$f" "s3://$BUCKET/$key" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html; charset=utf-8" \
    --region "$REGION" >/dev/null
done

echo ""
echo "▸ Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$CF_ID" \
  --paths "/*" \
  --region "$REGION" \
  --output json | python3 -c "
import sys,json
d=json.load(sys.stdin)
i=d.get('Invalidation',{})
print('  ID:', i.get('Id','?'), '| Status:', i.get('Status','?'))
" 2>/dev/null

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✓ DONE — https://www.liensculturels.org"
echo "═══════════════════════════════════════════════════════════════"
echo ""
