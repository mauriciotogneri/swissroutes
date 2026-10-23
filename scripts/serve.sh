#!/usr/bin/env bash

set -e

node bin/ids-generator.js
firebase serve --only hosting