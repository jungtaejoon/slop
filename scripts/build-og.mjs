// One-off: draws the site-wide link-preview images public/og.png (English) and
// public/og-ko.png (Korean). Run: node scripts/build-og.mjs
import { writeFileSync } from 'node:fs';
import { createCardRenderer } from './og-card.mjs';

const T = {
  en: { sub: 'Find the gems in AI-made stuff', line: 'Post AI-made apps, art, writing and code. Try them. Judge them. Say why.', gem: 'Gem', slop: 'Slop' },
  ko: { sub: 'AI가 만든 것들 속에서 보석을 캐는 곳', line: 'AI로 만든 앱, 그림, 글, 코드를 올리고 써 보고 판정해요.', gem: '보석', slop: '슬롭' },
};
const svg = (t) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#121412"/>
<circle cx="1010" cy="165" r="210" fill="#14302C"/>
<path d="M1010 40 1110 140 1010 290 910 140Z" fill="#3CC1B1"/><path d="M1010 40 1060 140 1010 290 960 140Z" fill="#7AD6CB"/>
<text x="80" y="212" font-family="Pretendard" font-weight="800" font-size="104" fill="#F1F2EC">SLOP<tspan fill="#2DD4BF">.</tspan></text>
<text x="80" y="300" font-family="Pretendard" font-weight="700" font-size="50" fill="#F1F2EC">${t.sub}</text>
<text x="80" y="368" font-family="Pretendard" font-weight="400" font-size="28" fill="#9AA297">${t.line}</text>
<g font-family="Pretendard" font-weight="700" font-size="36">
  <rect x="80" y="450" width="250" height="84" rx="42" fill="#14302C" stroke="#2DD4BF" stroke-width="3"/>
  <path d="M142 506 l14 -24 l14 24 Z" fill="#2DD4BF"/><text x="184" y="505" fill="#2DD4BF">${t.gem}</text>
  <rect x="356" y="450" width="250" height="84" rx="42" fill="#3A2618" stroke="#F0A160" stroke-width="3"/>
  <path d="M418 482 l14 24 l14 -24 Z" fill="#F0A160"/><text x="460" y="505" fill="#F0A160">${t.slop}</text>
</g></svg>`;
const render = await createCardRenderer();
writeFileSync('public/og.png', render(svg(T.en)));
writeFileSync('public/og-ko.png', render(svg(T.ko)));
console.log('wrote public/og.png, public/og-ko.png');
