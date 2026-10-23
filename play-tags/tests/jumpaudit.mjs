// #269 no-unintended-jump audit: walks every path (0.4 m steps), through every doorway (both ways), the whole checkout
// approach EXCEPT the gate mouth, then a long random wander (3000 steps), with the real game loop running between steps.
// Fails on ANY gallery change: a navigation, a gate/checkout/dungeon trigger, or a '[jump]' log. Finally walks into the
// checkout gate on purpose and expects exactly that jump, with its reason logged. desktop | phone (390x844).
import { chromium } from 'playwright-core';
const [url, dev = 'desktop', steps = 3000] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } };
const p = await (await b.newContext(o)).newPage(); const logs = [], navs = [];
p.on('console', m => { if (/\[jump\]/.test(m.text())) logs.push(m.text()); });
p.on('framenavigated', f => { if (f === p.mainFrame()) navs.push(f.url()); });
await p.addInitScript(() => { window.__noNav = true; });
await p.goto(url); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && game.tags.garden && game.fps > 0, null, { timeout: 200000 });
navs.length = 0;
const r = await p.evaluate(async (N) => {
  window.__auditNoRender = true; const W = game.tags.world, frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const chk = { x: 0, z: 0, nx: 1, nz: 0 } /* #290: the checkout bubble at the centre */, nearGate = (x, z) => Math.hypot(x - chk.x, z - chk.z) < 1.45;
  const jumped = () => window.__gateLeft || window.__checkoutGo || window.__dungeonGo || (window.__gatesNav && 0);
  const fails = []; let n = 0, phase = '';
  const at = async (x, z, tx, tz) => { if (nearGate(x, z)) return; game.view(x, z, tx ?? x + 1, tz ?? z); n++; await frame(); if (jumped()) { fails.push({ phase, x: +x.toFixed(2), z: +z.toFixed(2), gate: window.__gateLeft, chk: window.__checkoutGo, dun: window.__dungeonGo }); window.__gateLeft = window.__checkoutGo = window.__dungeonGo = null; } };
  phase = 'paths'; for (const q of [...W.paths, ...(W.rings || [])]) { if (q.x0 != null) { const L = Math.hypot(q.x1 - q.x0, q.z1 - q.z0); for (let t = 0; t <= L; t += 0.4) { const x = q.x0 + (q.x1 - q.x0) * t / L, z = q.z0 + (q.z1 - q.z0) * t / L; if (W.walkable(x, z)) await at(x, z, q.x1, q.z1); } }
    else if (q.r0 != null) { const rm = (q.r0 + q.r1) / 2; for (let a = 0; a < 6.283; a += 0.4 / rm) { const x = q.x + Math.cos(a) * rm, z = q.z + Math.sin(a) * rm; if (W.walkable(x, z)) await at(x, z, q.x, q.z); } } }
  phase = 'doorways'; for (const d of W.doors) for (const s of [1, -1]) for (let v = -1.4; v <= 1.4; v += 0.2) { const x = d.x + d.nx * v * s, z = d.z + d.nz * v * s; if (W.walkable(x, z)) await at(x, z, d.x + d.nx * 3 * s, d.z + d.nz * 3 * s); }
  phase = 'core ring (gate fronts and backs)'; for (let rr = 1; rr < 9; rr += 0.5) for (let a = 0; a < 6.283; a += 0.35 / rr) { const x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (W.walkable(x, z)) await at(x, z, 0, 0); }
  phase = 'random wander'; let x = -3, z = 0, h = 0, seed = 269; const R = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < N; i++) { h += (R() - 0.5) * 1.2; let nx = x + Math.cos(h) * 0.35, nz = z + Math.sin(h) * 0.35; if (!W.walkable(nx, nz) || nearGate(nx, nz)) { h += Math.PI * (0.5 + R()); continue; } x = nx; z = nz; await at(x, z, x + Math.cos(h), z + Math.sin(h)); }
  const steps = n; phase = 'deliberate checkout';
  for (let v = 2.4; v >= 0.75; v -= 0.15) { game.view(chk.x + chk.nx * v, chk.z + chk.nz * v, chk.x, chk.z); await frame(); if (window.__checkoutGo) break; }
  const intended = { checkout: !!window.__checkoutGo, url: window.__checkoutGo || null };
  window.__auditNoRender = false; return { steps, fails: fails.slice(0, 30), nFails: fails.length, intended, niches: (game.tags.niches || []).length, gates: game.tags.gates.length };
}, +steps);
r.jumpLogs = logs; r.navigations = navs;
r.pass = r.nFails === 0 && navs.length === 0 && r.intended.checkout && logs.length === 1 && /checkout: touched the checkout bubble/.test(logs[0]);
console.log(JSON.stringify(r)); console.log('JUMPAUDIT', dev, r.pass ? 'PASS' : 'FAIL'); await b.close(); process.exit(r.pass ? 0 : 1);
