// ---------- levels: built with a few helpers instead of long ASCII maps ----------
// tiles: '#' solid, '=' one-way ledge, '^' ink thorns. Rows 0..16, the ground usually starts at row 13.
// entities: P start, T dialog trigger, C seal stone (checkpoint), G lost word, H ink pot, S shrine, E exit, D boss door,
//           b blot, s ink bloom (spitter), c crow-letter, k gatekeeper (shield), B the Engine
const ROWS = 17;
function mk(w) {
  const G = Array.from({ length: ROWS }, () => Array(w).fill(' ')), E = [];
  const L = {
    w, G, E,
    g(x0, x1, top) { for (let x = x0; x < x1; x++) for (let y = top; y < ROWS; y++) G[y][x] = '#'; return L; },
    b(x0, x1, y0, y1) { for (let x = x0; x < x1; x++) for (let y = y0; y < Math.min(y1, ROWS); y++) G[y][x] = '#'; return L; },
    p(x, y, n) { for (let i = 0; i < n; i++) G[y][x + i] = '='; return L; },
    sp(x0, x1, y) { for (let x = x0; x < x1; x++) G[y][x] = '^'; return L; },
    e(ch, x, y, arg) { E.push({ ch, x, y, arg }); return L; },
    many(ch, list) { for (const [x, y, arg] of list) E.push({ ch, x, y, arg }); return L; },
  };
  return L;
}
const LEVELS = [
  () => { // 1. The Blotted Village: learn to move, slash, dash and reflect
    const L = mk(170);
    L.g(0, 30, 13).e('P', 2, 12).e('T', 5, 12, 's1a').many('b', [[20, 12], [26, 12]]);
    L.g(30, 38, 12).g(38, 46, 11).e('b', 41, 10).e('T', 43, 10, 's1b');
    L.g(49, 62, 11).p(53, 8, 5).e('G', 55, 6, 0).e('b', 58, 10);
    L.g(62, 70, 13).e('T', 63, 12, 's1c').e('s', 68, 12);
    L.g(74, 90, 13).e('C', 76, 12).many('b', [[81, 12], [85, 12]]).e('H', 88, 12);
    L.g(90, 96, 11).g(96, 104, 9).e('c', 100, 4);
    L.e('G', 106, 5, 1).g(108, 120, 9).e('b', 112, 8).e('s', 117, 8);
    L.g(120, 150, 13).e('b', 124, 12).sp(128, 130, 12).e('s', 133, 12).e('C', 136, 12);
    L.p(140, 10, 3).p(144, 7, 3).e('G', 145, 5, 2).e('c', 142, 4).e('b', 146, 12);
    L.g(150, 170, 13).e('H', 152, 12).e('T', 156, 12, 's1d').e('S', 158, 12).e('E', 166, 12);
    return L;
  },
  () => { // 2. The Paper Bamboo: double jump, crows, long gaps
    const L = mk(200);
    L.g(0, 20, 13).e('P', 2, 12).e('T', 4, 12, 's2a').e('b', 14, 12);
    L.g(26, 40, 13).e('c', 32, 6).e('s', 38, 12);
    L.g(40, 58, 15).sp(40, 58, 14).p(41, 11, 3).p(46, 9, 3).p(51, 7, 3).e('G', 47, 4, 3);
    L.g(58, 72, 8).e('C', 60, 7).many('b', [[64, 7], [68, 7]]).e('c', 70, 3);
    L.g(72, 84, 13).many('s', [[76, 12], [83, 12]]).e('H', 80, 12);
    L.g(91, 110, 13).e('T', 93, 12, 's2b').many('c', [[96, 5], [104, 6]]).e('b', 100, 12);
    L.g(110, 130, 8).e('C', 112, 7).p(119, 5, 3).e('G', 120, 3, 4).e('b', 123, 7).e('s', 126, 7);
    L.p(132, 10, 2).g(136, 150, 11).many('b', [[140, 10], [146, 10]]).e('c', 143, 5);
    L.g(150, 166, 13).sp(153, 156, 12).sp(160, 163, 12).e('s', 165, 12);
    L.g(166, 200, 13).e('H', 168, 12).e('C', 170, 12).p(181, 9, 3).e('G', 182, 7, 5);
    L.many('b', [[178, 12], [185, 12]]).many('c', [[180, 4], [186, 5]]).e('T', 190, 12, 's2c').e('E', 196, 12);
    return L;
  },
  () => { // 3. The Tower of the Engine: gatekeepers, a hidden corridor, the boss
    const L = mk(172);
    L.g(0, 28, 13).e('P', 2, 12).e('T', 4, 12, 's3a').e('k', 14, 12);
    L.g(28, 44, 13).sp(31, 37, 12).e('G', 41, 12, 6);           // hidden corridor under the floor
    L.p(20, 11, 3).p(24, 9, 3).b(28, 44, 7, 8).b(44, 52, 7, ROWS); // the way up
    L.e('s', 34, 6).e('c', 40, 2).e('k', 48, 6);
    L.g(52, 58, 15).sp(52, 58, 14);
    L.g(58, 74, 9).e('C', 60, 8).e('k', 66, 8).e('H', 70, 8).e('s', 72, 8);
    L.g(74, 90, 13).many('c', [[78, 6], [87, 5]]).many('b', [[80, 12], [85, 12]]).p(81, 9, 3).e('G', 82, 6, 7);
    L.g(90, 104, 11).e('C', 92, 10).e('k', 97, 10).e('s', 102, 10);
    L.p(107, 9, 1).e('G', 107, 5, 8);
    L.g(111, 126, 11).many('k', [[116, 10], [122, 10]]).e('c', 119, 4);
    L.g(126, 172, 13).e('H', 128, 12).e('C', 130, 12).e('T', 132, 12, 's3b').e('D', 137, 12).e('B', 154, 4.5);
    L.b(170, 172, 0, ROWS);
    return L;
  },
];
