#!/usr/bin/env bash
# Launches the CI/CD & Containers Course locally. Requires only Python 3.
# Serves from the repo root (not this folder) so ../shared/* resolves the same
# way locally as it does on GitHub Pages, which serves the whole repo from /.
cd "$(dirname "$0")/.."
PORT="${1:-8000}"
echo "Starting CI/CD & Containers Course at http://localhost:$PORT/cicd_course/"
echo "Press Ctrl+C to stop."
python3 -m http.server "$PORT"
