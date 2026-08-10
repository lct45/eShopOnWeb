#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for eShopOnWeb.
# Runs after the repo is checked out. Ensures the .NET 10 SDK is present, restores
# NuGet packages, vendors client-side libraries (see fetch-client-libs.sh for why),
# and builds the solution without the online LibraryManager restore.
set -euo pipefail

export DOTNET_CLI_TELEMETRY_OPTOUT=1
export DOTNET_NOLOGO=1

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

# global.json pins the SDK to 10.0.x (rollForward latestFeature). Install it from
# the Ubuntu 24.04 package feed if a matching SDK is not already available.
if ! command -v dotnet >/dev/null 2>&1 || ! dotnet --list-sdks 2>/dev/null | grep -q '^10\.'; then
  echo "==> Installing .NET 10 SDK"
  sudo apt-get update
  sudo apt-get install -y dotnet-sdk-10.0
fi

echo "==> dotnet --version: $(dotnet --version)"

echo "==> Restoring NuGet packages"
dotnet restore eShopOnWeb.slnx

echo "==> Vendoring client-side libraries from npm"
bash "$REPO_ROOT/.cursor/setup/fetch-client-libs.sh"

echo "==> Building solution (LibraryManager online restore disabled)"
dotnet build eShopOnWeb.slnx -c Debug --no-restore -p:LibraryRestore=False

echo "==> Install complete"
