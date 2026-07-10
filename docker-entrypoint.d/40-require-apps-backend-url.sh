#!/bin/sh
set -eu

if [ -z "${APPS_BACKEND_URL:-}" ]; then
  echo "APPS_BACKEND_URL must point to the real backend /apps endpoint." >&2
  exit 1
fi