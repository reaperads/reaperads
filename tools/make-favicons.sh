#!/bin/bash
# Regenerate favicon.png (64x64) and apple-touch-icon.png (180x180) from
# apps/portfolio/public/favicon.svg into all three apps' public/ dirs.
# The SVG is the single source of truth; the PNGs are derived artifacts
# (the repo stays text-only for snapshot pushes, so the PNGs are not
# committed — run this after cloning to regenerate them).
# Needs a headless Chromium binary: set CHROMIUM=/path/to/chrome-headless-shell
# or have chromium / google-chrome on PATH.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CH="${CHROMIUM:-$(command -v chromium || command -v chromium-browser || command -v google-chrome || true)}"
[ -n "$CH" ] || { echo "no Chromium found; set CHROMIUM=/path/to/chrome-headless-shell"; exit 1; }
"$CH" --headless --disable-gpu --no-sandbox --hide-scrollbars --window-size=64,64 --screenshot=/tmp/favicon-64.png "file://$ROOT/apps/portfolio/public/favicon.svg" >/dev/null 2>&1
"$CH" --headless --disable-gpu --no-sandbox --hide-scrollbars --window-size=180,180 --screenshot=/tmp/favicon-180.png "file://$ROOT/apps/portfolio/public/favicon.svg" >/dev/null 2>&1
for app in portfolio agents tracker; do
  cp /tmp/favicon-64.png "$ROOT/apps/$app/public/favicon.png"
  cp /tmp/favicon-180.png "$ROOT/apps/$app/public/apple-touch-icon.png"
done
echo "favicons regenerated for portfolio, agents, tracker"
