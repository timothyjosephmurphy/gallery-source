#!/bin/bash
# usage: _runall.sh <tag> <audit...>   (runs sequentially, desktop + phone, logs to /tmp/au/<tag>-*.log, summary in /tmp/au/<tag>.sum)
cd /workspace/play-tags; TAG=$1; shift; U=${URL:-http://localhost:${PORT:-4252}/play/}; : > /tmp/au/$TAG.sum
for t in "$@"; do for v in desktop phone; do
  case $t in
    tour) TOURRATE=2 timeout 900 node tests/touraudit.mjs $U $v > /tmp/au/$TAG-$t-$v.log 2>&1;;
    shopaudit) timeout 500 node tests/shopaudit.local.mjs $U $v > /tmp/au/$TAG-$t-$v.log 2>&1;;
    egg) timeout 500 node tests/eggaudit.local.mjs $U $v > /tmp/au/$TAG-$t-$v.log 2>&1;;
    phoneui) timeout 500 node tests/_phoneui.mjs $U $v > /tmp/au/$TAG-$t-$v.log 2>&1;;
    *) timeout 500 node tests/$t.mjs $U $v > /tmp/au/$TAG-$t-$v.log 2>&1;;
  esac
  echo "$t $v exit=$? $(rg -o '(PASS|FAIL)[^\n]{0,60}' /tmp/au/$TAG-$t-$v.log | sort | uniq -c | tr '\n' ' ')" >> /tmp/au/$TAG.sum
done; done; echo ALLDONE >> /tmp/au/$TAG.sum
