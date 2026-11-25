// Kinoteka Annex mode: when this page is served inside the TJM gallery (/play/neural-dance/),
// it becomes a walk-in room with two doorways back into the Kinoteka hall (a loop, no dead end).
// Kinoteka local frame (from the gallery's kino800 room data): world = D + u*T + v*F, floor 1.2 m.
export const KINO = { D: [24.819, 14.329], F: [0.866, 0.5], T: [0.4999643302543019, -0.866045996742302], floor: 1.2, eye: 1.6, archV: 22.75, archU: 5.96 };
export const ANNEX_DOORS = [
  // annex east door (x=+6) <-> Kinoteka arch on the u<0 wall; annex west door <-> u>0 wall
  { id: 'east', x: 5.99, z: 2.5, side: -1, label: 'Kinoteka' },
  { id: 'west', x: -5.99, z: 2.5, side: 1, label: 'Kinoteka' },
];
export function kinoWorld(u, v) { const { D, F, T } = KINO; return [D[0] + u * T[0] + v * F[0], D[1] + u * T[1] + v * F[1]]; }
export function kinoLocal(x, z) { const { D, F, T } = KINO; const dx = x - D[0], dz = z - D[1]; return [dx * T[0] + dz * T[1], dx * F[0] + dz * F[1]]; }
// Gallery resume state that puts the visitor just inside the Kinoteka arch on `side`, facing the hall.
export function returnState(prev, side) {
  const st = prev && Array.isArray(prev.pos) ? { ...prev } : { weapon: 1, cart: [], swarmCount: 0 };
  const [x, z] = kinoWorld(side * 3.8, KINO.archV); // outside the 5.25 m trigger zone
  const dx = -side * KINO.T[0], dz = -side * KINO.T[1]; const yaw = Math.atan2(-dx, -dz);
  st.pos = [x, KINO.floor + KINO.eye, z]; st.quat = [0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)]; st.at = Date.now();
  return st;
}
export function annexEnabled(loc) { const q = new URLSearchParams(loc.search); return /\/play\/neural-dance\//.test(loc.pathname) || q.get('annex') === '1'; }
export function goBack(side) {
  let prev = null; try { prev = JSON.parse(sessionStorage.getItem('tjmPlayState') || 'null'); } catch { }
  try { sessionStorage.setItem('tjmPlayState', JSON.stringify(returnState(prev, side))); } catch { }
  location.assign('/play/?resume=1');
}
