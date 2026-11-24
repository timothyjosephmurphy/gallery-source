# #293 testimonials map: wire status (Oct 26 2026)
- Status: wired, compiles, NOT deployed.
- Assets: play-tags/public/testimap/{map-albedo-2048,map-albedo-1024,pins-sheet}.webp, 81 KB total. No PNGs copied.
- Code: src/testimap.js only (backup at /tmp/testimap.js.bak).
  - The albedo is drawn into the existing CanvasTexture and cropped per view, using the map.json equirect UV math for the world (lat -58..76) and the NA inset. Phone (`low`) uses 1024 and desktop uses 2048.
  - Pins come from the pins-sheet cells: default, or selected (ochre) when hot, scaled 18/14. The tip anchor is at 0.97. Positions come from src/testimonials.json `pin` [lat, lon], same as before. Hit-testing and the debug API are unchanged.
  - The procedural land and vector pins remain as a fallback until the images load. Palette colours come from map.json.
  - Normal and roughness are NOT wired, because the face is MeshBasicMaterial (Unlit) as map.json advises.
- Build: `npx vite build --outDir /tmp/ptbuild-293/dist` passes. npm run build was skipped because it refetches testimonials.
- Deploy remaining: review in vite dev at room-12 k4, do a normal build, then deploy (another worker or TJ).
