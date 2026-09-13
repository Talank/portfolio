#!/usr/bin/env bash
# Launches Speech Lab locally. Requires only Python 3.
# Serves from the repo root (not this folder) so ../learn/* resolves the same
# way locally as it does on GitHub Pages, which serves the whole repo from /.
# A plain double-click on index.html will not work: the app is ES modules, and
# browsers refuse module imports over file://.
#
# Chrome or Edge is strongly preferred. Firefox and Safari have no Web Speech
# recogniser, so the "was it recognised" check is skipped there; the acoustic
# checks work everywhere.
cd "$(dirname "$0")/.."
PORT="${1:-8000}"
echo "Starting Speech Lab at http://localhost:$PORT/speech_lab/"
echo "Press Ctrl+C to stop."
python3 -m http.server "$PORT"
