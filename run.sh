#!/bin/sh
# Build and start the desktop game. Needs only a JDK (17+).
set -e
cd "$(dirname "$0")"
rm -rf build/game && mkdir -p build/game
javac -d build/game $(find core/src/main desktop/src -name '*.java')
java -cp build/game com.krinkerlabs.pinball.desktop.Main "$@"
