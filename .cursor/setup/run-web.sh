#!/usr/bin/env bash
# Runs the eShopOnWeb storefront over HTTP using the EF Core in-memory database.
# Points the Blazor admin at the PublicApi's HTTP endpoint.
set -euo pipefail
export DOTNET_CLI_TELEMETRY_OPTOUT=1
export DOTNET_NOLOGO=1
export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS="http://0.0.0.0:5001"
export UseOnlyInMemoryDatabase=true
export baseUrls__apiBase="http://localhost:5099/api/"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"
exec dotnet run --project src/Web/Web.csproj --no-launch-profile --no-build -c Debug
