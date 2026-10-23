import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext(process.argv[3] === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } })).newPage(); const s = await p.context().newCDPSession(p);
if (process.argv[3] === 'phone') await s.send('Emulation.setCPUThrottlingRate', { rate: 4 }); await s.send('Profiler.enable'); await s.send('Profiler.setSamplingInterval', { interval: 500 }); await s.send('Profiler.start');
await p.goto(process.argv[2], { waitUntil: 'commit' }); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && game.fps > 0, null, { timeout: 200000, polling: 100 });
const { profile } = await s.send('Profiler.stop'); const self = new Map(), dt = {};
const idx = new Map(profile.nodes.map(n => [n.id, n])); const ts = profile.timeDeltas; const cnt = new Map(); profile.samples.forEach((id, i) => cnt.set(id, (cnt.get(id) || 0) + (ts[i] || 0)));
// inclusive time per function
const parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
const incl = new Map(); for (const [id, t] of cnt) { const seen = new Set(); for (let q = id; q != null; q = parent.get(q)) { const n = idx.get(q), k = n.callFrame.functionName + ' ' + n.callFrame.url.split('/').pop() + ':' + n.callFrame.lineNumber; if (seen.has(k)) continue; seen.add(k); incl.set(k, (incl.get(k) || 0) + t); } const n = idx.get(id), k = n.callFrame.functionName + ' ' + n.callFrame.url.split('/').pop() + ':' + n.callFrame.lineNumber; self.set(k, (self.get(k) || 0) + t); }
const top = m => [...m].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => (v / 1000).toFixed(0) + 'ms ' + k);
console.log('INCLUSIVE\n' + top(incl).join('\n')); console.log('SELF\n' + top(self).join('\n')); await b.close();
