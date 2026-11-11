// ---------- pixel art: palette strings baked into small canvases (outline + white flash copy) ----------
const PAL = {
  k: '#1a1423', w: '#f4f0e8', g: '#a29db0', G: '#4a4458', r: '#e0524a', R: '#9c2f3d', o: '#f0a03c', y: '#f6d55c',
  n: '#8a5636', N: '#4b2c22', s: '#f2c39b', S: '#c98b6b', b: '#5aa7e0', B: '#2f5a9c', c: '#7fe3d6', C: '#2f8f8a',
  p: '#b07ce8', P: '#6a3fa0', m: '#ff7ab8', l: '#8fd66b', L: '#3f8f4a', h: '#2b2236', e: '#e9e4ff', v: '#ffe9a8',
};
const OUTLINE = '#120e1a';
function bake(rows, swap, outline = true) {
  const h = rows.length, w = Math.max(...rows.map((r) => r.length)), pad = outline ? 1 : 0;
  const mk = () => { const c = document.createElement('canvas'); c.width = w + pad * 2; c.height = h + pad * 2; return c; };
  const out = mk(), fl = mk(), o = out.getContext('2d'), f = fl.getContext('2d');
  const px = (x, y) => { const ch = rows[y][x]; return ch && ch !== '.' && ch !== ' ' ? (swap && swap[ch]) || ch : null; };
  if (outline) {
    o.fillStyle = OUTLINE;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px(x, y)) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) o.fillRect(x + pad + dx, y + pad + dy, 1, 1);
  }
  f.fillStyle = '#ffffff';
  // light from above: pixels with nothing over them catch light, pixels with nothing under them fall into shade
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = px(x, y); if (!ch) continue; const base = PAL[ch] || ch, up = y > 0 && px(x, y - 1), dn = y < h - 1 && px(x, y + 1), lf = x > 0 && px(x - 1, y);
    o.fillStyle = !up ? shadeHex(base, 0.22) : !dn ? shadeHex(base, -0.28) : !lf ? shadeHex(base, 0.08) : base;
    o.fillRect(x + pad, y + pad, 1, 1); f.fillRect(x + pad, y + pad, 1, 1);
  }
  return { c: out, f: fl, w: w + pad * 2, h: h + pad * 2 };
}
const swapRows = (rows, i, row) => rows.map((r, j) => (j === i ? row : r));
function shadeHex(hex, k) { // k > 0 lightens toward white, k < 0 darkens toward black
  if (hex[0] !== '#') return hex; const v = parseInt(hex.slice(1), 16), c = [v >> 16 & 255, v >> 8 & 255, v & 255].map((x) => Math.round(k > 0 ? x + (255 - x) * k : x * (1 + k)));
  return '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('');
}

// --- curators (16x16), two walk frames each ---
const MINA = [
  '................',
  '.....hhhhhh.....',
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '...hhsssssshh...',
  '...hskssssksh...',
  '...hssssssssh...',
  '....ssmssmss....',
  '.....rrrrrr.....',
  '....BbbrrbbB....',
  '...sBbbbbbbBs...',
  '....BbbbbbbB....',
  '....BbbbbbbB....',
  '.....GG..GG.....',
  '.....GG..GG.....',
  '.....kk..kk.....',
];
const walk2 = (rows) => swapRows(swapRows(swapRows(rows, 13, '....GG....GG....'), 14, '....GG....GG....'), 15, '...kk......kk...');
const DOYUN = swapRows(swapRows(MINA, 1, '....NNNNNNN.....'), 5, '...hkwkkkwkkh...');
const OK = swapRows(swapRows(MINA, 2, '...wwwwwwwww....'), 1, '.....ww..ww.....');
const CHAR_ART = [
  [MINA, null], [DOYUN, { h: 'N', b: 'l', B: 'L', r: 'y' }], [OK, { h: 'g', b: 'p', B: 'P', r: 'o', s: 's' }],
].map(([rows, sw]) => [bake(rows, sw), bake(walk2(rows), sw)]);
const CHAR_ROWS = [MINA, DOYUN, OK];
const MIRROR_SWAP = { h: 'C', b: 'c', B: 'C', r: 'e', s: 'v', S: 'c', G: 'C', m: 'c', y: 'e', N: 'C', l: 'c', L: 'C', p: 'c', P: 'C', o: 'e', w: 'e', g: 'c' };
const mirrorArt = (ci) => [bake(CHAR_ROWS[ci], MIRROR_SWAP), bake(walk2(CHAR_ROWS[ci]), MIRROR_SWAP)];
const DIRECTOR = bake([
  '................',
  '.....gggggg.....',
  '....gggggggg....',
  '...gwwgggggwg...',
  '...gsssssssg....',
  '...skkwsskkws...',
  '...ssssssssss...',
  '....sSsmmsSs....',
  '.....SssssS.....',
  '....nnLLLLnn....',
  '...snnLwwLnns...',
  '....nnLLLLnn....',
  '....nnnnnnnn....',
  '.....GG..GG.....',
  '.....GG..GG.....',
  '.....kk..kk.....',
]);

// --- the slop (16x16) ---
const HAND = [
  '................',
  '..s.s.s.s.s.s...',
  '..s.s.s.s.s.s...',
  '..s.s.s.s.s.s...',
  '..sSsSsSsSsSs...',
  '..sssssssssss...',
  '.ssssssssssssS..',
  '.sskssssssksS...',
  '.sssssssssssS...',
  '..sssSmmmSsss...',
  '..sssssssssss...',
  '...sssssssss....',
  '....SsssssS.....',
  '.....SsssS......',
  '......SS........',
  '................',
];
const HAND2 = swapRows(swapRows(HAND, 1, '...s.s.s.s.s.s..'), 2, '..s.s.s.s.s.s...');
const GLYPH = [
  '................',
  '.....pppppp.....',
  '...pppppppppp...',
  '..ppewppppewpp..',
  '..ppkkppppkkpp..',
  '..pppppppppppp..',
  '..pwwpwpwwpwpp..',
  '..ppppwpppwppp..',
  '..pwpwwpwpwwpp..',
  '..pppppppppppp..',
  '..PppppppppppP..',
  '..PPpPPppPPpPP..',
  '..P.PP.PP.PP.P..',
  '................',
];
const GLYPH2 = swapRows(GLYPH, 12, '...P.PP.PP.PP.P.');
const CLOCK = [
  '................',
  '....kkkkkkk.....',
  '..kkyyyyyyykk...',
  '.kyyyywyyyyyyk..',
  '.kyyyywyyyyyyk..',
  'kyyyyywyyyyyyyk.',
  'kyyyyywwwwyyyyk.',
  'kyyyyyyyyyyyyyk.',
  '.kyyyyyyyyyyyk..',
  '.koyyyyyyyyyok..',
  '..kooyyyyyook...',
  '...koooyoook....',
  '....k.koook.....',
  '......kook......',
  '.......kk.......',
  '........k.......',
];
const CLOCK2 = swapRows(swapRows(CLOCK, 14, '......kk........'), 15, '.......k........');
const WORM = [
  '................',
  '.....llllll.....',
  '...llllllllll...',
  '..llwkllllwkll..',
  '..llkkllllkkll..',
  '..llllllllllll..',
  '..lLLLLLLLLLLl..',
  '..lwwwwwwwwwwl..',
  '..lkwkkwkwkkwl..',
  '..lwwwwwwwwwwl..',
  '..lkkwkkwkkwkl..',
  '..lwwwwwwwwwwl..',
  '..LllllllllllL..',
  '...LLL.LL.LLL...',
  '................',
];
const WORM2 = swapRows(WORM, 13, '..LLL..LL..LLL..');
const EYE = [
  '................',
  '.....wwwwww.....',
  '...wwwwrwwwww...',
  '..wwrwwwwwwrww..',
  '.wwwwwbbbbwwwww.',
  '.wwrwbbBBbbwwrw.',
  '.wwwwbBkkBbwwww.',
  '.wwwwbBkkBbwwww.',
  '.wrwwbbBBbbwwww.',
  '.wwwwwbbbbwwrww.',
  '..wwwwwwwwwwww..',
  '...wwrwwwwww....',
  '.....wwwwww.....',
  '................',
];
const EYE2 = swapRows(swapRows(EYE, 6, '.wwwwbkkBBbwwww.'), 7, '.wwwwbkkBBbwwww.');
const JELLY = [
  '................',
  '................',
  '......cccc......',
  '....cccccccc....',
  '...ccwcccccccc..',
  '..ccwwccccccccc.',
  '..cckccccckcccc.',
  '..ccccccccccccc.',
  '..cccccmmccccCc.',
  '..CcccccccccccC.',
  '..CCcccccccccCC.',
  '...CCCCCCCCCCC..',
  '................',
];
const JELLY2 = swapRows(swapRows(JELLY, 3, '.....cccccccc...'), 11, '..CCCCCCCCCCCCC.');
const ECHO = [
  '................',
  '.......cc.......',
  '......cwcc......',
  '.....cwccCc.....',
  '....cwcccCCc....',
  '...cwckcckCCc...',
  '..ccccccccCCCc..',
  '...cccmmccCCc...',
  '....cccccCCc....',
  '.....cccCCc.....',
  '......cCCc......',
  '.......Cc.......',
  '................',
];
const ART = {
  hand: [bake(HAND), bake(HAND2)], glyph: [bake(GLYPH), bake(GLYPH2)], clock: [bake(CLOCK), bake(CLOCK2)],
  worm: [bake(WORM), bake(WORM2)], eye: [bake(EYE), bake(EYE2)], jelly: [bake(JELLY), bake(JELLY2)],
  echo: [bake(ECHO), bake(swapRows(ECHO, 1, '......cc........'))],
};

// --- pickups ---
const GEM = ['...ww...', '..wbbB..', '.wbbbbB.', 'wbbbbbbB', '.BbbbbB.', '..BbbB..', '...BB...'];
const GEMS = [bake(GEM), bake(GEM, { b: 'l', B: 'L' }), bake(GEM, { b: 'r', B: 'R' }), bake(GEM, { b: 'p', B: 'P', w: 'v' })];
const KIMBAP = ['..kkkk..', '.kLLLLk.', 'kLwwwwLk', 'kLwyowLk', 'kLwlrwLk', 'kLwwwwLk', '.kLLLLk.', '..kkkk..'];
const CLIPBOX = ['.gggggg.', 'gGGGGGGg', 'gGrrRRGg', 'gGrGGRGg', 'gGrGGRGg', 'gGGGGGGg', '.gggggg.'];
const CHEST = ['..nnnnnnnnnn..', '.nNNNNNNNNNNn.', 'nNyyyyyyyyyyNn', 'nnnnnnyynnnnnn', 'nNNNNNyyNNNNNn', 'nNNNNNNNNNNNNn', 'nNNNNNNNNNNNNn', 'nnnnnnnnnnnnnn'];
const COIN = ['..yyyy..', '.yvvvyo.', 'yvyyyyoo', 'yvyooyoo', 'yvyooyoo', 'yyyyyyoo', '.yooooo.', '..oooo..'];
const PICK = { kimbap: bake(KIMBAP), clip: bake(CLIPBOX), chest: bake(CHEST), gold: bake(COIN) };

// --- 8x8 icons for weapons and passives (HUD and level-up cards) ---
const ICONS = {
  brush: bake(['......nN', '.....nN.', '....nN..', '...nN...', '..ww....', '.wwk....', 'wkk.....', 'kk......']),
  hl: bake(['......yy', '.....yyk', '....yyk.', '...yyk..', '..yyk...', '.kyk....', 'kkk.....', 'yy......']),
  stamp: bake(['..nnnn..', '..nNNn..', '...nn...', '...nn...', '.rrrrrr.', 'rRRRRRRr', 'rrrrrrrr', '........']),
  scis: bake(['.g....g.', '.gg..gg.', '..gggg..', '...gg...', '..rkkr..', '.r.kk.r.', '.r....r.', '..r..r..']),
  plane: bake(['.......w', '.....wwg', '...wwwg.', '.wwwwg..', 'wwwwg...', '...wg...', '...g....', '........']),
  eraser: bake(['........', '...mmmm.', '..mmmmmw', '.mmmmmww', 'bbbbbww.', 'bbbbbw..', 'bbbbb...', '........']),
  coffee: bake(['..w.w...', '...w.w..', 'wwwwwww.', 'wnnnnnwk', 'wnnnnnwk', 'wwwwwww.', '.wwwww..', '........']),
  loupe: bake(['.kkkk...', 'kcwccK..'.replace('K', 'k'), 'kwcccck.', 'kccccck.', '.kkkkk..', '....nn..', '.....nn.', '......nn']),
  shoes: bake(['........', '..rr....', '..rrr...', '..rrrrr.', '.rrrwrrr', 'wwwwwwww', 'kkkkkkkk', '........']),
  clip: bake(['.gggg...', 'g....g..', 'g.gg.g..', 'g.g..g..', 'g.g..g..', 'g.gggg..', 'g.......', '.gggg...']),
  vita: bake(['...ww...', '..wwww..', '..rrrr..', '..rRRr..', '..rrrr..', '..oooo..', '..oooo..', '...oo...']),
  copier: bake(['.wwwww..', '.wkkkw..', '.wwwwwgg', '.wkkkwkg', '.wwwwwwg', '...gkkkg', '...ggggg', '........']),
};
// draw a baked sprite centered at (x, y) on the pixel layer
function spr(s, x, y, flip, flash, scale = 1) {
  const img = flash ? s.f : s.c, w = s.w * scale, h = s.h * scale, dx = Math.round(x - w / 2), dy = Math.round(y - h / 2);
  if (flip) { g.save(); g.translate(dx + w, dy); g.scale(-1, 1); g.drawImage(img, 0, 0, w, h); g.restore(); }
  else g.drawImage(img, dx, dy, w, h);
}
