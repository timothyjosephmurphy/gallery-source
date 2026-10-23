# #269: run after tools/patch-core.py. Tags gets bounded gate triggers (the old test had no back limit, so a 1.4 m strip
# behind every gate, running out across the whole map, counted as "inside the gate"); every gallery jump logs its reason.
p='/workspace/gallery-core/src/main.js'; s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1,(a,s.count(a)); s=s.replace(a,b)
rep("""    if (along < 0.7 && out < 0.62 && !chaosActive) enterGate(); }""","""//#if tags
    if (along < 0.7 && out < 0.62 && out > -0.35 && !chaosActive) { console.info('[jump] walked into the realm slipgate'); enterGate(); } }
//#elif play orsay bilbao uffizi gugg-ny splat
    if (along < 0.7 && out < 0.62 && !chaosActive) { console.info('[jump] walked into the realm slipgate'); enterGate(); } }
//#endif""")
rep("""    if (along < 0.7 && out < 0.62 && !chaosActive) goCheckout(); }""","""//#if tags
    if (along < 0.7 && out < 0.62 && out > -0.35 && !chaosActive) goCheckout('walked into the checkout gate'); }
//#elif play orsay bilbao uffizi gugg-ny splat
    if (along < 0.7 && out < 0.62 && !chaosActive) goCheckout('walked into the checkout gate'); }
//#endif""")
rep("function goCheckout() {\n  if (leaving) return; leaving = true;","function goCheckout(reason = 'checkout requested') {\n  if (leaving) return; leaving = true; console.info('[jump] checkout:', reason);")
rep("window.__goCheckout = () => goCheckout();","window.__goCheckout = (why) => goCheckout(why || 'guide bot checkout run');")
rep("go: () => goCheckout(),","go: () => goCheckout('cart button'),")
rep("function goDungeon() { if (dunGoing) return; dunGoing = true;","function goDungeon() { if (dunGoing) return; dunGoing = true; console.info('[jump] walked into the dungeon gate');")
rep("  say('OPENING ' + d.title.toUpperCase());","  console.info('[jump] opened a painting page:', d.url); say('OPENING ' + d.title.toUpperCase());")
rep("window.__wentHome = true; try","window.__wentHome = true; console.info('[jump] home button'); try")
rep("function buy() {", "window.__buyPrint = a => buyPrint(a); // #270: click / tap on the print copy's label\nfunction buy() {")
# #272 loading: tags loads base textures by distance (nearest first, 4 at a time) instead of all 233 before the first frame
rep("""  loadTex(BASE + data.img, 3, t => { sharp(t); renderer.initTexture(t); p.baseTex = t; // uploaded before it is shown
    if (!p.hiTex) { mesh.material.map = t; mesh.material.color.set(0xffffff); mesh.material.needsUpdate = true; } p.base = 1; }, () => { p.baseFailed = 1; });""",
"""//#if tags
  p.baseUrl = BASE + data.img; baseQ.push(p); // #272: streamed by distance (basePump), never all at once before play
//#elif play orsay bilbao uffizi gugg-ny splat
  loadTex(BASE + data.img, 3, t => { sharp(t); renderer.initTexture(t); p.baseTex = t; // uploaded before it is shown
    if (!p.hiTex) { mesh.material.map = t; mesh.material.color.set(0xffffff); mesh.material.needsUpdate = true; } p.base = 1; }, () => { p.baseFailed = 1; });
//#endif""")
rep("const paintings = [];\n", """const paintings = [];
//#if tags
const baseQ = []; let baseActive = 0, baseDone = 0; // #272: low-res base images, nearest first, 4 in flight, one GPU upload per frame
function basePump() { if (LOW && !(window.game && window.game.fps > 0) && baseActive >= 2) return; /* #272: low tier, before the first frame: 2 at a time */ const cp = camera.position; for (const p of baseQ) p.dist = p.group.position.distanceTo(cp); baseQ.sort((a, b) => a.dist - b.dist);
  while (baseActive < 4 && baseQ.length && baseQ[0].dist < 60) { const p = baseQ.shift(); baseActive++;
    loadTex(p.baseUrl, 3, t => { baseActive--; baseDone++; sharp(t); p.baseTex = t; if (!p.hiTex) { p.mesh.material.map = t; p.mesh.material.color.set(0xffffff); p.mesh.material.needsUpdate = true; } p.base = 1; basePump(); }, () => { baseActive--; p.baseFailed = 1; basePump(); }); }
  window.__tagsLoad = { done: baseDone, queued: baseQ.length, active: baseActive, total: paintings.length }; }
//#endif
""")
rep("  hiQueue.sort((a, b) => a.dist - b.dist); hiPump();\n", """  hiQueue.sort((a, b) => a.dist - b.dist); hiPump();
//#if tags
  basePump();
//#endif
""")

# #272: tags holds the scene render until every shader is compiled off the main thread (compileAsync), so the first frames never freeze
rep("  pipeline.render(); renderer.setRenderTarget(null); renderer.clearDepth(); if (!window.__reading) renderer.render(vmScene, vmCam);\n",
"""//#if tags
  if (!TAGS.holding()) { pipeline.render(); renderer.setRenderTarget(null); renderer.clearDepth(); if (!window.__reading) renderer.render(vmScene, vmCam); }
//#elif play orsay bilbao uffizi gugg-ny splat
  pipeline.render(); renderer.setRenderTarget(null); renderer.clearDepth(); if (!window.__reading) renderer.render(vmScene, vmCam);
//#endif
""")

open(p,'w').write(s)
p='/workspace/gallery-core/src/museum-gates/gates.js'; s=open(p).read()
a="leaving = true; window.__gateLeft = { id: gt.id, url: navUrl(gt), how };"; assert s.count(a)==1
s=s.replace(a, a+" console.info('[jump] museum gate', gt.id, how);"); open(p,'w').write(s)
print('ok')
