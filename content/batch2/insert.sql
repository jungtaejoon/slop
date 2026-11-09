-- batch 2: 12 posts by the site owner
begin;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b2$html$b2$, $b2$물감 섞기 퍼즐: 다섯 가지 물감으로 목표 색을 맞춰 보세요$b2$, $b2$빨강, 노랑, 파랑, 흰색, 검정 물감을 한 방울씩 떨어뜨려 목표 색을 만드는 게임이에요. 5라운드이고, 사람 눈에 비슷해 보이는 정도(CIELAB 색차)로 점수를 매겨요. 정답보다 방울을 적게 쓰면 보너스가 있어요.

화면 속 물감은 실제 물감처럼 섞이도록 흉내 냈어요. 파랑과 노랑을 섞으면 초록이 돼요.

**궁금한 점**: 너무 어려운가요, 쉬운가요? 최고 점수 자랑도 환영해요.$b2$, '', array[]::text[], $b2$<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>물감 섞기 퍼즐</title>
<style>
  :root{color-scheme:light}
  html,body{margin:0;min-height:100%;background:#f6f3ee;font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif;color:#222}
  main{max-width:520px;margin:0 auto;padding:16px;box-sizing:border-box}
  h1{font-size:22px;margin:4px 0 2px} .sub{margin:0 0 12px;color:#666;font-size:14px}
  .bar{display:flex;justify-content:space-between;font-size:14px;color:#555;margin-bottom:8px;font-variant-numeric:tabular-nums}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .sw{border-radius:16px;height:150px;display:flex;align-items:flex-end;padding:10px;box-sizing:border-box;font-weight:700;font-size:14px;box-shadow:inset 0 0 0 1px rgb(0 0 0 / .08)}
  .sw span{background:rgb(255 255 255 / .85);border-radius:8px;padding:3px 8px}
  .paints{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:14px 0 8px}
  .paints button{aspect-ratio:1;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 4px rgb(0 0 0 / .25);cursor:pointer;position:relative;font:inherit}
  .paints button b{position:absolute;right:-4px;top:-4px;background:#222;color:#fff;border-radius:999px;font-size:12px;min-width:20px;height:20px;line-height:20px}
  .paints button b:empty{display:none}
  .names{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;text-align:center;font-size:12px;color:#555;margin-bottom:12px}
  .row{display:flex;gap:8px} .row button{flex:1;padding:12px;border-radius:12px;border:0;font:inherit;font-weight:700;cursor:pointer;background:#e7e2da}
  .row button.pri{background:#222;color:#fff}
  #msg{min-height:44px;margin:12px 0 0;font-size:15px;text-align:center}
</style></head><body><main>
<h1>물감 섞기 퍼즐</h1>
<p class="sub">물감 방울을 떨어뜨려 왼쪽 색을 만들어 보세요. 방울은 적게, 색은 비슷하게.</p>
<div class="bar"><span id="round"></span><span id="total"></span></div>
<div class="pair"><div class="sw" id="target"><span>목표</span></div><div class="sw" id="mix"><span id="mixLabel">내 물감</span></div></div>
<div class="paints" id="paints"></div>
<div class="names" id="names"></div>
<div class="row"><button id="undo">한 방울 빼기</button><button id="clear">비우기</button><button class="pri" id="go">이걸로 제출</button></div>
<p id="msg"></p>
</main>
<script>
// Paint mixing is approximated by averaging in a "subtractive" space: each paint's
// absorbance (−log reflectance) is averaged by drop count, so blue + yellow → green.
const PAINTS = [['빨강', [0.87, 0.12, 0.13]], ['노랑', [0.98, 0.84, 0.10]], ['파랑', [0.10, 0.28, 0.75]], ['흰색', [0.97, 0.97, 0.96]], ['검정', [0.09, 0.09, 0.10]]];
const ROUNDS = 5;
let drops = [], history = [], round = 1, total = 0, target;
const $ = (id) => document.getElementById(id);
const A = (r) => -Math.log(Math.max(r, 0.002));
function mixColor(counts) {
  const n = counts.reduce((a, b) => a + b, 0); if (!n) return null;
  return [0, 1, 2].map((ch) => Math.exp(-counts.reduce((s, c, i) => s + c * A(PAINTS[i][1][ch]), 0) / n));
}
const css = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;
// distance in CIELAB, which follows how different colors look to people
function lab(c) {
  const lin = c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const X = (0.4124 * lin[0] + 0.3576 * lin[1] + 0.1805 * lin[2]) / 0.9505, Y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2], Z = (0.0193 * lin[0] + 0.1192 * lin[1] + 0.9505 * lin[2]) / 1.089;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const dist = (a, b) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
function newTarget() {
  // the target is always reachable: a random recipe of 2–6 drops
  let counts; do { counts = PAINTS.map(() => (Math.random() < 0.55 ? Math.floor(Math.random() * 3) : 0)); } while (counts.reduce((a, b) => a + b, 0) < 2 || counts.filter(Boolean).length < 2);
  target = mixColor(counts); target.recipe = counts.reduce((a, b) => a + b, 0);
}
function draw() {
  const counts = PAINTS.map((_, i) => drops.filter((d) => d === i).length), m = mixColor(counts);
  $('target').style.background = css(target);
  $('mix').style.background = m ? css(m) : 'repeating-linear-gradient(45deg,#eee 0 10px,#f8f8f8 10px 20px)';
  $('mixLabel').textContent = m ? `내 물감 · ${drops.length}방울` : '아직 비어 있어요';
  $('paints').querySelectorAll('b').forEach((b, i) => (b.textContent = counts[i] || ''));
  $('round').textContent = `${Math.min(round, ROUNDS)} / ${ROUNDS} 라운드`;
  $('total').textContent = `총점 ${total}`;
  $('go').disabled = !m;
}
PAINTS.forEach(([name, c], i) => {
  const b = document.createElement('button'); b.style.background = css(c); b.setAttribute('aria-label', name + ' 한 방울'); b.innerHTML = '<b></b>';
  b.onclick = () => { if (drops.length < 20) { drops.push(i); draw(); } }; $('paints').append(b);
  const s = document.createElement('span'); s.textContent = name; $('names').append(s);
});
$('undo').onclick = () => { drops.pop(); draw(); };
$('clear').onclick = () => { drops = []; draw(); };
$('go').onclick = () => {
  if (round > ROUNDS) { round = 1; total = 0; drops = []; newTarget(); $('go').textContent = '이걸로 제출'; $('msg').textContent = ''; draw(); return; }
  const m = mixColor(PAINTS.map((_, i) => drops.filter((d) => d === i).length)), d = dist(m, target);
  const match = Math.round(100 / (1 + (d / 25) ** 1.5)) /* ΔE 2 ≈ 98%, 10 ≈ 80%, 25 = 50% */, bonus = match >= 90 ? Math.max(0, 10 - drops.length) : 0, pts = match + bonus;
  total += pts;
  const word = match >= 97 ? '거의 똑같아요!' : match >= 90 ? '아주 비슷해요' : match >= 75 ? '꽤 가까워요' : '조금 멀어요';
  $('msg').textContent = `일치도 ${match}% · ${word}${bonus ? ` · 아낀 방울 보너스 +${bonus}` : ''} (정답은 ${target.recipe}방울짜리였어요)`;
  round++; drops = [];
  if (round > ROUNDS) { $('msg').textContent += ` · 최종 ${total}점!`; $('go').textContent = '새 게임'; draw(); $('go').disabled = false; return; }
  newTarget(); draw();
};
newTarget(); draw();
</script>
</body></html>
$b2$, '', '', 'Claude', $b2$물감 다섯 가지(빨강, 노랑, 파랑, 흰색, 검정)를 방울 단위로 섞어 목표 색을 맞추는 단일 HTML 게임. 섞기는 RGB 평균이 아니라 실제 물감처럼(파랑+노랑=초록), 점수는 CIELAB 색차로. 목표 색은 항상 만들 수 있는 조합에서 뽑기. 5라운드, 모바일 터치 대응.$b2$, array[$b2$퍼즐$b2$,$b2$색$b2$,$b2$캐주얼$b2$]::text[], now() - interval '30 minutes', now() - interval '30 minutes'
  from public.communities where slug = $b2$game$b2$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b2$물감 섞기 퍼즐: 다섯 가지 물감으로 목표 색을 맞춰 보세요$b2$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, $b2$첫 버전$b2$, author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b2$html$b2$, $b2$Paint Mixing Puzzle: match the target color with five paints$b2$, $b2$Drop red, yellow, blue, white and black paint one drop at a time to match the target color. Five rounds, scored by how close the colors look to the human eye (CIELAB color difference). Use fewer drops than the answer for a bonus.

The paints are simulated to mix like real paint: blue and yellow make green.

**Tell me**: too hard or too easy? High scores welcome.$b2$, '', array[]::text[], $b2$<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Paint Mixing Puzzle</title>
<style>
  :root{color-scheme:light}
  html,body{margin:0;min-height:100%;background:#f6f3ee;font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif;color:#222}
  main{max-width:520px;margin:0 auto;padding:16px;box-sizing:border-box}
  h1{font-size:22px;margin:4px 0 2px} .sub{margin:0 0 12px;color:#666;font-size:14px}
  .bar{display:flex;justify-content:space-between;font-size:14px;color:#555;margin-bottom:8px;font-variant-numeric:tabular-nums}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .sw{border-radius:16px;height:150px;display:flex;align-items:flex-end;padding:10px;box-sizing:border-box;font-weight:700;font-size:14px;box-shadow:inset 0 0 0 1px rgb(0 0 0 / .08)}
  .sw span{background:rgb(255 255 255 / .85);border-radius:8px;padding:3px 8px}
  .paints{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:14px 0 8px}
  .paints button{aspect-ratio:1;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 4px rgb(0 0 0 / .25);cursor:pointer;position:relative;font:inherit}
  .paints button b{position:absolute;right:-4px;top:-4px;background:#222;color:#fff;border-radius:999px;font-size:12px;min-width:20px;height:20px;line-height:20px}
  .paints button b:empty{display:none}
  .names{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;text-align:center;font-size:12px;color:#555;margin-bottom:12px}
  .row{display:flex;gap:8px} .row button{flex:1;padding:12px;border-radius:12px;border:0;font:inherit;font-weight:700;cursor:pointer;background:#e7e2da}
  .row button.pri{background:#222;color:#fff}
  #msg{min-height:44px;margin:12px 0 0;font-size:15px;text-align:center}
</style></head><body><main>
<h1>Paint Mixing Puzzle</h1>
<p class="sub">Drop paint to match the color on the left. Fewer drops, closer color.</p>
<div class="bar"><span id="round"></span><span id="total"></span></div>
<div class="pair"><div class="sw" id="target"><span>Target</span></div><div class="sw" id="mix"><span id="mixLabel">Your mix</span></div></div>
<div class="paints" id="paints"></div>
<div class="names" id="names"></div>
<div class="row"><button id="undo">Undo drop</button><button id="clear">Empty</button><button class="pri" id="go">Submit</button></div>
<p id="msg"></p>
</main>
<script>
// Paint mixing is approximated by averaging in a "subtractive" space: each paint's
// absorbance (−log reflectance) is averaged by drop count, so blue + yellow → green.
const PAINTS = [['Red', [0.87, 0.12, 0.13]], ['Yellow', [0.98, 0.84, 0.10]], ['Blue', [0.10, 0.28, 0.75]], ['White', [0.97, 0.97, 0.96]], ['Black', [0.09, 0.09, 0.10]]];
const ROUNDS = 5;
let drops = [], history = [], round = 1, total = 0, target;
const $ = (id) => document.getElementById(id);
const A = (r) => -Math.log(Math.max(r, 0.002));
function mixColor(counts) {
  const n = counts.reduce((a, b) => a + b, 0); if (!n) return null;
  return [0, 1, 2].map((ch) => Math.exp(-counts.reduce((s, c, i) => s + c * A(PAINTS[i][1][ch]), 0) / n));
}
const css = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;
// distance in CIELAB, which follows how different colors look to people
function lab(c) {
  const lin = c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const X = (0.4124 * lin[0] + 0.3576 * lin[1] + 0.1805 * lin[2]) / 0.9505, Y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2], Z = (0.0193 * lin[0] + 0.1192 * lin[1] + 0.9505 * lin[2]) / 1.089;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const dist = (a, b) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
function newTarget() {
  // the target is always reachable: a random recipe of 2–6 drops
  let counts; do { counts = PAINTS.map(() => (Math.random() < 0.55 ? Math.floor(Math.random() * 3) : 0)); } while (counts.reduce((a, b) => a + b, 0) < 2 || counts.filter(Boolean).length < 2);
  target = mixColor(counts); target.recipe = counts.reduce((a, b) => a + b, 0);
}
function draw() {
  const counts = PAINTS.map((_, i) => drops.filter((d) => d === i).length), m = mixColor(counts);
  $('target').style.background = css(target);
  $('mix').style.background = m ? css(m) : 'repeating-linear-gradient(45deg,#eee 0 10px,#f8f8f8 10px 20px)';
  $('mixLabel').textContent = m ? `Your mix · ${drops.length} drop${drops.length === 1 ? '' : 's'}` : 'Empty so far';
  $('paints').querySelectorAll('b').forEach((b, i) => (b.textContent = counts[i] || ''));
  $('round').textContent = `Round ${Math.min(round, ROUNDS)} / ${ROUNDS}`;
  $('total').textContent = `Score ${total}`;
  $('go').disabled = !m;
}
PAINTS.forEach(([name, c], i) => {
  const b = document.createElement('button'); b.style.background = css(c); b.setAttribute('aria-label', 'One drop of ' + name.toLowerCase()); b.innerHTML = '<b></b>';
  b.onclick = () => { if (drops.length < 20) { drops.push(i); draw(); } }; $('paints').append(b);
  const s = document.createElement('span'); s.textContent = name; $('names').append(s);
});
$('undo').onclick = () => { drops.pop(); draw(); };
$('clear').onclick = () => { drops = []; draw(); };
$('go').onclick = () => {
  if (round > ROUNDS) { round = 1; total = 0; drops = []; newTarget(); $('go').textContent = 'Submit'; $('msg').textContent = ''; draw(); return; }
  const m = mixColor(PAINTS.map((_, i) => drops.filter((d) => d === i).length)), d = dist(m, target);
  const match = Math.round(100 / (1 + (d / 25) ** 1.5)) /* ΔE 2 ≈ 98%, 10 ≈ 80%, 25 = 50% */, bonus = match >= 90 ? Math.max(0, 10 - drops.length) : 0, pts = match + bonus;
  total += pts;
  const word = match >= 97 ? 'Nearly identical!' : match >= 90 ? 'Very close' : match >= 75 ? 'Pretty close' : 'A bit off';
  $('msg').textContent = `Match ${match}% · ${word}${bonus ? ` · drops saved bonus +${bonus}` : ''} (the answer used ${target.recipe} drops)`;
  round++; drops = [];
  if (round > ROUNDS) { $('msg').textContent += ` · Final score ${total}!`; $('go').textContent = 'New game'; draw(); $('go').disabled = false; return; }
  newTarget(); draw();
};
newTarget(); draw();
</script>
</body></html>
$b2$, '', '', 'Claude', $b2$A single-HTML game: mix five paints (red, yellow, blue, white, black) drop by drop to match a target color. Mixing should behave like real paint (blue + yellow = green), not an RGB average. Score with CIELAB color difference. Targets are always reachable. 5 rounds, works with touch.$b2$, array[$b2$puzzle$b2$,$b2$color$b2$,$b2$casual$b2$]::text[], now() - interval '36 minutes', now() - interval '36 minutes'
  from public.communities where slug = $b2$game$b2$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b2$Paint Mixing Puzzle: match the target color with five paints$b2$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, $b2$First version$b2$, author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b2$html$b2$, $b2$생일 문제: 23명만 모여도 생일 같은 사람이 있을 확률 50% (직접 뽑아 보기)$b2$, $b2$"한 반에 생일이 같은 사람이 있을까?" 직관으로는 100명은 넘어야 할 것 같지만, 23명이면 50%, 57명이면 99%예요.

사람 수를 바꾸면 정확한 확률과 그래프가 바뀌고, "한 반 뽑아 보기"를 누르면 365칸 달력에 생일을 찍어서 겹친 날을 빨갛게 보여 줘요. 1000반을 한꺼번에 뽑아 계산값과 비교할 수도 있어요.

이해하는 데 도움이 됐는지 판정해 주세요.$b2$, '', array[]::text[], $b2$<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>생일 문제 시뮬레이터</title>
<style>
  html,body{margin:0;background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif}
  main{max-width:640px;margin:0 auto;padding:16px;box-sizing:border-box}
  h1{font-size:22px;margin:4px 0} p{margin:6px 0;color:#94a3b8;font-size:14px;line-height:1.5}
  .big{font-size:40px;font-weight:800;color:#fbbf24;font-variant-numeric:tabular-nums}
  label{display:flex;align-items:center;gap:10px;margin:12px 0;font-weight:700} input[type=range]{flex:1}
  #grid{display:grid;grid-template-columns:repeat(31,1fr);gap:2px;margin:12px 0}
  #grid i{aspect-ratio:1;background:#1e293b;border-radius:2px}
  #grid i.one{background:#38bdf8} #grid i.two{background:#f43f5e;box-shadow:0 0 0 1px #fda4af}
  .row{display:flex;gap:8px;flex-wrap:wrap} button{padding:11px 14px;border-radius:10px;border:0;font:inherit;font-weight:700;cursor:pointer;background:#334155;color:#fff}
  button.pri{background:#fbbf24;color:#111}
  #out{min-height:22px;margin-top:10px;font-size:15px;color:#e2e8f0}
  canvas{width:100%;height:120px;display:block;margin-top:14px}
</style></head><body><main>
<h1>생일 문제: 몇 명이면 생일 같은 사람이 있을까?</h1>
<p>한 반에 23명만 모여도 생일이 같은 두 사람이 있을 확률이 50%를 넘어요. 믿기 어렵다면 직접 뽑아 보세요.</p>
<label>사람 수 <input type="range" id="n" min="2" max="80" value="23"> <span id="nv"></span></label>
<div class="big" id="p"></div>
<p id="pdesc"></p>
<div class="row"><button class="pri" id="once">한 반 뽑아 보기</button><button id="many">1000반 뽑기</button></div>
<div id="grid" aria-label="1년 365일, 칸마다 하루"></div>
<div id="out"></div>
<canvas id="c" width="1200" height="240" aria-label="사람 수에 따른 확률 그래프"></canvas>
<p>왜 이렇게 높을까요? 23명이면 두 사람씩 짝지을 수 있는 경우가 253쌍이에요. 그중 한 쌍만 겹쳐도 되니까요.</p>
</main>
<script>
const $ = (id) => document.getElementById(id), grid = $('grid');
for (let d = 0; d < 365; d++) grid.append(document.createElement('i'));
// exact probability that at least two of n people share a birthday (365 equally likely days)
const prob = (n) => { let none = 1; for (let k = 0; k < n; k++) none *= (365 - k) / 365; return 1 - none; };
const pct = (x) => (x * 100).toFixed(x < 0.995 ? 1 : 2) + '%';
function draw() {
  const n = +$('n').value; $('nv').textContent = n + '명';
  $('p').textContent = pct(prob(n));
  $('pdesc').textContent = `${n}명 중 생일이 같은 사람이 적어도 한 쌍 있을 확률 (짝지을 수 있는 쌍: ${n * (n - 1) / 2}개)`;
  const c = $('c'), g = c.getContext('2d'), W = c.width, H = c.height; g.clearRect(0, 0, W, H);
  g.strokeStyle = '#334155'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
  g.fillStyle = '#64748b'; g.font = '24px system-ui'; g.fillText('50%', 8, H / 2 - 8);
  g.strokeStyle = '#fbbf24'; g.lineWidth = 5; g.beginPath();
  for (let k = 2; k <= 80; k++) { const x = ((k - 2) / 78) * W, y = H - prob(k) * (H - 10) - 5; k === 2 ? g.moveTo(x, y) : g.lineTo(x, y); }
  g.stroke();
  const x = ((n - 2) / 78) * W, y = H - prob(n) * (H - 10) - 5; g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill();
}
const sample = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 365));
const MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const dayName = (d) => { let m = 0; while (d >= MONTH[m]) d -= MONTH[m++]; return `${m + 1}월 ${d + 1}일`; };
$('once').onclick = () => {
  const n = +$('n').value, days = sample(n), cnt = new Array(365).fill(0); days.forEach((d) => cnt[d]++);
  grid.querySelectorAll('i').forEach((el, d) => (el.className = cnt[d] > 1 ? 'two' : cnt[d] ? 'one' : ''));
  const dup = cnt.map((c, d) => [c, d]).filter(([c]) => c > 1);
  $('out').textContent = dup.length ? `겹쳤어요! ${dup.map(([c, d]) => `${dayName(d)}에 ${c}명`).join(', ')}` : '이번 반은 모두 생일이 달라요.';
};
$('many').onclick = () => {
  const n = +$('n').value; let hit = 0;
  for (let t = 0; t < 1000; t++) { const s = new Set(); for (const d of sample(n)) { if (s.has(d)) { hit++; break; } s.add(d); } }
  $('out').textContent = `1000반 중 ${hit}반에서 생일이 겹쳤어요 (${(hit / 10).toFixed(1)}%). 계산값은 ${pct(prob(n))}예요.`;
};
$('n').oninput = draw; draw(); $('once').onclick();
</script>
</body></html>
$b2$, '', '', 'Claude', $b2$생일 문제를 체감하게 하는 단일 HTML. 사람 수 슬라이더(2~80), 정확한 확률과 곡선 그래프, 한 반을 무작위로 뽑아 365칸 격자에 표시하고 겹친 날 강조, 1000반 시뮬레이션 결과를 계산값과 비교. 왜 높은지 "쌍의 수"로 한 줄 설명.$b2$, array[$b2$확률$b2$,$b2$수학$b2$,$b2$시뮬레이션$b2$]::text[], now() - interval '90 minutes', now() - interval '90 minutes'
  from public.communities where slug = $b2$study$b2$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b2$생일 문제: 23명만 모여도 생일 같은 사람이 있을 확률 50% (직접 뽑아 보기)$b2$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, $b2$첫 버전$b2$, author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b2$html$b2$, $b2$The birthday problem: 23 people give a 50% chance of a shared birthday (try it)$b2$, $b2$"Does anyone in this room share a birthday?" It feels like you would need well over 100 people, but 23 is enough for 50%, and 57 for 99%.

Move the slider to see the exact probability and the curve. "Draw one room" drops each birthday onto a 365-cell calendar and turns matches red. You can also draw 1000 rooms at once and compare with the math.

Did it help it click? Judge it.$b2$, '', array[]::text[], $b2$<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Birthday Problem Simulator</title>
<style>
  html,body{margin:0;background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif}
  main{max-width:640px;margin:0 auto;padding:16px;box-sizing:border-box}
  h1{font-size:22px;margin:4px 0} p{margin:6px 0;color:#94a3b8;font-size:14px;line-height:1.5}
  .big{font-size:40px;font-weight:800;color:#fbbf24;font-variant-numeric:tabular-nums}
  label{display:flex;align-items:center;gap:10px;margin:12px 0;font-weight:700} input[type=range]{flex:1}
  #grid{display:grid;grid-template-columns:repeat(31,1fr);gap:2px;margin:12px 0}
  #grid i{aspect-ratio:1;background:#1e293b;border-radius:2px}
  #grid i.one{background:#38bdf8} #grid i.two{background:#f43f5e;box-shadow:0 0 0 1px #fda4af}
  .row{display:flex;gap:8px;flex-wrap:wrap} button{padding:11px 14px;border-radius:10px;border:0;font:inherit;font-weight:700;cursor:pointer;background:#334155;color:#fff}
  button.pri{background:#fbbf24;color:#111}
  #out{min-height:22px;margin-top:10px;font-size:15px;color:#e2e8f0}
  canvas{width:100%;height:120px;display:block;margin-top:14px}
</style></head><body><main>
<h1>The birthday problem: how many people until two share a birthday?</h1>
<p>With just 23 people in a room, the chance that two share a birthday is over 50%. Hard to believe? Draw some rooms yourself.</p>
<label>People <input type="range" id="n" min="2" max="80" value="23"> <span id="nv"></span></label>
<div class="big" id="p"></div>
<p id="pdesc"></p>
<div class="row"><button class="pri" id="once">Draw one room</button><button id="many">Draw 1000 rooms</button></div>
<div id="grid" aria-label="365 days of the year, one cell per day"></div>
<div id="out"></div>
<canvas id="c" width="1200" height="240" aria-label="Probability by number of people"></canvas>
<p>Why so high? 23 people make 253 possible pairs, and any single pair matching is enough.</p>
</main>
<script>
const $ = (id) => document.getElementById(id), grid = $('grid');
for (let d = 0; d < 365; d++) grid.append(document.createElement('i'));
// exact probability that at least two of n people share a birthday (365 equally likely days)
const prob = (n) => { let none = 1; for (let k = 0; k < n; k++) none *= (365 - k) / 365; return 1 - none; };
const pct = (x) => (x * 100).toFixed(x < 0.995 ? 1 : 2) + '%';
function draw() {
  const n = +$('n').value; $('nv').textContent = n + ' people';
  $('p').textContent = pct(prob(n));
  $('pdesc').textContent = `Chance that at least one pair among ${n} people shares a birthday (${n * (n - 1) / 2} possible pairs)`;
  const c = $('c'), g = c.getContext('2d'), W = c.width, H = c.height; g.clearRect(0, 0, W, H);
  g.strokeStyle = '#334155'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
  g.fillStyle = '#64748b'; g.font = '24px system-ui'; g.fillText('50%', 8, H / 2 - 8);
  g.strokeStyle = '#fbbf24'; g.lineWidth = 5; g.beginPath();
  for (let k = 2; k <= 80; k++) { const x = ((k - 2) / 78) * W, y = H - prob(k) * (H - 10) - 5; k === 2 ? g.moveTo(x, y) : g.lineTo(x, y); }
  g.stroke();
  const x = ((n - 2) / 78) * W, y = H - prob(n) * (H - 10) - 5; g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill();
}
const sample = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 365));
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const dayName = (d) => { let m = 0; while (d >= MONTH[m]) d -= MONTH[m++]; return `${MON[m]} ${d + 1}`; };
$('once').onclick = () => {
  const n = +$('n').value, days = sample(n), cnt = new Array(365).fill(0); days.forEach((d) => cnt[d]++);
  grid.querySelectorAll('i').forEach((el, d) => (el.className = cnt[d] > 1 ? 'two' : cnt[d] ? 'one' : ''));
  const dup = cnt.map((c, d) => [c, d]).filter(([c]) => c > 1);
  $('out').textContent = dup.length ? `A match! ${dup.map(([c, d]) => `${c} people on ${dayName(d)}`).join(', ')}` : 'Everyone in this room has a different birthday.';
};
$('many').onclick = () => {
  const n = +$('n').value; let hit = 0;
  for (let t = 0; t < 1000; t++) { const s = new Set(); for (const d of sample(n)) { if (s.has(d)) { hit++; break; } s.add(d); } }
  $('out').textContent = `${hit} of 1000 rooms had a shared birthday (${(hit / 10).toFixed(1)}%). The math says ${pct(prob(n))}.`;
};
$('n').oninput = draw; draw(); $('once').onclick();
</script>
</body></html>
$b2$, '', '', 'Claude', $b2$A single-HTML page that makes the birthday problem intuitive: a people slider (2–80), the exact probability and its curve, drawing one random room onto a 365-cell grid with matches highlighted, and a 1000-room simulation compared with the math. Explain it in one line using the number of pairs.$b2$, array[$b2$probability$b2$,$b2$math$b2$,$b2$simulation$b2$]::text[], now() - interval '96 minutes', now() - interval '96 minutes'
  from public.communities where slug = $b2$study$b2$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b2$The birthday problem: 23 people give a 50% chance of a shared birthday (try it)$b2$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, $b2$First version$b2$, author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b2$html$b2$, $b2$모임 정산 계산기: 송금 횟수가 가장 적게 "누가 누구에게 얼마" 알려 줘요$b2$, $b2$1차는 민지가, 2차는 준호가, 택시는 서연이가 냈을 때 누가 누구에게 얼마를 보내야 할까요? 사람과 결제 내역만 적으면 1인당 금액을 계산하고, **송금 횟수가 가장 적게** 정리해 줘요. 결과는 단톡방에 붙여 넣기 좋게 복사할 수 있어요.

**알려 주세요**: "나는 2차 안 갔어"처럼 일부만 나누는 기능이 필요할까요?$b2$, '', array[]::text[], $b2$<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>모임 정산 계산기</title>
<style>
  html,body{margin:0;background:#f8fafc;color:#0f172a;font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif}
  main{max-width:560px;margin:0 auto;padding:16px;box-sizing:border-box}
  h1{font-size:22px;margin:4px 0} p.sub{margin:0 0 12px;color:#64748b;font-size:14px;line-height:1.5}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;margin-bottom:12px}
  .item{display:grid;grid-template-columns:1fr 110px 92px 32px;gap:6px;margin-bottom:6px}
  input,select{font:inherit;padding:9px;border:1px solid #cbd5e1;border-radius:9px;min-width:0;background:#fff}
  button{font:inherit;cursor:pointer;border:0;border-radius:9px;padding:9px 12px;background:#e2e8f0;font-weight:700}
  .x{background:none;color:#94a3b8;padding:0}
  h2{font-size:15px;margin:2px 0 8px} .muted{color:#64748b;font-size:13px}
  #people{width:100%;box-sizing:border-box}
  .tx{display:flex;align-items:center;gap:8px;padding:10px 0;border-top:1px solid #f1f5f9;font-size:16px}
  .tx:first-child{border-top:0} .tx b{font-variant-numeric:tabular-nums;margin-left:auto}
  .arrow{color:#94a3b8}
  .copy{width:100%;margin-top:8px;background:#0f172a;color:#fff;padding:12px}
</style></head><body><main>
<h1>모임 정산 계산기</h1>
<p class="sub">누가 얼마를 냈는지만 적으면, <b>송금 횟수가 가장 적게</b> 누가 누구에게 얼마 보내면 되는지 알려 줘요. 1원 단위는 내림해서 맞춰요.</p>
<div class="card"><h2>함께한 사람 <span class="muted">(쉼표로 구분)</span></h2><input id="people" value="민지, 준호, 서연, 태우"></div>
<div class="card"><h2>결제 내역</h2><div id="items"></div><button id="add">+ 결제 추가</button></div>
<div class="card"><h2>이렇게 보내면 끝나요</h2><div id="out"></div><button class="copy" id="copy">결과 복사하기</button></div>
</main>
<script>
const $ = (id) => document.getElementById(id);
let items = [{ what: '1차 고깃집', who: '민지', amt: 186000 }, { what: '2차 카페', who: '준호', amt: 27400 }, { what: '택시', who: '서연', amt: 15800 }];
const people = () => [...new Set($('people').value.split(',').map((s) => s.trim()).filter(Boolean))];
const won = (n) => n.toLocaleString('ko-KR') + '원';
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function renderItems() {
  const ps = people();
  $('items').innerHTML = items.map((it, i) => `<div class="item"><input data-i="${i}" data-k="what" value="${esc(it.what)}" placeholder="내용"><select data-i="${i}" data-k="who">${ps.map((p) => `<option${p === it.who ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select><input data-i="${i}" data-k="amt" inputmode="numeric" value="${it.amt || ''}" placeholder="금액"><button class="x" data-del="${i}" aria-label="삭제">✕</button></div>`).join('');
  calc();
}
// greedy: the person who owes most pays the person owed most, until everyone is even
function calc() {
  const ps = people(); if (!ps.length) { $('out').innerHTML = '<p class="muted">사람 이름을 적어 주세요.</p>'; return; }
  const paid = Object.fromEntries(ps.map((p) => [p, 0]));
  items.forEach((it) => { if (paid[it.who] !== undefined) paid[it.who] += +it.amt || 0; });
  const total = Object.values(paid).reduce((a, b) => a + b, 0), share = Math.floor(total / ps.length);
  const bal = ps.map((p) => ({ p, v: paid[p] - share }));
  const tx = [];
  for (let guard = 0; guard < 100; guard++) {
    bal.sort((a, b) => a.v - b.v); const d = bal[0], c = bal[bal.length - 1];
    if (-d.v < 10 || c.v < 10) break;
    const m = Math.min(-d.v, c.v); tx.push([d.p, c.p, m]); d.v += m; c.v -= m;
  }
  $('out').innerHTML = `<p class="muted">총 ${won(total)} · 1인당 ${won(share)}</p>` + (tx.length ? tx.map(([a, b, m]) => `<div class="tx">${esc(a)} <span class="arrow">→</span> ${esc(b)} <b>${won(m)}</b></div>`).join('') : '<p class="muted">보낼 돈이 없어요. 이미 딱 맞아요!</p>');
  $('out').dataset.text = `[정산] 총 ${won(total)}, 1인당 ${won(share)}\n` + tx.map(([a, b, m]) => `${a} → ${b} ${won(m)}`).join('\n');
}
$('items').addEventListener('input', (e) => { const { i, k } = e.target.dataset; if (i === undefined) return; items[i][k] = k === 'amt' ? +e.target.value.replace(/[^\d]/g, '') : e.target.value; calc(); });
$('items').addEventListener('click', (e) => { const d = e.target.dataset.del; if (d !== undefined) { items.splice(+d, 1); renderItems(); } });
$('add').onclick = () => { items.push({ what: '', who: people()[0] || '', amt: 0 }); renderItems(); $('items').lastElementChild.querySelector('input').focus(); };
$('people').addEventListener('change', renderItems);
$('copy').onclick = async () => { try { await navigator.clipboard.writeText($('out').dataset.text); $('copy').textContent = '복사했어요!'; } catch { $('copy').textContent = '복사가 막혀 있어요. 직접 선택해 주세요'; } setTimeout(() => ($('copy').textContent = '결과 복사하기'), 1500); };
renderItems();
</script>
</body></html>
$b2$, '', '', 'Claude', $b2$모임 정산 단일 HTML. 사람 이름(쉼표 구분)과 결제 내역(내용, 낸 사람, 금액)을 받아 1인당 금액을 구하고, 가장 많이 받을 사람과 가장 많이 낼 사람을 짝지어 송금 횟수를 줄이는 방식으로 "A → B 금액" 목록을 만든다. 결과 복사 버튼, 원 단위 내림.$b2$, array[$b2$정산$b2$,$b2$모임$b2$,$b2$계산기$b2$]::text[], now() - interval '180 minutes', now() - interval '180 minutes'
  from public.communities where slug = $b2$work-tools$b2$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b2$모임 정산 계산기: 송금 횟수가 가장 적게 "누가 누구에게 얼마" 알려 줘요$b2$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, $b2$첫 버전$b2$, author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b2$html$b2$, $b2$Group expense splitter: who pays whom, with the fewest transfers$b2$, $b2$Maya paid for dinner, Jun for coffee, Sofia for the taxi. Who owes whom? Enter the people and the payments: it works out each share and settles everyone up with **as few transfers as possible**. Copy the result straight into your group chat.

**Tell me**: do you need "I skipped coffee" style partial splits?$b2$, '', array[]::text[], $b2$<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Group Expense Splitter</title>
<style>
  html,body{margin:0;background:#f8fafc;color:#0f172a;font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif}
  main{max-width:560px;margin:0 auto;padding:16px;box-sizing:border-box}
  h1{font-size:22px;margin:4px 0} p.sub{margin:0 0 12px;color:#64748b;font-size:14px;line-height:1.5}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;margin-bottom:12px}
  .item{display:grid;grid-template-columns:1fr 110px 92px 32px;gap:6px;margin-bottom:6px}
  input,select{font:inherit;padding:9px;border:1px solid #cbd5e1;border-radius:9px;min-width:0;background:#fff}
  button{font:inherit;cursor:pointer;border:0;border-radius:9px;padding:9px 12px;background:#e2e8f0;font-weight:700}
  .x{background:none;color:#94a3b8;padding:0}
  h2{font-size:15px;margin:2px 0 8px} .muted{color:#64748b;font-size:13px}
  #people{width:100%;box-sizing:border-box}
  .tx{display:flex;align-items:center;gap:8px;padding:10px 0;border-top:1px solid #f1f5f9;font-size:16px}
  .tx:first-child{border-top:0} .tx b{font-variant-numeric:tabular-nums;margin-left:auto}
  .arrow{color:#94a3b8}
  .copy{width:100%;margin-top:8px;background:#0f172a;color:#fff;padding:12px}
</style></head><body><main>
<h1>Group Expense Splitter</h1>
<p class="sub">Enter who paid what, and it tells you who should pay whom, <b>with as few transfers as possible</b>. Shares are rounded down to the cent.</p>
<div class="card"><h2>People <span class="muted">(comma-separated)</span></h2><input id="people" value="Maya, Jun, Sofia, Leo"></div>
<div class="card"><h2>Payments</h2><div id="items"></div><button id="add">+ Add payment</button></div>
<div class="card"><h2>Settle up like this</h2><div id="out"></div><button class="copy" id="copy">Copy result</button></div>
</main>
<script>
const $ = (id) => document.getElementById(id);
let items = [{ what: 'Dinner', who: 'Maya', amt: 186.4 }, { what: 'Coffee', who: 'Jun', amt: 27.5 }, { what: 'Taxi', who: 'Sofia', amt: 15.8 }];
const people = () => [...new Set($('people').value.split(',').map((s) => s.trim()).filter(Boolean))];
const won = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function renderItems() {
  const ps = people();
  $('items').innerHTML = items.map((it, i) => `<div class="item"><input data-i="${i}" data-k="what" value="${esc(it.what)}" placeholder="What"><select data-i="${i}" data-k="who">${ps.map((p) => `<option${p === it.who ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select><input data-i="${i}" data-k="amt" inputmode="decimal" value="${it.amt || ''}" placeholder="Amount"><button class="x" data-del="${i}" aria-label="Remove">✕</button></div>`).join('');
  calc();
}
// greedy: the person who owes most pays the person owed most, until everyone is even
function calc() {
  const ps = people(); if (!ps.length) { $('out').innerHTML = '<p class="muted">Add some names first.</p>'; return; }
  const paid = Object.fromEntries(ps.map((p) => [p, 0]));
  items.forEach((it) => { if (paid[it.who] !== undefined) paid[it.who] += Math.round((+it.amt || 0) * 100); });
  const total = Object.values(paid).reduce((a, b) => a + b, 0), share = Math.floor(total / ps.length);
  const bal = ps.map((p) => ({ p, v: paid[p] - share }));
  const tx = [];
  for (let guard = 0; guard < 100; guard++) {
    bal.sort((a, b) => a.v - b.v); const d = bal[0], c = bal[bal.length - 1];
    if (-d.v < 1 || c.v < 1) break;
    const m = Math.min(-d.v, c.v); tx.push([d.p, c.p, m]); d.v += m; c.v -= m;
  }
  $('out').innerHTML = `<p class="muted">Total ${won(total / 100)} · ${won(share / 100)} each</p>` + (tx.length ? tx.map(([a, b, m]) => `<div class="tx">${esc(a)} <span class="arrow">→</span> ${esc(b)} <b>${won(m / 100)}</b></div>`).join('') : '<p class="muted">Nothing to send. You are already even!</p>');
  $('out').dataset.text = `[Settle up] Total ${won(total / 100)}, ${won(share / 100)} each\n` + tx.map(([a, b, m]) => `${a} → ${b} ${won(m / 100)}`).join('\n');
}
$('items').addEventListener('input', (e) => { const { i, k } = e.target.dataset; if (i === undefined) return; items[i][k] = k === 'amt' ? +e.target.value.replace(/[^\d.]/g, '') : e.target.value; calc(); });
$('items').addEventListener('click', (e) => { const d = e.target.dataset.del; if (d !== undefined) { items.splice(+d, 1); renderItems(); } });
$('add').onclick = () => { items.push({ what: '', who: people()[0] || '', amt: 0 }); renderItems(); $('items').lastElementChild.querySelector('input').focus(); };
$('people').addEventListener('change', renderItems);
$('copy').onclick = async () => { try { await navigator.clipboard.writeText($('out').dataset.text); $('copy').textContent = 'Copied!'; } catch { $('copy').textContent = 'Copying is blocked here. Select the text instead'; } setTimeout(() => ($('copy').textContent = 'Copy result'), 1500); };
renderItems();
</script>
</body></html>
$b2$, '', '', 'Claude', $b2$A single-HTML group expense splitter: take names (comma-separated) and payments (what, who paid, amount), compute each share, then pair the biggest debtor with the biggest creditor to keep transfers few. Output "A → B amount" lines, a copy button, and work in cents.$b2$, array[$b2$money$b2$,$b2$friends$b2$,$b2$calculator$b2$]::text[], now() - interval '186 minutes', now() - interval '186 minutes'
  from public.communities where slug = $b2$work-tools$b2$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b2$Group expense splitter: who pays whom, with the fewest transfers$b2$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, $b2$First version$b2$, author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b2$html$b2$, $b2$바람의 결: 수천 개의 선이 보이지 않는 바람을 따라 흘러요 (누르면 바람이 바뀌어요)$b2$, $b2$화면 위 입자 수천 개가 보이지 않는 바람(겹친 사인파로 만든 흐름)을 따라 움직이며 선을 남겨요. 가만히 두면 결이 점점 쌓여서 머릿결이나 물살 같은 무늬가 돼요.

- **짧게 누르기**: 새 바람과 새 색 조합
- **누른 채 움직이기**: 손가락 주위에 소용돌이

마음에 드는 무늬가 나오면 캡처해서 댓글로 보여 주세요.$b2$, '', array[]::text[], $b2$<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>바람의 결</title>
<style>
  html,body{margin:0;height:100%;background:#0b0d12;overflow:hidden;font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif}
  canvas{display:block;width:100%;height:100%;cursor:pointer;touch-action:none}
  .tip{position:fixed;left:0;right:0;bottom:14px;text-align:center;color:#cbd5e1;font-size:13px;opacity:.75;pointer-events:none;transition:opacity 1s}
</style></head><body>
<canvas id="c"></canvas><div class="tip" id="tip">누르면 바람이 바뀌어요 · 누른 채 움직이면 소용돌이가 생겨요</div>
<script>
// Thousands of particles follow an invisible wind made of layered sine waves.
// Each tap picks a new wind and palette; dragging adds a swirl around the finger.
const c = document.getElementById('c'), g = c.getContext('2d');
let W, H, dpr, parts = [], seed, pal, swirl = null, t = 0;
const PALS = [['#f4a261', '#e76f51', '#2a9d8f', '#e9c46a'], ['#a5b4fc', '#c4b5fd', '#f0abfc', '#e0f2fe'], ['#fde68a', '#fca5a5', '#fdba74', '#fef3c7'], ['#6ee7b7', '#5eead4', '#93c5fd', '#d9f99d']];
function rnd(s) { return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function reset() {
  dpr = Math.min(devicePixelRatio || 1, 2); W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr;
  const r = rnd(seed = (Math.random() * 1e9) | 0);
  pal = PALS[Math.floor(r() * PALS.length)];
  wind.a = [r() * 1.2 + 0.4, r() * 1.2 + 0.4, r() * 6, r() * 6, r() * 0.8 + 0.3];
  g.fillStyle = '#0b0d12'; g.fillRect(0, 0, W, H);
  const n = Math.min(2600, Math.floor((W * H) / (900 * dpr * dpr)));
  parts = Array.from({ length: n }, () => spawn());
}
const spawn = () => ({ x: Math.random() * W, y: Math.random() * H, life: 150 + Math.random() * 350, col: pal[Math.floor(Math.random() * pal.length)] });
const wind = { a: [1, 1, 0, 0, 1] };
function angle(x, y) {
  const [fx, fy, px, py, k] = wind.a, u = x / W, v = y / H;
  let a = Math.sin(u * fx * 6.28 + px + t * 0.0004) + Math.cos(v * fy * 6.28 + py) + Math.sin((u + v) * k * 6.28 + t * 0.0002);
  a *= Math.PI * 0.8;
  if (swirl) { const dx = x - swirl.x, dy = y - swirl.y, d2 = dx * dx + dy * dy, R = 160 * dpr; if (d2 < R * R * 4) { const w = Math.exp(-d2 / (R * R)); a = a * (1 - w) + (Math.atan2(dy, dx) + Math.PI / 2) * w; } }
  return a;
}
function frame() {
  t += 16;
  g.fillStyle = 'rgba(11,13,18,0.018)'; g.fillRect(0, 0, W, H);
  g.lineWidth = 1.2 * dpr; g.globalAlpha = 0.6;
  for (const p of parts) {
    const a = angle(p.x, p.y), nx = p.x + Math.cos(a) * 1.6 * dpr, ny = p.y + Math.sin(a) * 1.6 * dpr;
    g.strokeStyle = p.col; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(nx, ny); g.stroke();
    p.x = nx; p.y = ny;
    if (--p.life < 0 || nx < 0 || ny < 0 || nx > W || ny > H) Object.assign(p, spawn());
  }
  g.globalAlpha = 1;
  requestAnimationFrame(frame);
}
let downAt = 0;
c.addEventListener('pointerdown', (e) => { downAt = Date.now(); swirl = { x: e.clientX * dpr, y: e.clientY * dpr }; document.getElementById('tip').style.opacity = 0; });
c.addEventListener('pointermove', (e) => { if (swirl) swirl = { x: e.clientX * dpr, y: e.clientY * dpr }; });
addEventListener('pointerup', () => { if (Date.now() - downAt < 250) reset(); swirl = null; });
addEventListener('resize', reset);
reset(); frame();
</script>
</body></html>
$b2$, '', '', 'Claude', $b2$흐름장(flow field) 생성 예술 단일 HTML 캔버스. 입자 수천 개가 사인파를 겹친 각도장을 따라 움직이며 반투명 선을 남기고, 화면은 아주 천천히 어두워진다. 탭하면 새 바람과 팔레트, 드래그하면 손가락 주위에 소용돌이. 모바일 대응, devicePixelRatio 최대 2.$b2$, array[$b2$생성예술$b2$,$b2$애니메이션$b2$,$b2$인터랙티브$b2$]::text[], now() - interval '300 minutes', now() - interval '300 minutes'
  from public.communities where slug = $b2$video$b2$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b2$바람의 결: 수천 개의 선이 보이지 않는 바람을 따라 흘러요 (누르면 바람이 바뀌어요)$b2$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, $b2$첫 버전$b2$, author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b2$html$b2$, $b2$Wind Lines: thousands of strokes following an invisible wind (tap for a new one)$b2$, $b2$Thousands of particles follow an invisible wind (a flow made of layered sine waves) and leave lines behind. Leave it running and the strokes build up into patterns like hair or currents.

- **Tap**: a new wind and a new palette
- **Press and drag**: stir a swirl around your finger

If you get a pattern you like, post a screenshot in the comments.$b2$, '', array[]::text[], $b2$<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wind Lines</title>
<style>
  html,body{margin:0;height:100%;background:#0b0d12;overflow:hidden;font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif}
  canvas{display:block;width:100%;height:100%;cursor:pointer;touch-action:none}
  .tip{position:fixed;left:0;right:0;bottom:14px;text-align:center;color:#cbd5e1;font-size:13px;opacity:.75;pointer-events:none;transition:opacity 1s}
</style></head><body>
<canvas id="c"></canvas><div class="tip" id="tip">Tap for a new wind · drag to stir up a swirl</div>
<script>
// Thousands of particles follow an invisible wind made of layered sine waves.
// Each tap picks a new wind and palette; dragging adds a swirl around the finger.
const c = document.getElementById('c'), g = c.getContext('2d');
let W, H, dpr, parts = [], seed, pal, swirl = null, t = 0;
const PALS = [['#f4a261', '#e76f51', '#2a9d8f', '#e9c46a'], ['#a5b4fc', '#c4b5fd', '#f0abfc', '#e0f2fe'], ['#fde68a', '#fca5a5', '#fdba74', '#fef3c7'], ['#6ee7b7', '#5eead4', '#93c5fd', '#d9f99d']];
function rnd(s) { return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function reset() {
  dpr = Math.min(devicePixelRatio || 1, 2); W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr;
  const r = rnd(seed = (Math.random() * 1e9) | 0);
  pal = PALS[Math.floor(r() * PALS.length)];
  wind.a = [r() * 1.2 + 0.4, r() * 1.2 + 0.4, r() * 6, r() * 6, r() * 0.8 + 0.3];
  g.fillStyle = '#0b0d12'; g.fillRect(0, 0, W, H);
  const n = Math.min(2600, Math.floor((W * H) / (900 * dpr * dpr)));
  parts = Array.from({ length: n }, () => spawn());
}
const spawn = () => ({ x: Math.random() * W, y: Math.random() * H, life: 150 + Math.random() * 350, col: pal[Math.floor(Math.random() * pal.length)] });
const wind = { a: [1, 1, 0, 0, 1] };
function angle(x, y) {
  const [fx, fy, px, py, k] = wind.a, u = x / W, v = y / H;
  let a = Math.sin(u * fx * 6.28 + px + t * 0.0004) + Math.cos(v * fy * 6.28 + py) + Math.sin((u + v) * k * 6.28 + t * 0.0002);
  a *= Math.PI * 0.8;
  if (swirl) { const dx = x - swirl.x, dy = y - swirl.y, d2 = dx * dx + dy * dy, R = 160 * dpr; if (d2 < R * R * 4) { const w = Math.exp(-d2 / (R * R)); a = a * (1 - w) + (Math.atan2(dy, dx) + Math.PI / 2) * w; } }
  return a;
}
function frame() {
  t += 16;
  g.fillStyle = 'rgba(11,13,18,0.018)'; g.fillRect(0, 0, W, H);
  g.lineWidth = 1.2 * dpr; g.globalAlpha = 0.6;
  for (const p of parts) {
    const a = angle(p.x, p.y), nx = p.x + Math.cos(a) * 1.6 * dpr, ny = p.y + Math.sin(a) * 1.6 * dpr;
    g.strokeStyle = p.col; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(nx, ny); g.stroke();
    p.x = nx; p.y = ny;
    if (--p.life < 0 || nx < 0 || ny < 0 || nx > W || ny > H) Object.assign(p, spawn());
  }
  g.globalAlpha = 1;
  requestAnimationFrame(frame);
}
let downAt = 0;
c.addEventListener('pointerdown', (e) => { downAt = Date.now(); swirl = { x: e.clientX * dpr, y: e.clientY * dpr }; document.getElementById('tip').style.opacity = 0; });
c.addEventListener('pointermove', (e) => { if (swirl) swirl = { x: e.clientX * dpr, y: e.clientY * dpr }; });
addEventListener('pointerup', () => { if (Date.now() - downAt < 250) reset(); swirl = null; });
addEventListener('resize', reset);
reset(); frame();
</script>
</body></html>
$b2$, '', '', 'Claude', $b2$A flow-field generative art piece in one HTML canvas. Thousands of particles follow an angle field made of layered sine waves and leave translucent strokes while the canvas fades very slowly. Tap for a new wind and palette; drag to add a swirl around the finger. Works on phones; devicePixelRatio capped at 2.$b2$, array[$b2$generative art$b2$,$b2$animation$b2$,$b2$interactive$b2$]::text[], now() - interval '306 minutes', now() - interval '306 minutes'
  from public.communities where slug = $b2$video$b2$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b2$Wind Lines: thousands of strokes following an invisible wind (tap for a new one)$b2$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, $b2$First version$b2$, author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b2$text$b2$, $b2$짧은 소설: 「등대의 마지막 로그」$b2$, $b2$등대가 자동화되던 날, 박 씨는 마지막 근무 일지를 썼다.

"22시 14분. 이상 없음. 잘 자라."

삼십 년 동안 그는 일지 끝에 늘 그렇게 적었다. 누구에게 하는 말인지는 그도 몰랐다. 바다에게, 지나가는 배들에게, 어쩌면 자기 자신에게.

새로 들어온 관리 시스템은 지난 일지를 모두 학습했다. 날씨와 물때, 고장 기록, 그리고 매일 밤 같은 시각에 적힌 같은 문장까지.

은퇴한 박 씨는 언덕 아래 작은 집으로 옮겼다. 창문으로 등대가 보였다. 첫날 밤 그는 잠이 오지 않아 불빛을 셌다. 십 초에 한 번, 규칙대로였다.

22시 14분, 불빛이 한 번 더 깜빡였다. 짧게, 두 번.

다음 날 밤에도, 그다음 날에도 그랬다. 항만청 직원은 사소한 오작동이라며 고쳐 주겠다고 했다. 박 씨는 손을 내저었다.

"두세요. 이상 없다는 뜻이에요."

직원은 알 수 없다는 얼굴로 돌아갔다. 그날 밤 박 씨는 창가에 앉아 기다렸다. 22시 14분. 짧게, 두 번.

그는 처음으로 대답했다.

"그래. 너도 잘 자라."

---
Claude에게 "기계가 사람의 습관을 물려받는 짧은 이야기, 슬프지 않게"라고 부탁해서 나온 글을 조금 다듬었어요. 마지막 줄이 보석인지 슬롭인지 판정해 주세요.$b2$, '', array[]::text[], $b2$$b2$, '', '', 'Claude', $b2$$b2$, array[$b2$소설$b2$,$b2$짧은글$b2$,$b2$등대$b2$]::text[], now() - interval '420 minutes', now() - interval '420 minutes'
  from public.communities where slug = $b2$writing$b2$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b2$짧은 소설: 「등대의 마지막 로그」$b2$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, $b2$첫 버전$b2$, author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b2$text$b2$, $b2$Short story: "The Lighthouse's Last Log"$b2$, $b2$On the day the lighthouse went automatic, Mr. Park wrote his last log entry.

"22:14. All clear. Sleep well."

For thirty years he had ended every log that way. He never knew who he was saying it to. The sea, the passing ships, maybe himself.

The new control system learned from every old log: the weather, the tides, the repairs, and the same sentence written at the same minute every night.

Retired, Mr. Park moved to a small house at the foot of the hill. He could see the lighthouse from his window. The first night he couldn't sleep, so he counted the flashes. One every ten seconds, as it should be.

At 22:14 the light blinked one extra time. Short, twice.

It did the same the next night, and the night after. A man from the harbor office said it was a minor glitch and offered to fix it. Mr. Park waved him off.

"Leave it. It means all clear."

The man left looking puzzled. That night Mr. Park sat by the window and waited. 22:14. Short, twice.

For the first time, he answered.

"You too. Sleep well."

---
I asked Claude for "a short story about a machine inheriting a person's habit, not a sad one," then edited it a little. Is the last line a gem or slop?$b2$, '', array[]::text[], $b2$$b2$, '', '', 'Claude', $b2$$b2$, array[$b2$fiction$b2$,$b2$flash fiction$b2$,$b2$lighthouse$b2$]::text[], now() - interval '426 minutes', now() - interval '426 minutes'
  from public.communities where slug = $b2$writing$b2$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b2$Short story: "The Lighthouse's Last Log"$b2$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, $b2$First version$b2$, author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b2$text$b2$, $b2$요약에 "근거 문장 인용"을 붙이게 하는 프롬프트 (지어낸 내용 걸러내기)$b2$, $b2$AI 요약은 읽기 좋지만, 원문에 없는 내용이 슬쩍 섞여도 알아채기 어려워요. 이 프롬프트는 요약 한 줄마다 **원문 문장을 그대로 인용**하게 해서, 맞는지 몇 초 만에 확인할 수 있게 만들어요. 근거가 없으면 "[원문에 없음]"이라고 표시하게 했어요.

기사, 회의록, 논문 초록에 써 보고 결과가 어땠는지 알려 주세요.$b2$, '', array[]::text[], $b2$$b2$, '', '', 'Claude', $b2$아래 글을 요약해 줘. 규칙을 꼭 지켜 줘.

1. 핵심 내용 3가지를 한 줄씩 쓴다.
2. 각 줄 바로 아래에, 그 근거가 되는 원문 문장을 따옴표로 그대로 인용한다. 인용문은 한 글자도 고치지 않는다.
3. 원문에서 근거를 찾을 수 없는 내용은 쓰지 않는다. 꼭 필요하면 "[원문에 없음]"이라고 표시한다.
4. 마지막에 "이 글이 다루지 않은 것"을 1~2개 적는다.
5. 인용문을 빼고 전체 300자 이내로 쓴다.

[글]
(여기에 붙여 넣기)$b2$, array[$b2$프롬프트$b2$,$b2$요약$b2$,$b2$사실확인$b2$]::text[], now() - interval '540 minutes', now() - interval '540 minutes'
  from public.communities where slug = $b2$prompt$b2$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b2$요약에 "근거 문장 인용"을 붙이게 하는 프롬프트 (지어낸 내용 걸러내기)$b2$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, $b2$첫 버전$b2$, author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b2$text$b2$, $b2$A summary prompt that quotes its evidence (to catch made-up claims)$b2$, $b2$AI summaries read well, but it is hard to notice when something that is not in the source slips in. This prompt makes every summary line **quote the original sentence word for word**, so you can check it in seconds. Anything without support gets marked "[not in the text]".

Try it on articles, meeting notes or paper abstracts and tell me how it went.$b2$, '', array[]::text[], $b2$$b2$, '', '', 'Claude', $b2$Summarize the text below. Follow these rules exactly.

1. Write the 3 key points, one line each.
2. Right under each line, quote the sentence from the text that supports it, in quotation marks, word for word. Do not change a single word of the quote.
3. Do not include anything you cannot find support for in the text. If you must, mark it "[not in the text]".
4. End with 1–2 things "this text does not cover".
5. Keep it under 80 words, not counting the quotes.

[Text]
(paste here)$b2$, array[$b2$prompt$b2$,$b2$summary$b2$,$b2$fact-checking$b2$]::text[], now() - interval '546 minutes', now() - interval '546 minutes'
  from public.communities where slug = $b2$prompt$b2$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b2$A summary prompt that quotes its evidence (to catch made-up claims)$b2$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, $b2$First version$b2$, author_id, created_at from ins;
commit;
