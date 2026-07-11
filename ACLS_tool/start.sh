#!/usr/bin/env bash
# Launches ACLS_tool locally. Requires only Python 3.
# Serves from the repo root (not this folder) so relative paths resolve the
# same way locally as they do on GitHub Pages, which serves the whole repo
# from /. A plain double-click on index.html won't work: the page loads its
# questions/drugs/mnemonics from data/*.json via fetch(), which browsers
# block under the file:// protocol.
cd "$(dirname "$0")/.."
PORT="${1:-8000}"
echo "Starting ACLS_tool at http://localhost:$PORT/ACLS_tool/"
echo "Press Ctrl+C to stop."
python3 -m http.server "$PORT"
