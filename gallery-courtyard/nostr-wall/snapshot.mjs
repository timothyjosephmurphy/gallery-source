import { getNotes } from './nostr-wall.js'; import fs from 'node:fs';
const n = await getNotes({ limit: 10, timeoutMs: 8000, useCache: false });
console.log('fetched', n.length); if (n.length) fs.writeFileSync(new URL('./fallback.json', import.meta.url), JSON.stringify(n, null, 2));
