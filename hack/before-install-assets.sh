#!/bin/bash

set -e

if [[ "${TRAVIS}" != "true" || "${TEST_ASSETS}" = "true" ]]; then
  sudo apt-get install -qq ruby
fi