// In-app browsers (X/Twitter, Instagram, Facebook, Messenger, LINE, LinkedIn, Snapchat, TikTok, Pinterest, Android WebViews):
// detected by user agent; entry.js then shows the 'open in your browser' notice (with a 'Try anyway' button) instead of loading the game.
// Let through (#208): iOS Home Screen web apps (standalone/fullscreen), and the browsers built into Gmail, Google, Slack, Discord, Reddit.
const UA = navigator.userAgent || '';
const OK_APP = /GSA\/|Gmail|Slack|Discord|Reddit|CriOS|FxiOS|EdgiOS/i.test(UA);
let standalone = false; try { standalone = navigator.standalone === true || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches; } catch (e) {}
const APP = /Instagram/.test(UA) ? 'Instagram' : /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Messenger/.test(UA) ? 'Facebook' : /Twitter|TwitterAndroid/.test(UA) ? 'X' :
  /\bLine\//.test(UA) ? 'LINE' : /LinkedInApp/.test(UA) ? 'LinkedIn' : /Snapchat/.test(UA) ? 'Snapchat' : /musical_ly|BytedanceWebview|TikTok/i.test(UA) ? 'TikTok' :
  /Pinterest/.test(UA) ? 'Pinterest' : standalone || OK_APP ? '' : /Android.*; wv\)/.test(UA) ? 'app' :
  /iPhone|iPad|iPod/.test(UA) && /AppleWebKit/.test(UA) && !/Safari\//.test(UA) ? 'app' : ''; // iOS WKWebView in an app (no Safari token)
export const inApp = !!APP;
