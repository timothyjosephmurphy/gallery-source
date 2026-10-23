// gallery-core (#24): each gallery's src/ holds only its overrides (main.js, look.js, catalog.json,
// museum.config.js, museum-specific modules). Any relative import that the gallery doesn't override
// resolves from the one shared core in /workspace/gallery-core/src.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const CORE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'src');
const saSwap = s => s.replace(/env\(safe-area-inset-(top|right|bottom|left)\)/g, 'var(--sa-$1, env(safe-area-inset-$1))');
export function galleryCore(root) {
  const LOCAL = path.join(root, 'src');
  const MID = () => (/MUSEUM\s*=\s*\{\s*id:\s*'([a-z-]+)'/.exec(fs.readFileSync(path.join(LOCAL, 'museum.config.js'), 'utf8')) || [])[1];
  return {
    name: 'gallery-core', enforce: 'pre',
    config: () => ({ server: { fs: { allow: [root, CORE] } } }),
    // one app (#24): iframes get no safe-area insets on iOS, so every env(safe-area-inset-*) first reads --sa-* that the /play/ shell sets
    // #24: the shared main.js marks each museum's own lines with //#if <ids> ... //#elif ... //#endif; keep only this museum's
    transform(code, id) { if (!/\.(js|css)(\?|$)/.test(id)) return null; let c = code;
      if (c.includes('//#if ')) c = museumLines(c, MID());
      if (c.includes('env(safe-area-inset-')) c = saSwap(c); return c === code ? null : { code: c, map: null }; },
    transformIndexHtml(html) { return saSwap(html); },
    resolveId(source, importer) {
      if (!importer) return null;
      const imp = importer.split('?')[0];
      if (!(source.startsWith('.') || source.startsWith('/'))) { // bare import from a core file: use the gallery's node_modules
        return imp.startsWith(CORE) ? this.resolve(source, path.join(LOCAL, 'main.js'), { skipSelf: true }) : null; }
      if (source.startsWith('/') && !source.startsWith('/src/')) return null;
      let abs = source.startsWith('/src/') ? path.join(root, source) : path.resolve(path.dirname(imp), source);
      let rel = abs.startsWith(CORE) ? path.relative(CORE, abs) : abs.startsWith(LOCAL) ? path.relative(LOCAL, abs) : null;
      if (rel === null || rel.startsWith('..')) return null;
      const [p, q] = [rel.split('?')[0], rel.includes('?') ? '?' + rel.split('?')[1] : ''];
      for (const base of [LOCAL, CORE]) { const f = path.join(base, p); if (fs.existsSync(f) && fs.statSync(f).isFile()) return f + q; }
      return null;
    },
  };
}

export function museumLines(code, mid) { if (!mid) throw new Error('gallery-core: no MUSEUM id in museum.config.js'); let keep = null; const out = [];
  for (const ln of code.split('\n')) { const m = /^\/\/#(if|elif) (.+)$/.exec(ln); if (m) { keep = m[2].split(' ').includes(mid); out.push(''); continue; }
    if (ln === '//#endif') { keep = null; out.push(''); continue; } out.push(keep === false ? '' : ln); } return out.join('\n'); }
