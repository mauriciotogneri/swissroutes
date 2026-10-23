#!/usr/bin/env bash

set -e

cd "$(dirname "$0")/.."

node bin/ids-generator.js
firebase deploy --only hosting
