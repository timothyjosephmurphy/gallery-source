import { galleryCore } from '../gallery-core/vite-core.js';
// #251 tag gallery (preview). Images are proxied same-origin like the museum previews.
const px = (t) => ({ target: t, changeOrigin: true, rewrite: p => p.replace(/^\/play\/(mva|tjm|img)\//, '/') });
export default { base: '/play/', plugins: [galleryCore(process.cwd())],
  // #489 (Tue Oct 27 2026 ~12:40 AM PT): three.js in its own 'vendor-three' chunk (clarity for size reports; gen.py still inlines every asset). LAZY-LOAD-SCOUT.md item 1.
  build: { rollupOptions: { output: { manualChunks: id => (/[\\/]node_modules[\\/]three[\\/]/.test(id) ? 'vendor-three' : undefined) } } },
  preview: { proxy: { '/play/mva/': px('https://media.vermillionaurora.com'), '/play/tjm/': px('https://tjm.art'), '/play/img/': px('https://img.tjm.art') } },
  server: { proxy: { '/play/mva/': px('https://media.vermillionaurora.com'), '/play/tjm/': px('https://tjm.art'), '/play/img/': px('https://img.tjm.art') } } };
