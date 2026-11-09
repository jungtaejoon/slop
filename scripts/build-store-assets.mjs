// One-off: Google Play listing images into android-release/ (feature graphic 1024x500, 512px icon).
// Run: node scripts/build-store-assets.mjs
import { writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { createCardRenderer } from './og-card.mjs';
mkdirSync('android-release', { recursive: true });
const render = await createCardRenderer();
const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="586" viewBox="0 0 1024 500">
<rect width="1024" height="500" fill="#121412"/><circle cx="850" cy="150" r="190" fill="#14302C"/>
<path d="M850 40 940 130 850 265 760 130Z" fill="#3CC1B1"/><path d="M850 40 895 130 850 265 805 130Z" fill="#7AD6CB"/>
<text x="64" y="190" font-family="Pretendard" font-weight="700" font-size="96" fill="#F1F2EC">SLOP<tspan fill="#2DD4BF">.</tspan></text>
<text x="64" y="268" font-family="Pretendard" font-weight="700" font-size="44" fill="#F1F2EC">Find the gems in AI-made stuff</text>
<text x="64" y="320" font-family="Pretendard" font-weight="400" font-size="26" fill="#9AA297">Swipe, play and judge AI-made apps, art and writing.</text>
<g font-family="Pretendard" font-weight="700" font-size="30">
<rect x="64" y="372" width="200" height="70" rx="35" fill="#14302C" stroke="#2DD4BF" stroke-width="3"/><path d="M110 418 l12 -20 l12 20 Z" fill="#2DD4BF"/><text x="146" y="418" fill="#2DD4BF">Gem</text>
<rect x="284" y="372" width="200" height="70" rx="35" fill="#3A2618" stroke="#F0A160" stroke-width="3"/><path d="M330 398 l12 20 l12 -20 Z" fill="#F0A160"/><text x="366" y="418" fill="#F0A160">Slop</text></g></svg>`;
// render() always outputs 1200px wide; resize to 1024x500 with: sips -z 500 1024 android-release/feature-graphic-1024x500.png
writeFileSync('android-release/feature-graphic-1024x500.png', render(feature.replace('width="1200" height="586"', 'width="1024" height="500"')));
copyFileSync('android/store_icon.png', 'android-release/icon-512.png');
console.log('done');
