// Tells search engines that use IndexNow (Bing, Naver, Yandex, Seznam…) which pages are new or changed.
// Compares the freshly built dist/sitemap.xml with the one that was live before this deploy,
// so the 3-hourly rebuild only reports what actually changed. Usage: node scripts/indexnow.mjs <old-sitemap.xml>
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const SITE = (process.env.SITE_URL || 'https://slop.ai.kr').replace(/\/?$/, '/');
const host = new URL(SITE).host;
const key = (readdirSync('public').find((f) => /^[0-9a-f]{32}\.txt$/.test(f)) || '').slice(0, 32);
if (!key) { console.log('indexnow: no key file in public/, skipped'); process.exit(0); }

const entries = (xml) => new Map([...xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)].map((m) => [m[1], m[2] || '']));
const now = entries(readFileSync('dist/sitemap.xml', 'utf8'));
const oldPath = process.argv[2];
const before = oldPath && existsSync(oldPath) ? entries(readFileSync(oldPath, 'utf8')) : new Map();
// first run (no old sitemap): send everything once
let urls = [...now].filter(([u, d]) => !before.has(u) || before.get(u) !== d).map(([u]) => u);
if (urls.length && !urls.includes(SITE)) urls.unshift(SITE);
if (!urls.length) { console.log('indexnow: nothing changed'); process.exit(0); }
urls = urls.slice(0, 10000);

const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `${SITE}${key}.txt`, urlList: urls }),
});
console.log(`indexnow: ${urls.length} url(s) → HTTP ${r.status}`);
