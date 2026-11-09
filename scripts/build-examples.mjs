// Builds the example posts into the two places that use them:
//   public/examples/*.svg          the art board's images (seeded random, so stable)
//   src/examples.generated.json    demo mode's starting data
//   supabase/seed.sql              rows for a real Supabase project
// Usage: npm run examples
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { EXAMPLE_POSTS } from '../examples/posts.mjs';

mkdirSync('public/examples', { recursive: true });

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const f = (n) => Math.round(n * 10) / 10;

function rainyWindows() {
  const r = rng(7), W = 800, H = 1000; let s = '';
  s += `<rect width="${W}" height="${H}" fill="#0b1020"/>`;
  for (let i = 0; i < 260; i++) s += `<line x1="${f(r() * W)}" y1="${f(r() * H)}" x2="${f(r() * W - 18)}" y2="${f(r() * H + 60)}" stroke="#8fa3c7" stroke-opacity="${f(r() * 0.25 + 0.05)}" stroke-width="1"/>`;
  const bx = 120, by = 140, cols = 7, rows = 11, cw = 70, ch = 60;
  s += `<rect x="${bx - 30}" y="${by - 40}" width="${cols * cw + 60}" height="${rows * ch + 900}" fill="#151a2e"/>`;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const lit = r() < 0.38, hue = [38, 45, 28, 200][Math.floor(r() * 4)];
    const fill = lit ? `hsl(${hue} ${hue === 200 ? 60 : 90}% ${55 + r() * 15}%)` : '#1f2640';
    s += `<rect x="${bx + x * cw}" y="${by + y * ch}" width="${cw - 18}" height="${ch - 20}" rx="3" fill="${fill}" fill-opacity="${lit ? f(0.7 + r() * 0.3) : 1}"/>`;
    if (lit && r() < 0.3) s += `<rect x="${bx + x * cw + 8 + r() * 20}" y="${by + y * ch + 14}" width="8" height="${ch - 34}" fill="#0b1020" fill-opacity=".5"/>`;
  }
  for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * H, rr = 2 + r() * 7; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rr * 0.7)}" ry="${f(rr)}" fill="#c9d6f2" fill-opacity="${f(0.08 + r() * 0.18)}"/>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s}</svg>`;
}

function contourIsland() {
  const r = rng(42), W = 900, H = 700; const bumps = Array.from({ length: 7 }, () => [W * (0.3 + r() * 0.4), H * (0.3 + r() * 0.4), 80 + r() * 160, 0.5 + r()]);
  const height = (x, y) => bumps.reduce((a, [bx, by, rad, amp]) => a + amp * Math.exp(-((x - bx) ** 2 + (y - by) ** 2) / (2 * rad * rad)), 0);
  const step = 6; let s = `<rect width="${W}" height="${H}" fill="#d9ecf2"/>`;
  const levels = ['#a8d5e2', '#e9dfb8', '#b7d39a', '#8fbf7a', '#6fa269', '#5a8357', '#8b7d6b', '#f4f1ea'];
  for (let y = 0; y < H; y += step) {
    let runStart = 0, runColor = null;
    const flush = (end) => { if (runColor) s += `<rect x="${runStart}" y="${y}" width="${end - runStart}" height="${step}" fill="${runColor}"/>`; };
    for (let x = 0; x <= W; x += step) {
      const li = x < W ? Math.floor((height(x + step / 2, y + step / 2) + (r() - 0.5) * 0.04) * 3.2) : 0;
      const color = li <= 0 ? null : levels[Math.min(li, levels.length - 1)];
      if (color !== runColor) { flush(x); runStart = x; runColor = color; }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="crispEdges">${s}</svg>`;
}

function sunflower() {
  const W = 800, H = 800, cx = W / 2, cy = H / 2, golden = Math.PI * (3 - Math.sqrt(5)); let s = `<rect width="${W}" height="${H}" fill="#1b1f12"/>`;
  for (let i = 0; i < 1400; i++) {
    const rad = 9.4 * Math.sqrt(i), a = i * golden, x = cx + rad * Math.cos(a), y = cy + rad * Math.sin(a);
    if (rad > 360) break; const t = rad / 360;
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(3 + t * 5)}" fill="hsl(${f(28 + t * 22)} ${f(70 + t * 25)}% ${f(22 + t * 38)}%)"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s}</svg>`;
}

writeFileSync('public/examples/art-rainy-windows.svg', rainyWindows());
writeFileSync('public/examples/art-contour-island.svg', contourIsland());
writeFileSync('public/examples/art-sunflower.svg', sunflower());

const uuidFrom = (slug) => { const h = createHash('md5').update('slop-lab:' + slug).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`; };
const posts = EXAMPLE_POSTS.map((p, i) => {
  const code = p.file ? readFileSync('examples/' + p.file, 'utf8') : '';
  return {
    id: uuidFrom(p.slug), cat: p.cat, kind: p.kind, title: p.title, body: p.body || '', url: p.url || '',
    images: p.images || [], code, code_lang: p.codeLang || '', code_head: p.kind === 'code' ? code.split('\n').slice(0, 8).join('\n').slice(0, 600) : '',
    tool: p.tool || '', prompt: p.prompt || '', tags: p.tags || [], hours_ago: 2 + i * 7,
  };
});
writeFileSync('src/examples.generated.json', JSON.stringify(posts, null, 1));

const q = (s) => { if (String(s).includes('$slop$')) throw new Error('content contains $slop$'); return `$slop$${s}$slop$`; };
const arr = (a) => `array[${a.map(q).join(',')}]::text[]`;
let sql = `-- Generated by scripts/build-examples.mjs. Example posts shown with an "예시" badge.\n-- Run after all migrations. Safe to re-run: existing example rows are replaced.\ndelete from public.posts where is_example;\n`;
for (const p of posts) {
  const ts = `now() - interval '${p.hours_ago} hours'`;
  sql += `\ninsert into public.posts (id, author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
values ('${p.id}', null, (select id from public.communities where slug = '${p.cat}'), '${p.kind}', ${q(p.title)}, ${q(p.body)}, ${q(p.url)}, ${arr(p.images)}, ${q(p.code)}, ${q(p.code_lang)}, ${q(p.code_head)}, ${q(p.tool)}, ${q(p.prompt)}, ${arr(p.tags)}, true, ${ts}, ${ts});
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, created_at)
values ('${p.id}', 1, ${q(p.title)}, ${q(p.body)}, ${q(p.url)}, ${arr(p.images)}, ${q(p.code)}, ${q(p.prompt)}, '예시 게시물', ${ts});\n`;
}
writeFileSync('supabase/seed.sql', sql);
console.log(`${posts.length} example posts → src/examples.generated.json, supabase/seed.sql; 3 SVGs → public/examples/`);
