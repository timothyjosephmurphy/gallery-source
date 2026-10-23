# #251: teach gallery-core/src/main.js the 'tags' gallery. Mostly 'tags' rides on the uffizi branches (flat floor, daylight);
# a handful of blocks get their own '//#elif tags' branch. Inert for every other gallery (verified by tools/core-same.mjs).
import re, sys
P = '/workspace/gallery-core/src/main.js'; s = open(P).read()
if "'./tags.js'" in s: sys.exit('already patched')
L = s.split('\n')
OWN = {}  # line text (stripped, first occurrence after an anchor) -> replacement handled below
def find(pred, start=0):
    for i in range(start, len(L)):
        if pred(L[i]): return i
    raise SystemExit('anchor not found')
def insert_before(i, lines): L[i:i] = lines
# 1. import
i = find(lambda l: l == '//#elif uffizi'); insert_before(i, ['//#elif tags', "import { buildTags } from './tags.js'; // #251 tag gallery: hex rooms by tag, Roman-garden pavilion and courtyards"])
# 2. sky colour
i = find(lambda l: l == '//#elif uffizi', i + 3); insert_before(i, ['//#elif tags', 'scene.background = new THREE.Color(0xcfe0ea); // Roman garden sky'])
# 3. floor plan block
i = find(lambda l: l == '//#elif uffizi', i + 3); insert_before(i, ['//#elif tags', '{ const st = CATALOG.layout.start; camera.position.set(st.x, 1.6, st.z); camera.lookAt(st.x + Math.sin(st.yaw) * 5, 1.6, st.z + Math.cos(st.yaw) * 5); }'])
# 4. build (nave) block
i = find(lambda l: l == '//#elif uffizi', i + 3); insert_before(i, ['//#elif tags',
 '// ---- #251 tag gallery: the whole site (src/tags.js); nothing here is a rectangular room',
 'const TAGS = buildTags(scene, { CATALOG, LOW, MEDIUM });',
 'const PIT = TAGS.PIT, NAVE = TAGS.NAVE, NAVE_SIGNS = TAGS.NAVE_SIGNS;',
 'const pitTex = { offset: { set() {} } }, pitTex2 = pitTex;'])
# 5. GATE / CHK
i = find(lambda l: l.startswith('const GATE = (() => {')); insert_before(i, ['//#if tags', 'const GATE = TAGS.GATE;', '//#elif play orsay bilbao uffizi gugg-ny splat'])
j = find(lambda l: l.startswith('  return { pos:'), i); insert_before(j + 1, ['//#endif'])
i = find(lambda l: l.startswith('const CHK = (() => {')); insert_before(i, ['//#if tags', 'const CHK = TAGS.CHK;', '//#elif play orsay bilbao uffizi gugg-ny splat'])
j = find(lambda l: l.startswith('  return { pos:'), i); insert_before(j + 1, ['//#endif'])
i = find(lambda l: l.startswith('let leaving = false;')); insert_before(i, ['//#if tags', 'TAGS.buildGates(gateMat, signMesh); // museum gates + concert hall (coming soon) on the pavilion core wall', '//#endif'])
# 6. walkable
i = find(lambda l: l == '//#elif uffizi', find(lambda l: l.startswith('const MARGIN = 0.45;')))
insert_before(i, ['//#elif tags', 'const NV = L.nave, DOORS = [];', 'const WALK_EXTRA = window.__walkExtra = window.__walkExtra || []; // museum-eggs: extra walkable areas (secret room)',
 'function walkable(x, z) {', '  for (const f of WALK_EXTRA) if (f(x, z)) return true;', '  return TAGS.walkable(x, z);'])
# the shared tail after //#endif (ROOMS/HALLS loops, return false) is harmless: ROOMS and HALLS are empty for tags
# 7. roomAt
i = find(lambda l: l == '//#if play orsay bilbao uffizi' and L[L.index(l) + 1].startswith('function roomAt'), 0) if False else None
for k in range(len(L)):
    if L[k] == '//#if play orsay bilbao uffizi' and L[k + 1].startswith('function roomAt'): i = k; break
insert_before(i + 2, ['//#elif tags', 'function roomAt(x, z) { return TAGS.roomAt(x, z); }'])
# 8. plaques at 1.45 m beside the work (layout plaque spot), never under it
i = find(lambda l: l.startswith('  plq.position.set(0, -fh / 2 - 0.044 - PLAQUE_H / 2, 0.012);'))
insert_before(i + 1, ['//#if tags', '  if (data.plaqueAt) { const q = data.plaqueAt; plq.position.set((q.x - data.x) * data.iz - (q.z - data.z) * data.ix, 1.45 - data.y, 0.012); plq.scale.set(q.w, q.w * PLAQUE_H / PLAQUE_W, 1); } else plq.visible = false; // temple 2x2 shares one plaque', '//#endif'])
# 9. gravity gun: own (empty) layout key, GET only
i = find(lambda l: "gallery: 'uffizi'" in l) - 1; insert_before(i, ['//#elif tags', "grav = createGravGun({ scene, camera, paintings, say, isMuted: () => !!holo.muted, walkable, roomAt, gallery: 'tags' /* preview: no layout saves */});"])
# 10. footsteps floor material
i = find(lambda l: "inB(NV, 0)) return 'marble'" in l) - 1; insert_before(i, ['//#elif tags', "move.setFloorMaterial((x, z) => { const r = TAGS.roomAt(x, z); return r && /^room-/.test(r.id) ? 'stone' : Math.hypot(x, z) < 9.6 ? 'marble' : 'stone'; });"])
# 11. go-to list
i = find(lambda l: "title: 'The Tribuna' }" in l) - 1; insert_before(i, ['//#elif tags', "gotoSel.innerHTML = '<option value=\"\">Go to a painting…</option>' + TAGS.ROOMS_UI.map(r => `<optgroup label=\"${esc(r.title)}\">` + paintings.filter(p => p.room === r.id).map(p => `<option value=\"${p.i}\">${esc(p.data.title)}</option>`).join('') + '</optgroup>').join('');"])
s = '\n'.join(L)
# everything else: tags behaves like uffizi
out = []
LL = s.split('\n')
# own branches already exist for these; the uffizi-only lines that tags still shares (fall message, thrown-object bounds):
SHARE = {k for k, l in enumerate(LL) if l == '//#elif uffizi' and ('TRIBUNA FLOOR' in LL[k + 2] or 'inNave = bx > NV.minX' in LL[k + 1])}
NOT = {k for k, l in enumerate(LL) if l.startswith('//#') and k + 1 < len(LL) and (LL[k + 1].startswith('function roomAt(x, z) { let best') or LL[k - 1] in ('const GATE = TAGS.GATE;', 'const CHK = TAGS.CHK;'))}
for k, ln in enumerate(LL):
    if k in NOT: out.append(ln); continue
    m = re.match(r'^//#(if|elif) (.+)$', ln)
    if m and 'uffizi' in m.group(2).split() and 'tags' not in m.group(2).split() and (m.group(2).strip() != 'uffizi' or k in SHARE): ln += ' tags'
    out.append(ln)
s = '\n'.join(out)
open(P, 'w').write(s); print('patched')
s = open(P).read().split('\n')
k = s.index('  books.update(dt);'); s[k + 1:k + 1] = ['//#if tags', '  TAGS.update(dt, camera, { say }); // Neural Dance canvas, fountain jets, minimap, museum gates', '//#endif']
s += ['//#if tags', "// #251 hooks (HOOKS.md): player pose (yaw 0 = facing +z, increasing toward +x), then minimap + optional garden",
      "{ const f = new THREE.Vector3(); window.game.player = () => { camera.getWorldDirection(f); return { x: camera.position.x, z: camera.position.z, y: camera.position.y, yaw: Math.atan2(f.x, f.z) }; }; }",
      'TAGS.finish(window.game);', '//#endif', '']
open(P, 'w').write('\n'.join(s)); print('hooks wired')
s = open(P).read()
R = [("//#if play orsay bilbao uffizi tags\nconst DAIS = { x: 0, z: (ROOMS[0].minZ + ROOMS[0].maxZ) / 2 };", "//#if play orsay bilbao uffizi\nconst DAIS = { x: 0, z: (ROOMS[0].minZ + ROOMS[0].maxZ) / 2 };\n//#elif tags\nconst DAIS = { x: -4.5, z: 2.6 }; // hologram dais in the open pavilion (#278: the centre holds the checkout pillar)"),
     ("//#if play orsay bilbao uffizi tags\n  { room: 'travels'", "//#if play orsay bilbao uffizi\n  { room: 'travels'"),
     ("//#elif splat\n]; // splat room: only", "//#elif splat tags\n]; // splat room: only"),
     ("//#if play orsay bilbao uffizi tags\nHOLO_DEFS.forEach(d => { const r = ROOMS.find", "//#if play orsay bilbao uffizi\nHOLO_DEFS.forEach(d => { const r = ROOMS.find"),
     ("//#elif gugg-ny splat\nHOLO_DEFS.forEach(d => { const r = d.room === 'central'", "//#elif gugg-ny splat tags\nHOLO_DEFS.forEach(d => { const r = d.room === 'central'")]
R += [("BOOK_DEFS.forEach(d => { const r = ROOMS.find(q => q.id === d.room),", "//#if tags\nconst TAGS_BOOKS = BOOK_DEFS.splice(0); // #281: tags books carry their own spot\n//#endif\nBOOK_DEFS.forEach(d => { const r = ROOMS.find(q => q.id === d.room),"), ("\nconst books = makeBooks({", "\n//#if tags\nfor (const d of TAGS_BOOKS) { d.cover = `books/${d.id}/cover.webp`; BOOK_DEFS.push(d); }\n//#endif\nconst books = makeBooks({")]
R += [("const BOOK_DEFS = [\n//#if play orsay bilbao uffizi tags", "const BOOK_DEFS = [\n//#if play orsay bilbao uffizi"), ("//#elif splat\n]; // splat room: no art books", "//#elif tags\n  // #281: the readable art books on lecterns near the middle of their subject rooms (clear of doors, paths, art and plaques)\n  { id: 'landscapes', room: 'room-01', x: 14.465, z: 17.568, yaw: -1.5708, title: 'Watercolor Landscapes', url: 'https://tjm.art/products/watercolor-landscapes/', pages: 75, aspect: 612 / 787.92, fixed: 1 },\n  { id: 'portraits', room: 'room-11', x: -10.921, z: -22.825, yaw: -1.5708, title: 'Watercolor Portraits', url: 'https://tjm.art/products/watercolor-portraits/', pages: 79, aspect: 612 / 787.92, fixed: 1 },\n  { id: 'reflections', room: 'room-05', x: 16.630, z: 7.818, yaw: -1.5708, title: 'Reflections on Time', url: 'https://tjm.art/products/reflections-on-time/', pages: 35, aspect: 432 / 648, fixed: 1 }];\n//#elif splat\n]; // splat room: no art books")]
for a, b in R:
    assert s.count(a) == 1, a[:60]; s = s.replace(a, b)
open(P, 'w').write(s); print('holo/dais fixed')
