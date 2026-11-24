# #807 = studio-tracker #764 (TJ Oct 27 2026): four guitar holograms (harness2-uffizi HOLOS) on floor plinths in hex rooms without one.
# Code: src/guitarHolo764.js. Idempotent; asserts 806/807.
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (806,807), T['nest']
T['nest'].update(issue=807,prev=806,guitar764=dict(tracker=764,rooms=['room-02','room-07','room-03','room-08'],plinth='2.8x2.8x0.25 m',assets='img.tjm.art/play/holo/'))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(807)
