// Local dev server for deploy/_worker.js. DEV ONLY.
import http from 'node:http';
import W from '../deploy/_worker.js';
const port = +process.env.PORT || 5909;
http.createServer(async (q, r) => {
  const u = 'http://127.0.0.1:' + port + q.url;
  let res;
  try { res = await W.fetch(new Request(u, { method: q.method }), {}, {}); }
  catch (e) { r.writeHead(502); return r.end('upstream ' + e); }
  const h = {}; res.headers.forEach((v, k) => { h[k] = v; });
  r.writeHead(res.status, h); r.end(Buffer.from(await res.arrayBuffer()));
}).listen(port, '127.0.0.1', () => console.log('up', port));
