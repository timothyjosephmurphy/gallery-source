import test from 'node:test'; import assert from 'node:assert/strict';
import { AUTHOR, dedupeSort, countZaps, toPlain, noteId, getNotes, loadFallback, clearCache } from './nostr-wall.js';
const ev = (id, t, extra = {}) => ({ id: id.repeat(64), pubkey: AUTHOR, kind: 1, created_at: t, content: 'x' + t, tags: [], ...extra });
test('dedupe, filter, sort newest first', () => {
  const r = dedupeSort([ev('a', 1), ev('b', 3), ev('a', 1), ev('c', 2, { pubkey: '0'.repeat(64) }), ev('d', 5, { kind: 7 }), null]);
  assert.deepEqual(r.map(e => e.created_at), [3, 1]);
});
test('zap counting via #e, deduped', () => {
  const id = 'a'.repeat(64), z = { id: 'z1', kind: 9735, tags: [['e', id]] };
  assert.deepEqual(countZaps([z, z, { id: 'z2', kind: 9735, tags: [['e', id]] }, { id: 'z3', kind: 9735, tags: [['e', 'b'.repeat(64)]] }], [id]), { [id]: 2 });
});
test('plain object + njump url', () => {
  const p = toPlain(ev('a', 9), 3);
  assert.deepEqual(Object.keys(p), ['id', 'createdAt', 'content', 'zaps', 'url']);
  assert.match(p.url, /^https:\/\/njump\.me\/note1[a-z0-9]{58}$/);
  assert.equal(noteId('9073d02139427606a97c6d14968e2dbe3fdb803f9e842a57b5ee64dfc8d97e02'), 'note1jpeaqgfegfmqd2tud52fdr3dhclahqpln6zz54a4aejdljxe0cpq8tgkc7');
});
test('falls back to fallback.json when relays unreachable', async () => {
  clearCache();
  const fb = await loadFallback();
  const r = await getNotes({ relays: ['wss://127.0.0.1:1'], timeoutMs: 500, useCache: false });
  assert.deepEqual(r, fb.slice(0, 10)); assert.ok(fb.length > 0);
});
test('no secrets in source', async () => {
  const fs = await import('node:fs');
  assert.ok(!/nsec1|privkey|\.sign\(/i.test(fs.readFileSync(new URL('./nostr-wall.js', import.meta.url), 'utf8')));
});
