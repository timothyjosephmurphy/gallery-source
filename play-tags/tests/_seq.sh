#!/bin/bash
cd /workspace/play-tags; B=http://localhost:4271/play/; S=/tmp/au/s.sum; : > $S
run() { n=$1; shift; "$@" > /tmp/au/s-$n.log 2>&1; echo "$n exit=$? $(rg -o '^(FAIL|PASS)[^\n]{0,70}' /tmp/au/s-$n.log | sort | uniq -c | tr '\n' ' ' | cut -c1-200)" >> $S; }
run gb timeout 400 node tests/gbmenulock308.mjs "${B}?tour=0" both
run ride timeout 600 node tests/ride314.mjs "${B}?tour=0" desktop
run ridep timeout 600 node tests/ride314.mjs "${B}?tour=0" phone
run eggd timeout 400 node tests/eggaudit.local.mjs $B desktop
run eggp timeout 400 node tests/eggaudit.local.mjs $B phone
run tourd env TOURRATE=2 timeout 900 node tests/touraudit.mjs $B desktop
run wmd timeout 500 node tests/wallmapaudit.mjs $B desktop
run wmp timeout 500 node tests/wallmapaudit.mjs $B phone
run jumpd timeout 500 node tests/jumpaudit.mjs $B desktop
run jumpp timeout 500 node tests/jumpaudit.mjs $B phone
for f in false true; do ONLY=desktop:$f:far:menu run co-d-$f timeout 300 node tests/checkout308.mjs "${B}?tour=0"; done
echo ALLDONE >> $S
