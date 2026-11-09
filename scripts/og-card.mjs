// Link-preview images (1200×630 PNG) for posts and communities, drawn as SVG and
// rasterised with resvg. Fonts (Pretendard, covers Latin and Hangul) are fetched
// once from jsDelivr into node_modules/.cache. If anything here fails, the share
// pages fall back to the site-wide og.png, so a font hiccup never breaks a deploy.
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const FONT_DIR = 'node_modules/.cache/og-fonts';
const FONT_URL = (w) => `https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/Pretendard-${w}.otf`;
const W = 1200, H = 630, PAD = 64, MAXW = W - PAD * 2;

async function fontFile(weight) {
  mkdirSync(FONT_DIR, { recursive: true });
  const f = `${FONT_DIR}/Pretendard-${weight}.otf`;
  if (existsSync(f) && readFileSync(f).length > 100000) return f;
  const r = await fetch(FONT_URL(weight));
  if (!r.ok) throw new Error(`font ${weight}: ${r.status}`);
  writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  return f;
}

export async function createCardRenderer() {
  const { Resvg } = await import('@resvg/resvg-js');
  const fontFiles = await Promise.all(['Bold', 'SemiBold', 'Regular'].map(fontFile));
  return (svg) => new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Pretendard' } }).render().asPng();
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const isKorean = (s) => /[가-힣]/.test(s || '');

// rough Pretendard advance widths (in em) — good enough to wrap titles
function charW(ch) {
  const c = ch.codePointAt(0);
  if (c >= 0xac00 && c <= 0xd7a3) return 0.92;        // Hangul syllables
  if (c >= 0x3000 && c <= 0x9fff) return 0.95;        // CJK, punctuation
  if (ch === ' ') return 0.27;
  if (/[.,:;'"!|`]/.test(ch)) return 0.3;
  if (/[il]/.test(ch)) return 0.27;
  if (/[mwMW]/.test(ch)) return 0.86;
  if (/[A-Z]/.test(ch)) return 0.68;
  if (/[a-z]/.test(ch)) return 0.56;
  if (/[0-9]/.test(ch)) return 0.6;
  if (/[()[\]{}\-/]/.test(ch)) return 0.38;
  return 0.75;
}
export const textW = (s, size, bold = true) => [...String(s)].reduce((w, ch) => w + charW(ch), 0) * size * (bold ? 1.04 : 1);

// greedy word wrap; long words break by character; the last allowed line gets an ellipsis
export function wrap(text, size, maxW, maxLines) {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const lines = []; let cur = '';
  const push = (l) => lines.push(l);
  for (const word of words) {
    const tryL = cur ? cur + ' ' + word : word;
    if (textW(tryL, size) <= maxW) { cur = tryL; continue; }
    if (cur) push(cur);
    if (textW(word, size) <= maxW) { cur = word; continue; }
    let piece = '';
    for (const ch of word) { if (textW(piece + ch, size) > maxW) { push(piece); piece = ch; } else piece += ch; }
    cur = piece;
  }
  if (cur) push(cur);
  if (lines.length <= maxLines) return lines;
  const out = lines.slice(0, maxLines);
  let last = out[maxLines - 1];
  while (last && textW(last + '…', size) > maxW) last = last.slice(0, -1).trimEnd();
  out[maxLines - 1] = last + '…';
  return out;
}

const DEFS = `<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14B8A6"/><stop offset=".6" stop-color="#3B82C4"/><stop offset="1" stop-color="#6D5BD0"/></linearGradient>
  <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#14B8A6"/><stop offset=".6" stop-color="#3B82C4"/><stop offset="1" stop-color="#6D5BD0"/></linearGradient>
  <radialGradient id="glow" cx=".88" cy=".05" r=".75"><stop offset="0" stop-color="#3B82C4" stop-opacity=".32"/><stop offset=".55" stop-color="#6D5BD0" stop-opacity=".08"/><stop offset="1" stop-color="#6D5BD0" stop-opacity="0"/></radialGradient>
</defs>`;

function frame(inner, pill) {
  const pillW = pill ? Math.ceil(textW(pill, 24, false)) + 40 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS}
<rect width="${W}" height="${H}" fill="#0E1110"/><rect width="${W}" height="${H}" fill="url(#glow)"/>
<g transform="translate(${PAD},52)"><rect width="56" height="56" rx="14" fill="url(#g)"/><path d="M28 10.5 42 24.5 28 45.5 14 24.5Z" fill="#fff"/><path d="M28 10.5 35 24.5 28 45.5 21 24.5Z" fill="#000" fill-opacity=".14"/></g>
<text x="${PAD + 74}" y="92" font-family="Pretendard" font-weight="700" font-size="34" fill="#F4F6F3">Slop<tspan fill="#14B8A6">.</tspan></text>
${pill ? `<g transform="translate(${W - PAD - pillW},56)"><rect width="${pillW}" height="48" rx="24" fill="#1B201E" stroke="#2C3330"/><text x="${pillW / 2}" y="32" text-anchor="middle" font-family="Pretendard" font-weight="600" font-size="24" fill="#C9D1C7">${esc(pill)}</text></g>` : ''}
${inner}
<rect y="${H - 12}" width="${W}" height="12" fill="url(#bar)"/>
</svg>`;
}

const KIND = { en: { text: 'TEXT', link: 'LINK', image: 'IMAGE', html: 'APP · RUNS IN THE BROWSER', code: 'CODE' }, ko: { text: '글', link: '링크', image: '이미지', html: '실행물 · 브라우저에서 바로 실행', code: '코드' } };

// a post card: kind line, title (up to 3 lines), verdict counts and a call to action
export function postCardSvg(p, communityLabel) {
  const L = isKorean(p.title) ? 'ko' : 'en';
  let size = 64, lines = wrap(p.title, size, MAXW, 3);
  if (lines.length === 3 && lines[2].endsWith('…')) { size = 54; lines = wrap(p.title, size, MAXW, 4); }
  const lh = Math.round(size * 1.22), top = 210;
  const kind = [KIND[L][p.kind] || KIND[L].text, p.tool ? (L === 'ko' ? `${p.tool}로 만듦` : `made with ${p.tool}`) : ''].filter(Boolean).join(' · ');
  const title = lines.map((l, i) => `<text x="${PAD}" y="${top + 26 + (i + 1) * lh - Math.round(lh * 0.22)}" font-family="Pretendard" font-weight="700" font-size="${size}" fill="#F4F6F3">${esc(l)}</text>`).join('');
  const gem = L === 'ko' ? `보석 ${p.up_count}` : `${p.up_count} gem`, slop = L === 'ko' ? `슬롭 ${p.down_count}` : `${p.down_count} slop`;
  const com = L === 'ko' ? `의견 ${p.comment_count}` : `${p.comment_count} comment${p.comment_count === 1 ? '' : 's'}`;
  const gx = PAD, sx = gx + 40 + textW(gem, 30) + 44, cx = sx + 40 + textW(slop, 30) + 44;
  const cta = L === 'ko' ? '보석일까, 슬롭일까? 판정해 주세요' : 'Gem or slop? You judge.';
  return frame(`<text x="${PAD}" y="${top}" font-family="Pretendard" font-weight="600" font-size="26" letter-spacing="1" fill="#14B8A6">${esc(kind)}</text>
${title}
<g font-family="Pretendard" font-weight="700" font-size="30">
  <path d="M${gx} 566 l14 -24 l14 24 Z" fill="#14B8A6"/><text x="${gx + 40}" y="566" fill="#F4F6F3">${esc(gem)}</text>
  <path d="M${sx} 542 l14 24 l14 -24 Z" fill="#F08A4B"/><text x="${sx + 40}" y="566" fill="#F4F6F3">${esc(slop)}</text>
  <path d="M${cx} 543 h28 v18 h-17 l-7 7 v-7 h-4 Z" fill="none" stroke="#A9B0A7" stroke-width="3" stroke-linejoin="round"/><text x="${cx + 40}" y="566" fill="#A9B0A7" font-weight="600">${esc(com)}</text>
</g>
<text x="${W - PAD}" y="566" text-anchor="end" font-family="Pretendard" font-weight="600" font-size="28" fill="#C9D1C7">${esc(cta)}</text>`, communityLabel);
}

// a community card: name, description, follower/post counts
export function communityCardSvg(c, name, description) {
  const L = isKorean(name) || isKorean(description) ? 'ko' : 'en';
  const nameLines = wrap(name, 72, MAXW, 2), desc = wrap(description || '', 34, MAXW, 3);
  const nameY = 250;
  const nameSvg = nameLines.map((l, i) => `<text x="${PAD}" y="${nameY + i * 86}" font-family="Pretendard" font-weight="700" font-size="72" fill="#F4F6F3">${esc(l)}</text>`).join('');
  const dTop = nameY + (nameLines.length - 1) * 86 + 64;
  const descSvg = desc.map((l, i) => `<text x="${PAD}" y="${dTop + i * 46}" font-family="Pretendard" font-weight="400" font-size="34" fill="#C9D1C7">${esc(l)}</text>`).join('');
  const counts = L === 'ko' ? `팔로워 ${c.member_count} · 글 ${c.post_count}` : `${c.member_count} followers · ${c.post_count} posts`;
  const cta = L === 'ko' ? 'Slop에서 팔로우하세요' : 'Follow it on Slop';
  return frame(`<text x="${PAD}" y="172" font-family="Pretendard" font-weight="600" font-size="26" letter-spacing="1" fill="#14B8A6">${L === 'ko' ? '커뮤니티' : 'COMMUNITY'} · c/${esc(c.slug)}</text>
${nameSvg}${descSvg}
<text x="${PAD}" y="566" font-family="Pretendard" font-weight="700" font-size="30" fill="#F4F6F3">${esc(counts)}</text>
<text x="${W - PAD}" y="566" text-anchor="end" font-family="Pretendard" font-weight="600" font-size="28" fill="#C9D1C7">${esc(cta)}</text>`, null);
}
