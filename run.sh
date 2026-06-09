#!/usr/bin/env bash
set -euo pipefail

PORT=$(python3 -c "import socket; s=socket.socket(); s.bind(('',0)); print(s.getsockname()[1]); s.close()")

podman run --rm \
  -p "${PORT}:8000" \
  -e HOST_PORT="${PORT}" \
  launcher-poc
