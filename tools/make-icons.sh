#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# NOVA icon set — kept for the old command line; the icons are now
# drawn as vectors by make-app-icon.sh, which writes the master and
# every derived icon (PWA + Android legacy + adaptive) in one pass.
#
#   usage: bash tools/make-icons.sh
# ══════════════════════════════════════════════════════════════
set -euo pipefail
exec bash "$(dirname "$0")/make-app-icon.sh"
