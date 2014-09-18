#!/bin/bash

set -e

if [[ "${TRAVIS}" != "true" || "${TEST_ASSETS}" = "true" ]]; then
  npm install -g bower grunt-cli
  pushd assets > /dev/null
    npm install
    bower install
  popd > /dev/null
  gem install compass
fi