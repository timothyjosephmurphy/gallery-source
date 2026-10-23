#!/bin/bash
cd /workspace/play-tags; U=http://localhost:4271/play/; S=/tmp/au/co.sum; : > $S
for dev in desktop phone; do for full in false true; do for sh in start:menu start:guide far:menu; do
  ONLY=$dev:$full:${sh%%:*}:${sh##*:} timeout 400 node tests/checkout308.mjs "${U}?tour=0" > /tmp/au/co-$dev-$full-$sh.log 2>&1; echo "checkout308 $dev:$full:$sh exit=$? $(tail -c 250 /tmp/au/co-$dev-$full-$sh.log | tr '\n' ' ' | cut -c1-200)" >> $S
done; done; done; echo ALLDONE >> $S
