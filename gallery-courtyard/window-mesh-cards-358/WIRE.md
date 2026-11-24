# Wiring (Gallery) — not done here
1. Copy *.glb + *.webp + windows.json to /img/play/preview-251/window-mesh-cards/ (phone → .phone.webp; glb embeds desktop webp, swap map on low if needed).
2. Place cards on courtyard facade exteriors (scale 1.2 → 0.8×1.2 m), facing outward; replace the clerestory placement in glows358.js.
3. Instance glows from window-glows-358 at each card's GlowAttach world matrix; glow quad = 1.8 × window size (≈1.44×2.16 m), same 2:3 orientation, so the 22–78/18–82 opening aligns.
4. Enable arched now (glow-arched / glow-arched-curtain) — arched geometry exists.
