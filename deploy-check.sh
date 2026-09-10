#!/usr/bin/env bash
# Stack: bash | Verifies a deployed link shortener end to end: health → shorten → redirect.
# Usage: ./deploy-check.sh https://your-app.b4a.run
set -euo pipefail
BASE="${1:?usage: deploy-check.sh <base-url>}"
TARGET="https://www.back4app.com/docs/"

echo "1/3 health";   curl -fsS "$BASE/healthz" | grep -q '"ok":true'
echo "2/3 shorten";  CODE=$(curl -fsS -X POST -H "Content-Type: application/json" -d "{\"url\":\"$TARGET\"}" "$BASE/shorten" | sed -E 's/.*"code":"([^"]+)".*/\1/')
echo "    code: $CODE"
echo "3/3 redirect"; LOC=$(curl -sS -o /dev/null -w '%{redirect_url}' "$BASE/$CODE")
[ "$LOC" = "$TARGET" ] || { echo "redirect went to '$LOC', expected '$TARGET'"; exit 1; }
echo "OK — $BASE/$CODE → $TARGET"
