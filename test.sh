#!/bin/sh
# Build and test the core with a bare JDK: no Gradle, no network.
set -e
cd "$(dirname "$0")"
rm -rf build && mkdir -p build/core
javac -d build/core $(find core/src -name '*.java')
java -cp build/core com.krinkerlabs.pinball.core.CoreTests
