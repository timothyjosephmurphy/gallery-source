import { galleryCore } from '../gallery-core/vite-core.js';
// #251 tag gallery (preview). Images are proxied same-origin like the museum previews.
const px = (t) => ({ target: t, changeOrigin: true, rewrite: p => p.replace(/^\/play\/(mva|tjm|img)\//, '/') });
export default { base: '/play/', plugins: [galleryCore(process.cwd())],
  preview: { proxy: { '/play/mva/': px('https://media.vermillionaurora.com'), '/play/tjm/': px('https://tjm.art'), '/play/img/': px('https://img.tjm.art') } },
  server: { proxy: { '/play/mva/': px('https://media.vermillionaurora.com'), '/play/tjm/': px('https://tjm.art'), '/play/img/': px('https://img.tjm.art') } } };
