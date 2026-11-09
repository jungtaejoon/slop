// Draws batch-1 art into public/examples/ and writes insert.sql for the live DB.
// Usage (from repo root): node content/batch1/build.mjs <author uuid>
import { readFileSync, writeFileSync } from 'node:fs';
import { POSTS, NEW_COMMUNITIES } from './posts.mjs';

const AUTHOR = process.argv[2];
if (!/^[0-9a-f-]{36}$/.test(AUTHOR || '')) throw new Error('author uuid required');
const dir = 'content/batch1/';
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const f = (n) => Math.round(n * 10) / 10;

// 1) moiré: two sets of concentric circles, centres slightly apart
(() => {
  const W = 900, H = 900; let s = `<rect width="${W}" height="${H}" fill="#f5f1e8"/>`;
  for (const [cx, cy, col] of [[430, 450, '#1f2a44'], [470, 440, '#b4432e']])
    for (let r = 8; r < 640; r += 14) s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="5" stroke-opacity=".8"/>`;
  writeFileSync('public/examples/art-moire.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s}</svg>`);
})();
// 2) colour-field blocks: recursive splits, a few cells in primaries
(() => {
  const r = rng(2026), W = 900, H = 900, cells = [];
  (function split(x, y, w, h, d) {
    if (d > 5 || (d > 2 && r() < 0.22) || w < 90 || h < 90) { cells.push([x, y, w, h]); return; }
    if ((w > h && r() < 0.8) || r() < 0.4) { const k = w * (0.3 + r() * 0.4); split(x, y, k, h, d + 1); split(x + k, y, w - k, h, d + 1); }
    else { const k = h * (0.3 + r() * 0.4); split(x, y, w, k, d + 1); split(x, y + k, w, h - k, d + 1); }
  })(0, 0, W, H, 0);
  const pal = ['#d62828', '#f7c600', '#1d4ed8', '#111'];
  let s = `<rect width="${W}" height="${H}" fill="#111"/>`;
  // colour about one cell in five, cycling the palette, so every run has some colour
  cells.forEach(([x, y, w, h], i) => { s += `<rect x="${f(x + 6)}" y="${f(y + 6)}" width="${f(w - 12)}" height="${f(h - 12)}" fill="${i % 5 === 2 ? pal[Math.floor(i / 5) % pal.length] : '#f4f1ea'}"/>`; });
  writeFileSync('public/examples/art-blocks.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s}</svg>`);
})();

const q = (s) => { if (String(s).includes('$b1$')) throw new Error('quote clash'); return `$b1$${s}$b1$`; };
const arr = (a) => `array[${a.map(q).join(',')}]::text[]`;
let sql = `-- batch 1: two communities and ${POSTS.length} posts by the site owner\nbegin;\n`;
for (const c of NEW_COMMUNITIES) {
  sql += `insert into public.communities (slug, name, description, default_kind, creator_id) values (${q(c.slug)}, ${q(c.name)}, ${q(c.description)}, ${q(c.default_kind)}, '${AUTHOR}') on conflict (slug) do nothing;\n`;
  sql += `insert into public.community_members (community_id, user_id, role) select id, '${AUTHOR}', 'mod' from public.communities where slug = ${q(c.slug)} on conflict (community_id, user_id) do update set role = 'mod';\n`;
}
for (const p of POSTS) {
  const code = p.file ? readFileSync(dir + p.file, 'utf8') : '';
  const head = p.kind === 'code' ? code.split('\n').slice(0, 8).join('\n').slice(0, 600) : '';
  const ts = `now() - interval '${p.hours} hours'`;
  sql += `with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select '${AUTHOR}', id, ${q(p.kind)}, ${q(p.title)}, ${q(p.body || '')}, '', ${arr(p.images || [])}, ${q(code)}, ${q(p.codeLang || '')}, ${q(head)}, ${q(p.tool || '')}, ${q(p.prompt || '')}, ${arr(p.tags || [])}, ${ts}, ${ts}
  from public.communities where slug = ${q(p.community)}
  and not exists (select 1 from public.posts where author_id = '${AUTHOR}' and title = ${q(p.title)})
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;\n`;
}
sql += 'commit;\n';
writeFileSync(dir + 'insert.sql', sql);
console.log(`insert.sql: ${NEW_COMMUNITIES.length} communities, ${POSTS.length} posts (${sql.length} chars); art → public/examples/art-moire.svg, art-blocks.svg`);
