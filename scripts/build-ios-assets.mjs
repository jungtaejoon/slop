// Draws the iOS app icon (1024×1024, no transparency, as the App Store requires) and the
// launch screen (dark, gem in the middle) into ios/App/App/Assets.xcassets.
// Run after changing the logo: node scripts/build-ios-assets.mjs
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { Resvg } from '@resvg/resvg-js';

const GRAD = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14B8A6"/><stop offset=".6" stop-color="#3B82C4"/><stop offset="1" stop-color="#6D5BD0"/></linearGradient></defs>`;
const GEM = `<path d="M32 12 48 28 32 52 16 28Z" fill="#fff"/><path d="M32 12 40 28 32 52 24 28Z" fill="#000" fill-opacity=".14"/><path d="M16 28h32" stroke="#000" stroke-opacity=".12" stroke-width="1.5"/>`;
const png = (svg, size) => new Resvg(svg, { fitTo: { mode: 'width', value: size }, background: '#0C0E11' }).render().asPng();
const dir = 'ios/App/App/Assets.xcassets';

// iOS rounds the corners itself, so the icon is a full square
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${GRAD}<rect width="64" height="64" fill="url(#g)"/><g transform="translate(32 32) scale(.7) translate(-32 -32)">${GEM}</g></svg>`;
const iconFile = `${dir}/AppIcon.appiconset/AppIcon-512@2x.png`, tmp = `${tmpdir()}/slop-icon.jpg`;
writeFileSync(iconFile, png(icon, 1024));
// resvg always writes an alpha channel; a JPEG round trip (macOS sips) drops it
execSync(`sips -s format jpeg -s formatOptions 100 "${iconFile}" --out "${tmp}" && sips -s format png "${tmp}" --out "${iconFile}"`, { stdio: 'ignore' });

// launch screen: the app's dark background with a small rounded gem tile
const splash = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732"><rect width="2732" height="2732" fill="#0C0E11"/>
<g transform="translate(1238 1238) scale(4)">${GRAD}<rect width="64" height="64" rx="15" fill="url(#g)"/>${GEM}</g></svg>`;
const sp = png(splash, 2732);
for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) writeFileSync(`${dir}/Splash.imageset/${f}`, sp);
console.log('wrote iOS icon and launch screen');
