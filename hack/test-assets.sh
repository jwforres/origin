#!/bin/bash

set -e

if [[ "${TRAVIS}" != "true" || "${TEST_ASSETS}" = "true" ]]; then
  pushd assets > /dev/null
    grunt test
  popd > /dev/null
fi