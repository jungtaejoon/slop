// Slop service worker: lets the site install as a phone app and reopen fast.
// - Build files under assets/ have hashed names and never change: cache first.
// - Pages: network first; offline, the last copy (or the app shell) is shown.
// - Icons, preview images, examples: network first with a cached fallback.
// - Everything else (Supabase API, fonts, other sites) is left alone: always live.
// Visiting any page with ?nosw unregisters it (kill switch, handled in main.js).
const VERSION = 'v1';
const SHELL = `shell-${VERSION}`, STATIC = `static-${VERSION}`;
const BASE = new URL(self.registration.scope).pathname; // e.g. /slop/

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll([BASE, `${BASE}manifest.webmanifest`, `${BASE}icon-192.png`])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== STATIC).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (url.pathname.startsWith(`${BASE}assets/`)) e.respondWith(cacheFirst(req));
  else if (req.mode === 'navigate') e.respondWith(networkFirst(req, SHELL, true));
  else if (/\.(png|svg|webmanifest)$/.test(url.pathname)) e.respondWith(networkFirst(req, STATIC, false));
});

async function cacheFirst(req) {
  const c = await caches.open(STATIC), hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && !res.redirected) { c.put(req, res.clone()); trim(c, 80); }
  return res;
}

async function networkFirst(req, name, isPage) {
  const c = await caches.open(name);
  try {
    const res = await fetch(req);
    if (res.ok && !res.redirected && res.type === 'basic') { c.put(req, res.clone()); trim(c, 150); }
    return res;
  } catch {
    return (await c.match(req)) || (isPage && (await c.match(BASE))) || Response.error();
  }
}

// keep caches small: drop the oldest entries beyond `max`
async function trim(c, max) {
  const keys = await c.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - max))) await c.delete(k);
}
