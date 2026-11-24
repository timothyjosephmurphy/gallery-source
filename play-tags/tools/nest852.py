# #852: Visual lock-spec landscape pack wired (CDN Bosphorus vista + trees-199 pine GLBs). Asserts tip 851. Idempotent.
import json, os, shutil
F='src/catalog.json'
if not os.path.exists('/tmp/catalog.json.851'): shutil.copy(F,'/tmp/catalog.json.851')
c=json.load(open(F)); N=c['layout']['tags']['nest']; assert N['issue'] in (851,852), N
N.update(issue=852,prev=851)
N['note852']='Landscape pack: fountain-sw vista811 cylinder now maps the painted Bosphorus webp from img.tjm.art/play/preview-251/bosphorus-vista/ (phone webp on coarse pointer); procedural canvas stays as fallback; geometry, BackSide, fog off, blend833 transparency, renderOrder and day/night lerp unchanged. container780 treeline swaps to meshopt pine-01..04 GLBs from img.tjm.art/play/preview-251/trees-199/ (lod0 desktop, lod1 coarse), random yaw, scale 0.8-1.25, same spots behind the container, decor only; procedural cones kept until load / on failure. horizon352 Cascades untouched. Soft holds, brass, plaques, hang sizes untouched.'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(N['note852'][:80])
