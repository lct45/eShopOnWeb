#!/usr/bin/env bash
# Runs the eShopOnWeb PublicApi over HTTP using the EF Core in-memory database.
set -euo pipefail
export DOTNET_CLI_TELEMETRY_OPTOUT=1
export DOTNET_NOLOGO=1
export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS="http://0.0.0.0:5099"
export UseOnlyInMemoryDatabase=true

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"
exec dotnet run --project src/PublicApi/PublicApi.csproj --no-launch-profile --no-build -c Debug
