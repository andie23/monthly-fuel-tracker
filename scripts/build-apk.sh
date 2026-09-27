#!/usr/bin/env bash
# Builds a debug APK without opening Android Studio.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -z "${JAVA_HOME:-}" ] || ! "$JAVA_HOME/bin/java" -version 2>&1 | grep -q '"21'; then
  for candidate in /usr/lib/jvm/java-21-openjdk-amd64 /usr/lib/jvm/java-21-openjdk; do
    if [ -d "$candidate" ]; then
      export JAVA_HOME="$candidate"
      break
    fi
  done
fi

echo "Using JAVA_HOME=${JAVA_HOME:-<system default>}"

npm run build
npx cap sync android

cd android
./gradlew assembleDebug

echo "APK ready at android/app/build/outputs/apk/debug/app-debug.apk"
