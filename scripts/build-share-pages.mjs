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
</script></head><body><a href="./">Go to Slop Lab</a></body></html>`);

if (!URL_ || !KEY) { console.log('demo build: share pages skipped (no Supabase settings)'); process.exit(0); }

async function get(path) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

function page({ title, desc, image, url, appHash, type = 'article', body, ld, redirect = true }) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Slop Lab</title>
<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="${type}"><meta property="og:site_name" content="Slop Lab"><meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}"><meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(image)}">
${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : ''}
${redirect ? `<script>location.replace(${JSON.stringify(SITE + '#' + appHash)});</script>` : ''}<link rel="alternate" type="application/rss+xml" title="Slop Lab: new posts" href="${SITE}rss.xml">
<style>body{font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.6;color:#1a1c19}a{color:#0b7f73}</style>
</head><body>${body}<p><a href="${esc(SITE + '#' + appHash)}">Open in Slop Lab →</a></p></body></html>`;
}

const [posts, comms] = await Promise.all([
  get('post_feed?select=id,title,excerpt,images,kind,tool,community_slug,community_name,up_count,down_count,comment_count,created_at,updated_at,author_name,author_username,is_example&hidden=eq.false&order=created_at.desc&limit=2000'),
  get('communities?select=slug,name,description,member_count,post_count,created_at&order=member_count.desc&limit=1000'),
]);

for (const p of posts) {
  const meta = [`c/${p.community_slug}`, p.tool && `made with ${p.tool}`, `▲ ${p.up_count} gem · ▼ ${p.down_count} slop · ${p.comment_count} comments`].filter(Boolean).join(' · ');
  const desc = clip(`${p.excerpt ? clip(p.excerpt, 110) + ' — ' : ''}${meta}`, 180);
  const url = `${SITE}p/${p.id}/`;
  mkdirSync(`${OUT}/p/${p.id}`, { recursive: true });
  writeFileSync(`${OUT}/p/${p.id}/index.html`, page({ title: p.title, desc, image: abs(p.kind === 'image' ? p.images?.[0] : ''), url, appHash: `/p/${p.id}`,
    ld: { '@context': 'https://schema.org', '@type': 'DiscussionForumPosting', headline: p.title, text: clip(p.excerpt, 500), url, datePublished: p.created_at, dateModified: p.updated_at,
      image: abs(p.kind === 'image' ? p.images?.[0] : ''), articleSection: p.community_name,
      author: { '@type': p.is_example || !p.author_username ? 'Organization' : 'Person', name: p.is_example ? 'Slop Lab' : (p.author_name || p.author_username || '익명'), ...(p.author_username ? { url: `${SITE}#/u/${p.author_username}` } : {}) },
      interactionStatistic: [{ '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: p.comment_count },
        { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: p.up_count }] },
    body: `<p>${esc(p.community_name)} · AI-made</p><h1>${esc(p.title)}</h1><p>${esc(clip(p.excerpt, 300))}</p><p>${esc(meta)}</p>` }));
}
for (const c of comms) {
  const desc = clip(`${c.description || 'A Slop Lab community for AI-made work'} · ${c.member_count} followers · ${c.post_count} posts`, 180);
  mkdirSync(`${OUT}/c/${c.slug}`, { recursive: true });
  writeFileSync(`${OUT}/c/${c.slug}/index.html`, page({ title: `${c.name} (c/${c.slug})`, desc, image: `${SITE}og.png`, url: `${SITE}c/${c.slug}/`, appHash: `/c/${c.slug}`, type: 'website',
    body: `<h1>${esc(c.name)}</h1><p>c/${esc(c.slug)}</p><p>${esc(c.description)}</p>` }));
}

// weekly best: a real landing page (no redirect) that is easy to share every week
const WEEK = 7 * 864e5, now = Date.now();
const rank = (list) => list.slice().sort((a, b) => (b.up_count - b.down_count) - (a.up_count - a.down_count) || (b.up_count + b.down_count) - (a.up_count + a.down_count) || Date.parse(b.created_at) - Date.parse(a.created_at));
let best = rank(posts.filter((p) => now - Date.parse(p.created_at) < WEEK && p.up_count > 0)).slice(0, 10), bestLabel = 'this week';
if (best.length < 3) { best = rank(posts.filter((p) => p.up_count > 0)).slice(0, 10); bestLabel = 'all time'; }
if (best.length < 3) { best = posts.slice(0, 10); bestLabel = 'recent'; }
const bestTitle = bestLabel === 'recent' ? 'Latest AI-made posts' : `Top ${best.length} gems ${bestLabel}`;
mkdirSync(`${OUT}/best`, { recursive: true });
writeFileSync(`${OUT}/best/index.html`, page({ title: bestTitle, desc: clip(`The best AI-made work ${bestLabel}, as judged by Slop Lab: ${best.slice(0, 3).map((p) => p.title).join(' · ')}`, 180),
  image: abs(best.find((p) => p.kind === 'image')?.images?.[0] || ''), url: `${SITE}best/`, appHash: '/gems', type: 'website', redirect: false,
  body: `<p><a href="${SITE}">SLOP.LAB</a> · Find the gems in AI-made stuff</p><h1>${esc(bestTitle)}</h1>
<p>People tried these and voted ▲ gem / ▼ slop. Updated every 3 hours.</p>
<ol style="padding-left:22px">${best.map((p) => `<li style="margin:0 0 14px"><a href="${SITE}#/p/${p.id}" style="font-weight:700;font-size:17px">${esc(p.title)}</a><br><span style="color:#5d645b;font-size:14px">${esc(p.community_name)} · ▲ ${p.up_count} · ▼ ${p.down_count} · ${p.comment_count} comments${p.tool ? ' · ' + esc(p.tool) : ''}</span>${p.excerpt ? `<br><span style="font-size:14px">${esc(clip(p.excerpt, 120))}</span>` : ''}</li>`).join('')}</ol>
<p><a href="${SITE}#/judge">Judge some yourself →</a></p>` }));

// RSS: newest 50 posts
const rssDate = (d) => new Date(d).toUTCString();
writeFileSync(`${OUT}/rss.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>Slop Lab: new posts</title><link>${SITE}</link><description>Find the gems in AI-made stuff</description>
<atom:link href="${SITE}rss.xml" rel="self" type="application/rss+xml"/>
${posts.slice(0, 50).map((p) => `<item><title>${esc(p.title)}</title><link>${SITE}p/${p.id}/</link><guid isPermaLink="true">${SITE}p/${p.id}/</guid><category>${esc(p.community_name)}</category><pubDate>${rssDate(p.created_at)}</pubDate><description>${esc(clip(p.excerpt, 300))}</description></item>`).join('\n')}
</channel></rss>`);

const day = (d) => new Date(d).toISOString().slice(0, 10);
writeFileSync(`${OUT}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${SITE}</loc><changefreq>hourly</changefreq></url>
<url><loc>${SITE}best/</loc><changefreq>daily</changefreq></url>
${comms.map((c) => `<url><loc>${SITE}c/${c.slug}/</loc><lastmod>${day(c.created_at)}</lastmod></url>`).join('\n')}
${posts.map((p) => `<url><loc>${SITE}p/${p.id}/</loc><lastmod>${day(p.updated_at)}</lastmod></url>`).join('\n')}
</urlset>`);
writeFileSync(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
console.log(`share pages: ${posts.length} posts, ${comms.length} communities, best (${best.length}), rss.xml, sitemap.xml`);
