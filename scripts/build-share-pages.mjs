// After `vite build`: write one small static page per post and community so a
// shared link shows a real preview (title, excerpt, image) in KakaoTalk, X,
// Threads, Slack, etc. — those scrapers don't run JS, and the app itself uses
// hash routes. Each page redirects people to the app. Also writes sitemap.xml,
// robots.txt and a 404.html that turns /p/<id>/ links for brand-new posts
// (not built yet) into the app route.
//
// Reads only public data with the publishable key. Skipped in demo builds.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

const URL_ = process.env.VITE_SUPABASE_URL, KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE = (process.env.SITE_URL || 'https://jungtaejoon.github.io/slop-lab').replace(/\/?$/, '/');
const OUT = 'dist';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clip = (s, n) => { const t = String(s || '').replace(/[#*`>\[\]]/g, '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const abs = (u) => (!u ? `${SITE}og.png` : /^https?:\/\//.test(u) ? u : SITE + u.replace(/^\.?\//, ''));

if (!existsSync(OUT)) { console.error('run vite build first'); process.exit(1); }

writeFileSync(`${OUT}/404.html`, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>Slop Lab</title><script>
var p=location.pathname,m=p.match(/^(.*?\\/)(p|c|u)\\/([^/]+)\\/?$/);
location.replace(m?m[1]+'#/'+m[2]+'/'+m[3]:p.split('/').slice(0,2).join('/')+'/');
</script></head><body><a href="./">Slop Lab으로 가기</a></body></html>`);

if (!URL_ || !KEY) { console.log('demo build: share pages skipped (no Supabase settings)'); process.exit(0); }

async function get(path) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

function page({ title, desc, image, url, appHash, type = 'article', body }) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Slop Lab</title>
<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="${type}"><meta property="og:site_name" content="Slop Lab"><meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}"><meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(image)}">
<script>location.replace(${JSON.stringify(SITE + '#' + appHash)});</script>
<style>body{font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.6;color:#1a1c19}a{color:#0b7f73}</style>
</head><body>${body}<p><a href="${esc(SITE + '#' + appHash)}">Slop Lab에서 보기 →</a></p></body></html>`;
}

const [posts, comms] = await Promise.all([
  get('post_feed?select=id,title,excerpt,images,kind,tool,community_slug,community_name,up_count,down_count,comment_count,created_at,updated_at&hidden=eq.false&order=created_at.desc&limit=2000'),
  get('communities?select=slug,name,description,member_count,post_count,created_at&order=member_count.desc&limit=1000'),
]);

for (const p of posts) {
  const meta = [`c/${p.community_slug}`, p.tool && `${p.tool}로 만듦`, `보석 ${p.up_count} · 슬롭 ${p.down_count} · 의견 ${p.comment_count}`].filter(Boolean).join(' · ');
  const desc = clip(`${p.excerpt ? clip(p.excerpt, 110) + ' — ' : ''}${meta}`, 180);
  const url = `${SITE}p/${p.id}/`;
  mkdirSync(`${OUT}/p/${p.id}`, { recursive: true });
  writeFileSync(`${OUT}/p/${p.id}/index.html`, page({ title: p.title, desc, image: abs(p.kind === 'image' ? p.images?.[0] : ''), url, appHash: `/p/${p.id}`,
    body: `<p>${esc(p.community_name)} · AI가 만든 결과물</p><h1>${esc(p.title)}</h1><p>${esc(clip(p.excerpt, 300))}</p><p>${esc(meta)}</p>` }));
}
for (const c of comms) {
  const desc = clip(`${c.description || 'AI가 만든 결과물을 모아 판정하는 커뮤니티'} · 팔로워 ${c.member_count} · 글 ${c.post_count}`, 180);
  mkdirSync(`${OUT}/c/${c.slug}`, { recursive: true });
  writeFileSync(`${OUT}/c/${c.slug}/index.html`, page({ title: `${c.name} (c/${c.slug})`, desc, image: `${SITE}og.png`, url: `${SITE}c/${c.slug}/`, appHash: `/c/${c.slug}`, type: 'website',
    body: `<h1>${esc(c.name)}</h1><p>c/${esc(c.slug)}</p><p>${esc(c.description)}</p>` }));
}

const day = (d) => new Date(d).toISOString().slice(0, 10);
writeFileSync(`${OUT}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${SITE}</loc><changefreq>hourly</changefreq></url>
${comms.map((c) => `<url><loc>${SITE}c/${c.slug}/</loc><lastmod>${day(c.created_at)}</lastmod></url>`).join('\n')}
${posts.map((p) => `<url><loc>${SITE}p/${p.id}/</loc><lastmod>${day(p.updated_at)}</lastmod></url>`).join('\n')}
</urlset>`);
writeFileSync(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
console.log(`share pages: ${posts.length} posts, ${comms.length} communities → ${OUT}/p, ${OUT}/c, sitemap.xml`);
