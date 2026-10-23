// #298: for each wished price, is the original really for sale at that price in the live tjm.art checkout? Prints what the shop must change.
import fs from 'fs';
const W = JSON.parse(fs.readFileSync(new URL('../src/price-wishlist.json', import.meta.url))), C = JSON.parse(fs.readFileSync(new URL('../src/catalog.json', import.meta.url)));
const cap = await (await fetch('https://tjm.art/checkout/cart/catalog')).json(), live = new Map(cap.products.map(p => [p.id, p])); let ready = 0;
for (const w of W.items) { const id = w.id || (C.paintings.find(p => p.title === w.title) || {}).id, l = live.get(id), ok = l && l.status === 'available' && Number(l.amount) === w.price;
  if (ok) ready++; console.log((ok ? 'READY  ' : 'NEEDED ') + id + ' "' + w.title + '" want $' + w.price + ' checkout: ' + (l ? l.status + ' $' + l.amount : 'not listed')); }
console.log(ready + '/' + W.items.length + ' ready. When READY, rebuild shop.json (gallery-core tools/shop.py) and catalog, then redeploy the preview.');
