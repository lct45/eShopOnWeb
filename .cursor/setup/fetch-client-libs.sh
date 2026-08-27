#!/usr/bin/env bash
# Vendors the client-side libraries declared in src/Web/libman.json from the npm
# registry into src/Web/wwwroot. The repo normally restores these from cdnjs via
# Microsoft.Web.LibraryManager.Build, but cdnjs is not reachable from the Cloud
# Agent's restricted network. The npm registry (registry.npmjs.org) is, and every
# library here is published there, so we fetch equivalent files and place them at
# the paths the Razor views expect. Builds/runs then pass -p:LibraryRestore=False
# to skip the online restore.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WWWROOT="$REPO_ROOT/src/Web/wwwroot"
REGISTRY="https://registry.npmjs.org"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

fetch() { # pkg ver -> extracts tarball into $work/<pkg>/package
  local pkg="$1" ver="$2"
  local dir="$work/$pkg"
  mkdir -p "$dir"
  curl -fsSL "$REGISTRY/$pkg/-/$pkg-$ver.tgz" -o "$dir.tgz"
  tar xzf "$dir.tgz" -C "$dir"
}

place() { # src-relative-to-package  dest-relative-to-wwwroot  pkg
  local src="$1" dest="$2" pkg="$3"
  local from="$work/$pkg/package/$src"
  local to="$WWWROOT/$dest"
  mkdir -p "$(dirname "$to")"
  cp "$from" "$to"
}

fetch jquery 3.6.3
fetch bootstrap 3.4.1
fetch jquery-validation 1.19.5
fetch jquery-validation-unobtrusive 4.0.0

# jQuery
place dist/jquery.js       lib/jquery/dist/jquery.js      jquery
place dist/jquery.min.js   lib/jquery/dist/jquery.min.js  jquery
place dist/jquery.min.map  lib/jquery/dist/jquery.min.map jquery
place dist/jquery.js       lib/jquery/jquery.js           jquery

# Bootstrap
for f in bootstrap.css bootstrap.css.map bootstrap.min.css bootstrap.min.css.map; do
  place "dist/css/$f" "lib/bootstrap/dist/css/$f" bootstrap
done
for f in bootstrap.js bootstrap.min.js; do
  place "dist/js/$f" "lib/bootstrap/dist/js/$f" bootstrap
done

# jQuery Validation. Only vendored under wwwroot/lib (matching libman.json). The
# ~/Identity/lib/* paths in the Identity area are served by the ASP.NET Core
# Identity UI Razor Class Library; adding physical files there collides with the
# RCL's static web assets and breaks the static-asset manifest build.
place dist/jquery.validate.js     "lib/jquery-validation/dist/jquery.validate.js"     jquery-validation
place dist/jquery.validate.min.js "lib/jquery-validation/dist/jquery.validate.min.js" jquery-validation
place dist/jquery.validate.unobtrusive.js     "lib/jquery-validation-unobtrusive/jquery.validate.unobtrusive.js"     jquery-validation-unobtrusive
place dist/jquery.validate.unobtrusive.min.js "lib/jquery-validation-unobtrusive/jquery.validate.unobtrusive.min.js" jquery-validation-unobtrusive

echo "Client libraries vendored into $WWWROOT/lib"
