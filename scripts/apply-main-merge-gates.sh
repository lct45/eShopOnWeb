#!/usr/bin/env bash
# Apply (or update) the LCFM-36 main-branch ruleset.
# Requires a GitHub token with admin access to lct45/eShopOnWeb (Administration → Rules).
set -euo pipefail

REPO="${REPO:-lct45/eShopOnWeb}"
RULESET_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.github/rulesets/main-merge-gates.json"
RULESET_NAME="main merge gates (LCFM-36)"

if [[ ! -f "$RULESET_FILE" ]]; then
  echo "error: missing ruleset file: $RULESET_FILE" >&2
  exit 1
fi

# Strip private documentation keys before posting to the GitHub API.
PAYLOAD="$(python3 - <<'PY' "$RULESET_FILE"
import json, sys
path = sys.argv[1]
data = json.load(open(path))
data.pop("_lcfm36_notes", None)
print(json.dumps(data))
PY
)"

echo "Looking for existing ruleset named: $RULESET_NAME"
EXISTING_ID="$(
  gh api "repos/${REPO}/rulesets" --paginate \
    --jq ".[] | select(.name==\"${RULESET_NAME}\") | .id" \
    | head -n 1 || true
)"

if [[ -n "${EXISTING_ID}" ]]; then
  echo "Updating ruleset id=${EXISTING_ID}"
  if ! echo "$PAYLOAD" | gh api "repos/${REPO}/rulesets/${EXISTING_ID}" -X PUT --input -; then
    echo "error: failed to update ruleset (need repo admin permissions)." >&2
    exit 1
  fi
else
  echo "Creating ruleset"
  if ! echo "$PAYLOAD" | gh api "repos/${REPO}/rulesets" -X POST --input -; then
    echo "error: failed to create ruleset (need repo admin permissions)." >&2
    echo "Ask a repo admin to run: bash scripts/apply-main-merge-gates.sh" >&2
    exit 1
  fi
fi

echo
echo "Active rulesets:"
gh api "repos/${REPO}/rulesets" --jq '.[] | {id, name, enforcement, target}'
echo
echo "Done. Verify under https://github.com/${REPO}/settings/rules"
