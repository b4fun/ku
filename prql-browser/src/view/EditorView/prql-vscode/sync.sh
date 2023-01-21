#!/usr/bin/env bash

CUR_DIR=$(cd $(dirname $0); pwd)

curl https://raw.githubusercontent.com/PRQL/prql/main/playground/src/workbench/prql-syntax.js \
    -Lo "$CUR_DIR/prql-syntax.ts"