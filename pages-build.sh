#!/bin/bash
# Build script for Cloudflare Pages — uses `git archive` (tracked files only)
# and mirrors .github/workflows/deploy.yml's exact exclude list (more complete
# than deploy.sh: also covers package.json/package-lock.json/node_modules/tests).
# Cloudflare Pages build command: bash pages-build.sh — output dir: dist
set -euo pipefail
rm -rf dist
mkdir -p dist
git archive HEAD | tar -x -C dist

rm -rf dist/.github dist/.claude dist/tasks dist/node_modules dist/tests
rm -f dist/.gitignore dist/package.json dist/package-lock.json
find dist -type f \( \
  -iname "*.md" -o -iname "*.docx" -o -iname "*.sh" \
  -o -iname "*Zone.Identifier" \
  \) -delete
