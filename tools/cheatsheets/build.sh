#!/bin/bash
set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

INPUT_ARG="${1:-$SCRIPT_DIR/terminal.html}"
INPUT="$(cd "$(dirname "$INPUT_ARG")" && pwd)/$(basename "$INPUT_ARG")"
OUTPUT_ARG="${2:-$REPO_ROOT/03_MATERIALS_CONTENT/modules/module1/src/ave-terminal-cheatsheet.pdf}"

if [ ! -x "$CHROME" ]; then
  echo "Google Chrome не найден: $CHROME" >&2
  exit 1
fi
if [ ! -f "$INPUT" ]; then
  echo "Исходник не найден: $INPUT" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_ARG")"
OUTPUT="$(cd "$(dirname "$OUTPUT_ARG")" && pwd)/$(basename "$OUTPUT_ARG")"

"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$OUTPUT" \
  "file://$INPUT" 2>/dev/null

echo "Готово: $OUTPUT"
