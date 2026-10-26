#!/usr/bin/env bash
set -euo pipefail
BASE_VERSION="$(bun -e 'console.log(require("./app.json").expo.version)')"
if [[ "$GITHUB_REF_TYPE" == tag ]]; then
  TAG="$GITHUB_REF_NAME"
else
  TAG="v${BASE_VERSION}-alpha.${GITHUB_SHA:0:8}"
fi
if [[ ! "$TAG" =~ ^v([0-9]+\.[0-9]+\.[0-9]+)(-[0-9A-Za-z.-]+)?$ ]]; then
  echo '::error::Release tags must use vMAJOR.MINOR.PATCH with an optional prerelease suffix.'
  exit 1
fi
NATIVE_VERSION="${BASH_REMATCH[1]}"
PRERELEASE=false
[[ "$TAG" != *-* ]] || PRERELEASE=true
{
  echo "tag=$TAG"
  echo "native_version=$NATIVE_VERSION"
  echo "prerelease=$PRERELEASE"
  echo "release_name=indyzpay ${TAG}"
} >> "$GITHUB_OUTPUT"
# Keep native versions numeric for Apple/Google; alpha labels stay in artifact names.
VERSION="$NATIVE_VERSION" bun -e '
  const fs = require("node:fs");
  const app = require("./app.json");
  app.expo.version = process.env.VERSION;
  app.expo.android.versionCode = Number(process.env.GITHUB_RUN_NUMBER);
  app.expo.ios.buildNumber = process.env.GITHUB_RUN_NUMBER;
  fs.writeFileSync("app.json", JSON.stringify(app, null, 2) + "\n");
'
