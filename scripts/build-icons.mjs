// One-off: draws the app icons in public/ (run: node scripts/build-icons.mjs).
// "maskable" icons fill the whole square and keep the gem inside the central
// safe zone, so Android can crop them to a circle, squircle or rounded square.
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const GRAD = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14B8A6"/><stop offset=".6" stop-color="#3B82C4"/><stop offset="1" stop-color="#6D5BD0"/></linearGradient></defs>`;
// the gem from the site logo, drawn in a 64-unit box
const GEM = `<path d="M32 12 48 28 32 52 16 28Z" fill="#fff"/><path d="M32 12 40 28 32 52 24 28Z" fill="#000" fill-opacity=".14"/><path d="M16 28h32" stroke="#000" stroke-opacity=".12" stroke-width="1.5"/>`;

const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${GRAD}<rect width="64" height="64" fill="url(#g)"/><g transform="translate(32 32) scale(.62) translate(-32 -32)">${GEM}</g></svg>`;
const png = (svg, size) => new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();

writeFileSync('public/icon-maskable-192.png', png(maskable, 192));
writeFileSync('public/icon-maskable-512.png', png(maskable, 512));
console.log('wrote public/icon-maskable-192.png, public/icon-maskable-512.png');
