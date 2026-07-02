#!/usr/bin/env bash
# Launches the DSA Crash Course locally. Requires only Python 3 (already on macOS).
cd "$(dirname "$0")"
PORT="${1:-8000}"
echo "Starting DSA Crash Course at http://localhost:$PORT"
echo "Press Ctrl+C to stop."
python3 -m http.server "$PORT"
