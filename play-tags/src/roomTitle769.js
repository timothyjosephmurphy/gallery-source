// #769 (TJ Oct 27): the floating gold #title shows the CURRENT room / gallery name, smaller (hex only; was a fixed "TJM GALLERY").
// Hub / unknown -> "TJM Gallery". Room labels lose any price segment (#763). Inline style only, so gallery-core style.css stays shared.
export function roomName(r) {
  if (!r) return 'TJM Gallery';
  if (r.kind === 'room') return String(r.label || '').split(' · ').filter(x => !/\$\s*\d/.test(x))[0] || 'TJM Gallery';
  if (r.kind === 'outer' || r.kind === 'court') return r.label || 'Garden court';
  return 'TJM Gallery';
}
export function installRoomTitle769(W) {
  const el = document.getElementById('title'); if (!el) return null;
  const phone = matchMedia('(pointer:coarse)').matches;
  Object.assign(el.style, { fontSize: phone ? '12px' : '17px', letterSpacing: phone ? '1.5px' : '2.5px', whiteSpace: 'nowrap', textTransform: 'uppercase', WebkitTextStroke: '0.5px #4a2a10', textShadow: '2px 2px 0 #1a0e06' });
  let last = '';
  const tick = () => {
    const cp = window.game && window.game.camera && window.game.camera.position; if (!cp) return;
    let r = null; try { r = W.roomAt(cp.x, cp.z); } catch (e) { r = null; }
    const t = roomName(r); if (t !== last) { last = t; el.textContent = t; }
  };
  const id = setInterval(tick, 400); tick();
  return { stop: () => clearInterval(id), tick };
}
