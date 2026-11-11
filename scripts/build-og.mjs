// One-off: draws the site-wide link-preview images public/og.png (English) and
// public/og-ko.png (Korean) in the v3 look. Run: node scripts/build-og.mjs
import { writeFileSync } from 'node:fs';
import { createCardRenderer, OG_DEFS, ogBackdrop, ogLogo } from './og-card.mjs';

const T = {
  en: { eyebrow: 'A VERDICT BOARD FOR AI-MADE STUFF', h1: 'Find the gems in', h2: 'AI-made stuff.', size: 84,
    sub: 'Try AI-made apps, games, art and writing.', sub2: 'Vote gem or slop, and say why.', gem: 'Gem', slop: 'Slop' },
  ko: { eyebrow: 'AI가 만든 것들의 판정소', h1: 'AI가 만든 것,', h2: '그냥 넘기지 마세요.', size: 76,
    sub: 'AI로 만든 앱·게임·그림·글을 직접 써 보고', sub2: '보석인지 슬롭인지 판정해요.', gem: '보석', slop: '슬롭' },
};
// a post card tilted over a second one, with a verdict bar: the same picture as the site intro
const art = `<g transform="translate(838 120) rotate(7)"><rect width="280" height="210" rx="22" fill="#15181D" stroke="#2A2E36" stroke-width="2"/>
  <rect x="20" y="20" width="240" height="96" rx="12" fill="#3A2A1C"/><rect x="20" y="136" width="200" height="12" rx="6" fill="#1F2329"/><rect x="20" y="160" width="130" height="12" rx="6" fill="#1F2329"/></g>
<g transform="translate(760 210) rotate(-4)"><rect width="330" height="280" rx="24" fill="#121418" stroke="#30343C" stroke-width="2"/>
  <rect x="22" y="22" width="22" height="22" rx="7" fill="#2DD4BF"/><rect x="56" y="27" width="120" height="12" rx="6" fill="#1F2329"/>
  <rect x="22" y="62" width="286" height="96" rx="14" fill="#191C21"/>
  <rect x="36" y="76" width="58" height="68" rx="9" fill="#121418"/><rect x="104" y="76" width="58" height="68" rx="9" fill="#239E8F"/><rect x="172" y="76" width="58" height="68" rx="9" fill="#B86A33"/><rect x="240" y="76" width="54" height="68" rx="9" fill="#121418"/>
  <rect x="22" y="176" width="240" height="11" rx="5.5" fill="#1F2329"/><rect x="22" y="198" width="150" height="11" rx="5.5" fill="#1F2329"/>
  <path d="M24 250 l9 -15 l9 15 Z" fill="#2DD4BF"/><text x="48" y="250" font-family="Pretendard" font-weight="700" font-size="20" fill="#5EEAD4">128</text>
  <rect x="96" y="236" width="170" height="10" rx="5" fill="#2B1B10"/><rect x="96" y="236" width="150" height="10" rx="5" fill="#2DD4BF"/>
  <path d="M276 236 l8 13 l8 -13 Z" fill="#FB923C"/><text x="296" y="250" font-family="Pretendard" font-weight="700" font-size="20" fill="#FB923C">14</text></g>
<g transform="translate(1118 528) rotate(8)"><rect x="-38" y="-38" width="76" height="76" rx="22" fill="#F1F2F4"/><path d="M0 -20 14 0 0 22 -14 0Z" fill="#0D9488"/></g>`;
const svg = (t) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">${OG_DEFS}
${ogBackdrop()}${ogLogo(64, 52)}
<text x="140" y="92" font-family="Pretendard" font-weight="700" font-size="34" fill="#F1F2F4">Slop<tspan fill="#2DD4BF">.</tspan></text>
<g transform="translate(64 196)"><path d="M0 -8 8 0 0 8 -8 0Z" fill="#2DD4BF"/></g>
<text x="84" y="205" font-family="Pretendard" font-weight="700" font-size="22" letter-spacing="2" fill="#2DD4BF">${t.eyebrow}</text>
<text x="62" y="${236 + t.size}" font-family="Pretendard" font-weight="700" font-size="${t.size}" letter-spacing="-3" fill="#F1F2F4">${t.h1}</text>
<text x="62" y="${236 + t.size * 2.08}" font-family="Pretendard" font-weight="700" font-size="${t.size}" letter-spacing="-3" fill="#2DD4BF">${t.h2}</text>
<text x="64" y="${236 + t.size * 2.08 + 66}" font-family="Pretendard" font-weight="400" font-size="28" fill="#9AA0AA">${t.sub}</text>
<text x="64" y="${236 + t.size * 2.08 + 106}" font-family="Pretendard" font-weight="400" font-size="28" fill="#9AA0AA">${t.sub2}</text>
<text x="64" y="578" font-family="Pretendard" font-weight="700" font-size="26" fill="#C9CDD3">slop.ai.kr</text>
${art}
</svg>`;
const render = await createCardRenderer();
writeFileSync('public/og.png', render(svg(T.en)));
writeFileSync('public/og-ko.png', render(svg(T.ko)));
console.log('wrote public/og.png, public/og-ko.png');
