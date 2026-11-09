// After `vite build`: give every post and community a real page.
//
// /p/<id>/ and /c/<slug>/ are copies of the built app (dist/index.html) with
// that page's own title, description, language, canonical URL and a generated
// preview image (scripts/og-card.mjs), plus the content written into the page,
// so search engines and link previews (KakaoTalk, X, Threads, Slack…) see it
// without running JS. The app then starts on that page and shows the post.
// No redirect: the address stays /p/<id>/, which is also the canonical URL.
//
// Also writes the weekly best page, rss.xml, sitemap.xml, robots.txt, a static
// list of recent posts on the home page (links for crawlers) and a 404.html that
// sends /p/<id>/ links for brand-new posts (not built yet) into the app.
// Reads only public data with the publishable key. Skipped in demo builds.
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { toEnglish } from '../src/i18n.js';
import { createCardRenderer, postCardSvg, communityCardSvg, isKorean } from './og-card.mjs';
import { LEGAL, EFFECTIVE } from '../src/legal-content.js';

const URL_ = process.env.VITE_SUPABASE_URL, KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE = (process.env.SITE_URL || 'https://jungtaejoon.github.io/slop').replace(/\/?$/, '/');
const OUT = 'dist';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clip = (s, n) => { const t = String(s || '').replace(/[#*`>\[\]]/g, '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const OG = `${SITE}og.png`;

if (!existsSync(`${OUT}/index.html`)) { console.error('run vite build first'); process.exit(1); }

writeFileSync(`${OUT}/404.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Slop</title><script>
var p=location.pathname,m=p.match(/^(.*?\\/)(p|c|u)\\/([^/]+)\\/?$/);
location.replace(m?m[1]+'#/'+m[2]+'/'+m[3]:p.split('/').slice(0,2).join('/')+'/');
</script></head><body><a href="./">Go to Slop</a></body></html>`);

if (!URL_ || !KEY) { console.log('demo build: share pages skipped (no Supabase settings)'); process.exit(0); }

async function get(path) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

// ---------------------------------------------------------------- page template (the built app)
const TEMPLATE = readFileSync(`${OUT}/index.html`, 'utf8');
const META_RE = /<!-- page-meta -->[\s\S]*?<!-- \/page-meta -->/;
if (!META_RE.test(TEMPLATE)) throw new Error('index.html lost its <!-- page-meta --> markers');

function appPage({ lang, title, desc, image, url, type = 'article', ld, content, imageAlt }) {
  const meta = `<!-- page-meta -->
  <title>${esc(title)} · Slop</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${esc(url)}">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="Slop">
  <meta property="og:locale" content="${lang === 'ko' ? 'ko_KR' : 'en_US'}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:image" content="${esc(image)}">${image !== OG ? `
  <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(imageAlt || title)}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${esc(image)}">${ld ? `
  <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : ''}
  <!-- /page-meta -->`;
  return TEMPLATE
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    // relative asset and image paths must resolve from the site root, not from /p/<id>/
    .replace('<meta charset="utf-8">', `<meta charset="utf-8">\n  <base href="${SITE}">`)
    .replace(META_RE, meta)
    .replace('<main class="wrap" id="app"></main>', `<main class="wrap" id="app">${content}</main>`);
}

// plain-text rendering of a post body for the static copy (the app renders the real thing)
const paras = (s) => String(s || '').replace(/\r/g, '').split(/\n{2,}/).map((x) => x.trim()).filter(Boolean)
  .map((x) => `<p>${esc(x.replace(/[*`#>]/g, '')).replace(/\n/g, '<br>')}</p>`).join('');

// ---------------------------------------------------------------- data
const [posts, bodies, comms] = await Promise.all([
  get('post_feed?select=id,title,excerpt,images,kind,tool,community_slug,community_name,up_count,down_count,comment_count,created_at,updated_at,author_name,author_username,is_example&hidden=eq.false&order=created_at.desc&limit=2000'),
  get('posts?select=id,body,prompt,tags&hidden=eq.false&order=created_at.desc&limit=2000'),
  get('communities?select=slug,name,description,member_count,post_count,created_at&order=member_count.desc&limit=1000'),
]);
const bodyOf = new Map(bodies.map((b) => [b.id, b]));

// preview images; any failure (fonts, renderer) falls back to the site image
let render = null;
try { render = await createCardRenderer(); mkdirSync(`${OUT}/og/p`, { recursive: true }); mkdirSync(`${OUT}/og/c`, { recursive: true }); }
catch (e) { console.warn('preview images skipped:', e.message); }
const card = (file, svg) => { if (!render) return OG; try { writeFileSync(`${OUT}/${file}`, render(svg)); return SITE + file; } catch (e) { console.warn(file, e.message); return OG; } };

const KIND = { en: { text: 'Text', link: 'Link', image: 'Image', html: 'App', code: 'Code' }, ko: { text: '글', link: '링크', image: '이미지', html: '실행물', code: '코드' } };
const commName = (name, lang) => (lang === 'ko' ? name : toEnglish(name));

// ---------------------------------------------------------------- posts
let cards = 0;
for (const p of posts) {
  const lang = isKorean(p.title) ? 'ko' : 'en', b = bodyOf.get(p.id) || {};
  const cname = commName(p.community_name, lang), url = `${SITE}p/${p.id}/`;
  const meta = lang === 'ko'
    ? [`c/${p.community_slug}`, p.tool && `${p.tool}로 만듦`, `보석 ${p.up_count} · 슬롭 ${p.down_count} · 의견 ${p.comment_count}`]
    : [`c/${p.community_slug}`, p.tool && `made with ${p.tool}`, `▲ ${p.up_count} gem · ▼ ${p.down_count} slop · ${p.comment_count} comments`];
  const metaLine = meta.filter(Boolean).join(' · ');
  const desc = clip(`${p.excerpt ? clip(p.excerpt, 110) + ' — ' : ''}${metaLine}`, 180);
  const image = card(`og/p/${p.id}.png`, postCardSvg(p, `c/${p.community_slug} · ${cname}`)); if (image !== OG) cards++;
  const author = p.is_example ? 'Slop' : (p.author_name || p.author_username || '');
  const content = `<article class="article prerender"><div class="content">
<div class="pmeta"><a class="cat" href="${SITE}c/${esc(p.community_slug)}/">${esc(cname)}</a><span class="pill">${esc(KIND[lang][p.kind] || '')}</span>${p.tool ? `<span class="pill tool">${esc(p.tool)}</span>` : ''}${author ? `<span>${esc(author)}</span>` : ''}</div>
<h1 lang="${lang}">${esc(p.title)}</h1>
<div class="md" lang="${lang}">${paras(b.body || p.excerpt)}</div>
${b.prompt ? `<details class="prompt"><summary>${lang === 'ko' ? '사용한 프롬프트' : 'Prompt used'}</summary><pre>${esc(b.prompt)}</pre></details>` : ''}
${b.tags?.length ? `<p class="muted">${b.tags.map((t) => '#' + esc(t)).join(' ')}</p>` : ''}
<p class="muted">${esc(metaLine)}</p></div></article>`;
  mkdirSync(`${OUT}/p/${p.id}`, { recursive: true });
  writeFileSync(`${OUT}/p/${p.id}/index.html`, appPage({ lang, title: p.title, desc, image, url, content,
    ld: { '@context': 'https://schema.org', '@type': 'DiscussionForumPosting', headline: p.title, text: clip(b.body || p.excerpt, 800), inLanguage: lang, url, datePublished: p.created_at, dateModified: p.updated_at,
      image, articleSection: cname,
      author: { '@type': p.is_example || !p.author_username ? 'Organization' : 'Person', name: p.is_example ? 'Slop' : (p.author_name || p.author_username || 'Slop'), ...(p.author_username ? { url: `${SITE}#/u/${p.author_username}` } : {}) },
      interactionStatistic: [{ '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: p.comment_count },
        { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: p.up_count }] } }));
}

// ---------------------------------------------------------------- communities
for (const c of comms) {
  // default communities are stored in Korean; their pages are in English with the Korean kept in the description
  const en = toEnglish(c.name) !== c.name, lang = en || !isKorean(c.name) ? 'en' : 'ko';
  const name = lang === 'en' ? toEnglish(c.name) : c.name, description = lang === 'en' ? toEnglish(c.description) : c.description;
  const desc = clip(`${description || 'A Slop community for AI-made work'} · ${c.member_count} followers · ${c.post_count} posts`, 180);
  const image = card(`og/c/${c.slug}.png`, communityCardSvg(c, name, description));
  const recent = posts.filter((p) => p.community_slug === c.slug).slice(0, 30);
  const content = `<div class="fhead"><div><h1>${esc(name)}</h1><p class="mono">c/${esc(c.slug)}</p>${description ? `<p>${esc(description)}</p>` : ''}</div></div>
<div class="list">${recent.map((p) => `<article class="post prerender"><div style="min-width:0"><a class="ptitle" href="${SITE}p/${p.id}/">${esc(p.title)}</a>${p.excerpt ? `<p class="excerpt">${esc(clip(p.excerpt, 160))}</p>` : ''}</div></article>`).join('')}</div>`;
  mkdirSync(`${OUT}/c/${c.slug}`, { recursive: true });
  writeFileSync(`${OUT}/c/${c.slug}/index.html`, appPage({ lang, title: `${name} (c/${c.slug})`, desc, image, url: `${SITE}c/${c.slug}/`, type: 'website', content }));
}

// ---------------------------------------------------------------- terms and privacy (English copy; the app shows the visitor's language)
for (const doc of ['terms', 'privacy']) {
  const d = LEGAL[doc].en;
  mkdirSync(`${OUT}/${doc}`, { recursive: true });
  writeFileSync(`${OUT}/${doc}/index.html`, appPage({ lang: 'en', title: d.title, desc: `${d.title} of Slop, effective ${EFFECTIVE.en}.`, image: OG, url: `${SITE}${doc}/`, type: 'website',
    content: `<article class="legal" data-ugc lang="en"><h1>${d.title}</h1><p class="muted">Effective: ${EFFECTIVE.en}</p>${d.body}</article>` }));
}

// ---------------------------------------------------------------- home: recent posts as plain links (crawlers find every post page)
const home = TEMPLATE.replace('<main class="wrap" id="app"></main>', `<main class="wrap" id="app"><h1>Slop</h1><p>Find the gems in AI-made stuff. Try them, vote ▲ gem or ▼ slop, and say why.</p>
<div class="list">${posts.slice(0, 40).map((p) => `<article class="post prerender"><div style="min-width:0"><a class="ptitle" href="${SITE}p/${p.id}/">${esc(p.title)}</a></div></article>`).join('')}</div></main>`)
  .replace('<!-- page-meta -->', `<!-- page-meta -->\n  <link rel="canonical" href="${SITE}">`);
writeFileSync(`${OUT}/index.html`, home);

// ---------------------------------------------------------------- weekly best: a plain landing page that is easy to share every week
function page({ title, desc, image, url, body }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Slop</title>
<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Slop"><meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}"><meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(image)}">
<link rel="alternate" type="application/rss+xml" title="Slop: new posts" href="${SITE}rss.xml">
<style>body{font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.6;color:#1a1c19}a{color:#0b7f73}</style>
</head><body>${body}</body></html>`;
}
const WEEK = 7 * 864e5, now = Date.now();
const rank = (list) => list.slice().sort((a, b) => (b.up_count - b.down_count) - (a.up_count - a.down_count) || (b.up_count + b.down_count) - (a.up_count + a.down_count) || Date.parse(b.created_at) - Date.parse(a.created_at));
let best = rank(posts.filter((p) => now - Date.parse(p.created_at) < WEEK && p.up_count > 0)).slice(0, 10), bestLabel = 'this week';
if (best.length < 3) { best = rank(posts.filter((p) => p.up_count > 0)).slice(0, 10); bestLabel = 'all time'; }
if (best.length < 3) { best = posts.slice(0, 10); bestLabel = 'recent'; }
const bestTitle = bestLabel === 'recent' ? 'Latest AI-made posts' : `Top ${best.length} gems ${bestLabel}`;
mkdirSync(`${OUT}/best`, { recursive: true });
writeFileSync(`${OUT}/best/index.html`, page({ title: bestTitle, desc: clip(`The best AI-made work ${bestLabel}, as judged by Slop: ${best.slice(0, 3).map((p) => p.title).join(' · ')}`, 180),
  image: OG, url: `${SITE}best/`,
  body: `<p><a href="${SITE}">SLOP.</a> · Find the gems in AI-made stuff</p><h1>${esc(bestTitle)}</h1>
<p>People tried these and voted ▲ gem / ▼ slop. Updated every 3 hours.</p>
<ol style="padding-left:22px">${best.map((p) => `<li style="margin:0 0 14px"><a href="${SITE}p/${p.id}/" style="font-weight:700;font-size:17px">${esc(p.title)}</a><br><span style="color:#5d645b;font-size:14px">${esc(commName(p.community_name, isKorean(p.title) ? 'ko' : 'en'))} · ▲ ${p.up_count} · ▼ ${p.down_count} · ${p.comment_count} comments${p.tool ? ' · ' + esc(p.tool) : ''}</span>${p.excerpt ? `<br><span style="font-size:14px">${esc(clip(p.excerpt, 120))}</span>` : ''}</li>`).join('')}</ol>
<p><a href="${SITE}#/judge">Judge some yourself →</a></p>` }));

// ---------------------------------------------------------------- RSS, sitemap, robots
const rssDate = (d) => new Date(d).toUTCString();
writeFileSync(`${OUT}/rss.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>Slop: new posts</title><link>${SITE}</link><description>Find the gems in AI-made stuff</description>
<atom:link href="${SITE}rss.xml" rel="self" type="application/rss+xml"/>
${posts.slice(0, 50).map((p) => `<item><title>${esc(p.title)}</title><link>${SITE}p/${p.id}/</link><guid isPermaLink="true">${SITE}p/${p.id}/</guid><category>${esc(p.community_name)}</category><pubDate>${rssDate(p.created_at)}</pubDate><description>${esc(clip(p.excerpt, 300))}</description></item>`).join('\n')}
</channel></rss>`);

const day = (d) => new Date(d).toISOString().slice(0, 10);
writeFileSync(`${OUT}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${SITE}</loc><changefreq>hourly</changefreq></url>
<url><loc>${SITE}best/</loc><changefreq>daily</changefreq></url>
<url><loc>${SITE}terms/</loc></url>
<url><loc>${SITE}privacy/</loc></url>
${comms.map((c) => `<url><loc>${SITE}c/${c.slug}/</loc><lastmod>${day(c.created_at)}</lastmod></url>`).join('\n')}
${posts.map((p) => `<url><loc>${SITE}p/${p.id}/</loc><lastmod>${day(p.updated_at)}</lastmod></url>`).join('\n')}
</urlset>`);
writeFileSync(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
console.log(`share pages: ${posts.length} posts (${cards} preview images), ${comms.length} communities, best (${best.length}), home links, rss.xml, sitemap.xml`);
