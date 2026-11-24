# renderer.info draw-call / LOD scout, Mon Oct 26 2026 ~7:30 PM PT (LIVE 471e3a9a, desktop 1280x800, swiftshader)
Scripts: play-tags/tests/_drawscout.mjs and _shadowscout.mjs. They set info.autoReset=false and read one full frame, because the composer resets info per pass and the default read shows 6 calls.
## Numbers (before #477)
- Courtyard spawn: 589 calls, 187k tris, 137 textures, 240 geometries, 83 programs.
- Dense room views (sampled every ~8th painting, camera 3 m off the wall): top 1122 / 1098 / 1034 calls (rooms near -6,-17 / -19,-1 / 10,-13), about 230k tris. Median view 304 calls. Programs settle at 97, textures 560-760 once hi streams in.
- Scene: 2790 meshes, only 15 InstancedMesh. Materials: 1819 MeshBasic, 949 MeshStandard. Geometry: 2057 PlaneGeometry, 356 Box.
- Shadows: 3 PointLights at 256 px with shadow.autoUpdate=false, so there is no per-frame shadow cost (toggling shadowMap.autoUpdate does not change calls). 703 castShadow meshes, which only matters when the shadow map is refreshed.
- Frustum-visible breakdown at a dense view (875 calls): unnamed 228, doorTrim 110, fence 97 (all >12 m away), roomWall 64, cornice 57, ostrich Leg 30, jamb 29, doorFlare 19.
## Follow-ups ranked by risk
1. LOW, SHIPPED as #477: merge the doorway trims (static, unlit MeshBasic in 2 colours, about 150 meshes) into 2 world-baked meshes. Pixel-identical. Dense view 875 -> 767 calls on LIVE (707 locally).
2. LOW-MED: fence352 builds one plane per segment, each with its own cloned material (repeat differs). Bake L/TILE into the UVs as the AO strip already does, share one material, and merge: about 97 draws -> 1. Cost: castShadow plus alphaTest on a single big mesh, so check the shadow refresh.
3. MED: roomWall/cornice/jamb (about 150 visible) merge per wall material, or instance the box geometry. These are touched by colliders, tagsaudit arch checks and the 352 AO path, so this one needs care and a pass on the 228 unnamed meshes first (name them to attribute them).
