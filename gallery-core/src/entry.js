import './shell-bridge.js'; // one app: gates swap through the /play/ shell (#24)
import './museum-gates/ui.js'; // phone layout, zoom guard, start screen, tool tips, toolbar order (#149 #150)
// Entry: in-app browsers (X, Instagram, Facebook, ...) get an 'open in your browser' notice with a 'Try anyway' button.
// No WebGL2 (three.js r170 needs it; iOS 14 and older) gets a clear 'needs iOS 15 or a newer browser' notice (#208).
import { inApp } from './inapp.js';
let gl2 = false; try { gl2 = !!document.createElement('canvas').getContext('webgl2'); } catch (e) {}
const start = () => import('./main.js').then(() => { window.__mainLoaded = 1; import('./eggs-install.js'); }, () => window.__playFallback('nostart'));
window.__playAnyway = start;
if (!gl2) window.__playFallback('nogl2'); else if (inApp) window.__playFallback('inapp'); else start();
