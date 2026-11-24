# #803 B3 courtyard batch (TJ Oct 27 2026): #758 flanges off (tags-world.js NO_FLARES758), #759 outward CHECKOUT ring (checkout-ring-759.webp),
# #351 spawn in the START courtyard facing the gallery wall map (#291) with the arched pavilion ahead, checkout behind. Idempotent; asserts 802/803.
import json, math
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (802,803), T['nest']
SP=dict(x=0.5, z=-28.2, yaw=-0.8)  # look toward (-3.09,-24.72): faces the gallery map: pavilion arch ahead-left, gallery map (x -6.09, z -25.15) on the right
c['layout']['start']=SP; T['hub']['start']=dict(x=SP['x'], z=SP['z'], faceAngle=round(90-math.degrees(SP['yaw']),1), note='#351/#803: START courtyard facing the gallery wall map, pavilion arch ahead')
T['nest'].update(issue=803, prev=802, b3_803={'758':'door flanges removed','759':'checkout-ring-759 outward','351':SP})
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(803, SP)
