-- batch 1: two communities and 15 posts by the site owner
begin;
insert into public.communities (slug, name, description, default_kind, creator_id) values ($b1$study$b1$, $b1$공부·학습$b1$, $b1$AI로 만든 학습 자료, 퀴즈, 요약, 설명. 진짜 이해에 도움이 됐는지 판정해요.$b1$, $b1$text$b1$, 'cd9c3016-053a-444e-a6b2-0fdca194f213') on conflict (slug) do nothing;
insert into public.community_members (community_id, user_id, role) select id, 'cd9c3016-053a-444e-a6b2-0fdca194f213', 'mod' from public.communities where slug = $b1$study$b1$ on conflict (community_id, user_id) do update set role = 'mod';
insert into public.communities (slug, name, description, default_kind, creator_id) values ($b1$work-tools$b1$, $b1$업무·생활 도구$b1$, $b1$회사와 일상에서 바로 쓸 수 있는 AI 도구와 자동화. 매일 쓸 만한지가 기준이에요.$b1$, $b1$html$b1$, 'cd9c3016-053a-444e-a6b2-0fdca194f213') on conflict (slug) do nothing;
insert into public.community_members (community_id, user_id, role) select id, 'cd9c3016-053a-444e-a6b2-0fdca194f213', 'mod' from public.communities where slug = $b1$work-tools$b1$ on conflict (community_id, user_id) do update set role = 'mod';
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$html$b1$, $b1$레시피 인분 계산기: 재료 목록 붙여 넣으면 숫자만 골라 바꿔 줘요$b1$, $b1$레시피를 통째로 붙여 넣고 "2인분 → 5인분"처럼 바꾸면, 줄마다 숫자만 찾아 비율대로 바꿔요. "1/2개", "1.5큰술", "반 큰술"도 알아들어요.

**써 보고 알려 주세요**: "약간", "한 꼬집" 같은 표현은 어떻게 처리하면 좋을까요?$b1$, '', array[]::text[], $b1$<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>레시피 인분 계산기</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif;background:#fffaf2;color:#2b2118;padding:20px}
  .app{max-width:720px;margin:0 auto;display:grid;gap:14px}
  h1{margin:0;font-size:22px}
  .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  label{font-size:14px;color:#6b5a48}
  input[type=number]{width:80px;padding:8px;border:1px solid #e4d5c2;border-radius:8px;font-size:16px}
  textarea{width:100%;min-height:170px;padding:10px;border:1px solid #e4d5c2;border-radius:10px;font-size:15px;line-height:1.6;font-family:inherit}
  .out{background:#fff;border:1px solid #e4d5c2;border-radius:10px;padding:12px 14px;line-height:1.9;white-space:pre-wrap}
  .out b{color:#c2410c}
  .hint{font-size:13px;color:#8a7a68}
</style></head><body>
<div class="app">
  <h1>레시피 인분 계산기</h1>
  <p class="hint">재료를 한 줄에 하나씩 붙여 넣고 인분을 바꾸면, 숫자만 골라서 비율대로 바꿔 줘요. "1/2", "1.5", "반 개" 같은 표현도 알아들어요.</p>
  <div class="row"><label>원래 <input id="from" type="number" min="1" value="2"> 인분</label><span>→</span><label><input id="to" type="number" min="1" value="5"> 인분</label></div>
  <textarea id="src">돼지고기 앞다리살 300g
감자 2개
양파 1/2개
고추장 1.5큰술
간장 2큰술
설탕 1작은술
다진 마늘 반 큰술
물 400ml</textarea>
  <div class="out" id="out"></div>
</div>
<script>
  const $ = (id) => document.getElementById(id);
  const WORD = { '반': 0.5, '한': 1, '두': 2, '세': 3, '네': 4 };
  function fmt(n) {
    if (Math.abs(n - Math.round(n)) < 0.05) return String(Math.round(n));
    const frac = [[0.25, '1/4'], [0.33, '1/3'], [0.5, '1/2'], [0.67, '2/3'], [0.75, '3/4']];
    const whole = Math.floor(n), rest = n - whole, hit = frac.find(([v]) => Math.abs(rest - v) < 0.04);
    if (hit) return (whole ? whole + ' ' : '') + hit[1];
    return n.toFixed(1).replace(/\.0$/, '');
  }
  function scaleLine(line, k) {
    let done = false;
    line = line.replace(/(\d+)\s*\/\s*(\d+)|\d+(?:\.\d+)?/, (m, a, b) => { done = true; const v = a ? a / b : parseFloat(m); return '<b>' + fmt(v * k) + '</b>'; });
    if (!done) line = line.replace(/(반|한|두|세|네)\s*(?=(개|큰술|작은술|컵|줌|쪽|모))/, (m, w) => '<b>' + fmt(WORD[w] * k) + '</b> ');
    return line;
  }
  function run() {
    const k = (+$('to').value || 1) / (+$('from').value || 1);
    $('out').innerHTML = $('src').value.split('\n').filter((l) => l.trim()).map((l) => scaleLine(l.replace(/[<>&]/g, ''), k)).join('\n') || '재료를 넣어 주세요';
  }
  ['from', 'to', 'src'].forEach((id) => $(id).addEventListener('input', run)); run();
</script>
</body></html>
$b1$, $b1$$b1$, $b1$$b1$, $b1$Claude$b1$, $b1$레시피 재료 목록을 붙여 넣으면 인분에 맞춰 숫자만 비율대로 바꿔 주는 단일 HTML. 분수(1/2), 소수, "반 개" 같은 한국어 표현 처리. 결과 숫자는 강조.$b1$, array[$b1$요리$b1$,$b1$계산기$b1$,$b1$생활$b1$]::text[], now() - interval '1 hours', now() - interval '1 hours'
  from public.communities where slug = $b1$work-tools$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$레시피 인분 계산기: 재료 목록 붙여 넣으면 숫자만 골라 바꿔 줘요$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$html$b1$, $b1$글자색 대비 검사기 + "통과하는 가장 가까운 색" 찾기 버튼$b1$, $b1$글자색과 배경색을 고르면 웹 접근성 기준(WCAG) 대비율을 바로 계산해요. 미달이면 **지금 색에서 가장 덜 바뀌는 통과 색**을 찾아 줘요.

디자이너가 "이 회색 좀만 진하게"를 숫자로 확인할 때 쓰기 좋아요.$b1$, '', array[]::text[], $b1$<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>글자색 대비 검사기</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif;background:#f4f5f7;color:#111;padding:20px}
  .app{max-width:640px;margin:0 auto;display:grid;gap:16px}
  h1{margin:0;font-size:22px}
  .pick{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .pick label{display:flex;flex-direction:column;gap:6px;font-size:14px}
  .pick input[type=color]{width:100%;height:48px;border:0;border-radius:10px;padding:0;background:none}
  .pick input[type=text]{padding:8px;border:1px solid #ccd;border-radius:8px;font-family:ui-monospace,monospace}
  .sample{border-radius:14px;padding:22px;display:grid;gap:8px}
  .big{font-size:28px;font-weight:700}
  .ratio{font-size:44px;font-weight:800;font-variant-numeric:tabular-nums}
  .badges{display:flex;gap:8px;flex-wrap:wrap}
  .b{padding:5px 10px;border-radius:999px;font-size:13px;font-weight:700}
  .ok{background:#d1fae5;color:#065f46}.no{background:#fee2e2;color:#991b1b}
  button{border:1px solid #ccd;background:#fff;border-radius:999px;padding:8px 14px;cursor:pointer}
</style></head><body>
<div class="app">
  <h1>글자색 대비 검사기</h1>
  <div class="pick">
    <label>글자색 <input type="color" id="fg" value="#6b7280"><input type="text" id="fgT" value="#6b7280"></label>
    <label>배경색 <input type="color" id="bg" value="#ffffff"><input type="text" id="bgT" value="#ffffff"></label>
  </div>
  <div class="sample" id="sample"><div class="big">큰 제목은 이렇게 보여요</div><div>본문 글자는 이렇게 보여요. 작은 글씨일수록 대비가 더 커야 읽기 편해요.</div></div>
  <div><div class="ratio" id="ratio"></div><div class="badges" id="badges"></div></div>
  <div><button id="swap">색 바꾸기</button> <button id="fix">통과하는 가장 가까운 글자색 찾기</button></div>
</div>
<script>
  const $ = (id) => document.getElementById(id);
  const hex = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const toHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const lum = (rgb) => { const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  function draw() {
    const fg = hex($('fg').value), bg = hex($('bg').value), r = ratio(fg, bg);
    $('sample').style.color = $('fg').value; $('sample').style.background = $('bg').value;
    $('ratio').textContent = r.toFixed(2) + ' : 1';
    const t = [['본문 AA', 4.5], ['본문 AAA', 7], ['큰 글자 AA', 3], ['큰 글자 AAA', 4.5]];
    $('badges').innerHTML = t.map(([n, need]) => `<span class="b ${r >= need ? 'ok' : 'no'}">${n} ${r >= need ? '통과' : '미달'}</span>`).join('');
  }
  const sync = (c, t) => { $(c).oninput = () => { $(t).value = $(c).value; draw(); }; $(t).onchange = () => { if (/^#?[0-9a-f]{3,6}$/i.test($(t).value)) { $(c).value = toHex(hex($(t).value)); draw(); } }; };
  sync('fg', 'fgT'); sync('bg', 'bgT');
  $('swap').onclick = () => { const a = $('fg').value; $('fg').value = $('bg').value; $('bg').value = a; $('fgT').value = $('fg').value; $('bgT').value = $('bg').value; draw(); };
  $('fix').onclick = () => {
    const bg = hex($('bg').value), fg = hex($('fg').value), dark = lum(bg) > 0.5;
    for (let s = 0; s <= 1; s += 0.01) { const c = fg.map((v) => v + ((dark ? 0 : 255) - v) * s); if (ratio(c, bg) >= 4.5) { $('fg').value = toHex(c); $('fgT').value = $('fg').value; break; } }
    draw();
  };
  draw();
</script>
</body></html>
$b1$, $b1$$b1$, $b1$$b1$, $b1$Claude$b1$, $b1$두 색의 WCAG 대비율을 계산하고 AA/AAA 통과 여부를 보여 주는 단일 HTML. 미달이면 글자색을 배경 반대 방향으로 조금씩 옮겨 4.5:1을 넘는 가장 가까운 색을 찾는 버튼.$b1$, array[$b1$디자인$b1$,$b1$접근성$b1$,$b1$도구$b1$]::text[], now() - interval '3 hours', now() - interval '3 hours'
  from public.communities where slug = $b1$web$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$글자색 대비 검사기 + "통과하는 가장 가까운 색" 찾기 버튼$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$html$b1$, $b1$짝 맞추기 기억력 게임 (난이도 3단계, 최고 기록 저장)$b1$, $b1$카드를 두 장씩 뒤집어 같은 그림을 찾는 고전 게임이에요. 쉬움·보통·어려움이 있고 난이도별 최소 시도 횟수를 기억해요.

휴대폰에서도 잘 돼요. 기록 자랑 환영해요.$b1$, '', array[]::text[], $b1$<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>짝 맞추기</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#1e1b4b;color:#eef;font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif;padding:16px}
  .app{width:min(440px,100%);display:grid;gap:12px;text-align:center}
  h1{margin:0;font-size:22px}
  .stat{display:flex;justify-content:center;gap:18px;font-variant-numeric:tabular-nums;color:#c7d2fe}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .card{aspect-ratio:1;border:0;border-radius:12px;font-size:clamp(26px,9vw,40px);cursor:pointer;background:#4338ca;color:transparent;transition:transform .25s,background .25s}
  .card.open,.card.done{background:#eef2ff;color:#111;transform:rotateY(180deg)}
  .card.done{background:#a7f3d0;cursor:default}
  button.again{border:0;border-radius:999px;padding:10px 18px;font-weight:700;background:#fbbf24;color:#111;cursor:pointer}
  .sel{display:flex;gap:6px;justify-content:center}
  .sel button{border:1px solid #6366f1;background:none;color:#c7d2fe;border-radius:999px;padding:5px 12px;cursor:pointer}
  .sel button[aria-pressed="true"]{background:#6366f1;color:#fff}
</style></head><body>
<div class="app">
  <h1>짝 맞추기</h1>
  <div class="sel"><button data-n="6">쉬움</button><button data-n="8" aria-pressed="true">보통</button><button data-n="10">어려움</button></div>
  <div class="stat"><span>시도 <b id="moves">0</b></span><span>시간 <b id="time">0</b>초</span><span>최고 <b id="best">-</b></span></div>
  <div class="grid" id="grid"></div>
  <div id="msg"></div>
</div>
<script>
  const ICONS = ['🍙', '🧋', '🐧', '🌵', '🎧', '🪐', '🦊', '🍋', '🧩', '🚲', '🐙', '🌈'];
  let pairs = 8, open = [], moves = 0, matched = 0, t0 = 0, timer = null, lock = false;
  const $ = (id) => document.getElementById(id);
  const bestKey = () => 'pairs-best-' + pairs;
  function start() {
    clearInterval(timer); open = []; moves = 0; matched = 0; t0 = 0; lock = false;
    $('moves').textContent = 0; $('time').textContent = 0; $('msg').innerHTML = '';
    try { $('best').textContent = localStorage.getItem(bestKey()) || '-'; } catch { $('best').textContent = '-'; }
    const deck = ICONS.slice(0, pairs).flatMap((x) => [x, x]).sort(() => Math.random() - 0.5);
    $('grid').style.gridTemplateColumns = `repeat(${pairs > 8 ? 5 : 4},1fr)`;
    $('grid').innerHTML = deck.map((x, i) => `<button class="card" data-i="${i}" data-v="${x}" aria-label="카드">${x}</button>`).join('');
  }
  $('grid').onclick = (e) => {
    const c = e.target.closest('.card'); if (!c || lock || c.classList.contains('open') || c.classList.contains('done')) return;
    if (!t0) { t0 = Date.now(); timer = setInterval(() => ($('time').textContent = Math.floor((Date.now() - t0) / 1000)), 250); }
    c.classList.add('open'); open.push(c);
    if (open.length < 2) return;
    moves++; $('moves').textContent = moves; lock = true;
    const [a, b] = open;
    setTimeout(() => {
      if (a.dataset.v === b.dataset.v) { a.classList.add('done'); b.classList.add('done'); matched++; } else { a.classList.remove('open'); b.classList.remove('open'); }
      open = []; lock = false;
      if (matched === pairs) {
        clearInterval(timer); const s = Math.floor((Date.now() - t0) / 1000);
        let best = null; try { best = +localStorage.getItem(bestKey()) || null; if (!best || moves < best) localStorage.setItem(bestKey(), moves); } catch { /* */ }
        $('msg').innerHTML = `<p>${moves}번 만에 ${s}초 걸렸어요!${best && moves < best ? ' 최고 기록이에요 🎉' : ''}</p><button class="again">다시 하기</button>`;
        $('msg').querySelector('button').onclick = start;
      }
    }, a.dataset.v === b.dataset.v ? 250 : 700);
  };
  document.querySelectorAll('.sel button').forEach((b) => (b.onclick = () => { pairs = +b.dataset.n; document.querySelectorAll('.sel button').forEach((x) => x.setAttribute('aria-pressed', x === b)); start(); }));
  start();
</script>
</body></html>
$b1$, $b1$$b1$, $b1$$b1$, $b1$Claude$b1$, $b1$이모지 카드 짝 맞추기 게임 단일 HTML. 난이도 3단계(6/8/10쌍), 시도 횟수와 시간, 난이도별 최고 기록 localStorage 저장, 모바일 터치 대응.$b1$, array[$b1$캐주얼$b1$,$b1$기억력$b1$,$b1$모바일$b1$]::text[], now() - interval '5 hours', now() - interval '5 hours'
  from public.communities where slug = $b1$game$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$짝 맞추기 기억력 게임 (난이도 3단계, 최고 기록 저장)$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$html$b1$, $b1$반응속도 테스트: 초록색이 되는 순간 누르세요$b1$, $b1$빨간 화면이 초록으로 바뀌는 순간 누르면 반응 시간을 ms 단위로 재요. 너무 빨리 누르면 실격, 최근 5번 평균과 최고 기록을 보여 줘요. 스페이스바도 돼요.

평균 몇 ms 나오세요?$b1$, '', array[]::text[], $b1$<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>반응속도 테스트</title>
<style>
  html,body{margin:0;height:100%;font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif}
  #pad{height:100%;display:grid;place-items:center;text-align:center;color:#fff;cursor:pointer;user-select:none;transition:background .1s;padding:20px;box-sizing:border-box}
  .wait{background:#334155}.ready{background:#b91c1c}.go{background:#15803d}.result{background:#1d4ed8}
  h1{font-size:clamp(28px,7vw,52px);margin:0 0 10px} p{margin:4px 0;font-size:18px;opacity:.9}
  .hist{font-variant-numeric:tabular-nums;font-size:15px;opacity:.85}
</style></head><body>
<div id="pad" class="wait"><div><h1>반응속도 테스트</h1><p>화면을 누르면 시작해요.</p><p>빨간색이 초록색으로 바뀌는 순간 최대한 빨리 누르세요.</p></div></div>
<script>
  const pad = document.getElementById('pad'); let state = 'wait', t = 0, timer = null; const hist = [];
  const show = (cls, html) => { pad.className = cls; pad.innerHTML = '<div>' + html + '</div>'; };
  const summary = () => hist.length ? `<p class="hist">최근 ${hist.length}번 평균 ${Math.round(hist.reduce((a, b) => a + b, 0) / hist.length)}ms · 최고 ${Math.min(...hist)}ms</p>` : '';
  function down() {
    if (state === 'wait' || state === 'result' || state === 'early') {
      state = 'ready'; show('ready', '<h1>기다리세요…</h1><p>초록색이 되면 누르세요</p>');
      timer = setTimeout(() => { state = 'go'; t = performance.now(); show('go', '<h1>지금!</h1>'); }, 1200 + Math.random() * 2800);
    } else if (state === 'ready') {
      clearTimeout(timer); state = 'early'; show('wait', '<h1>너무 빨랐어요!</h1><p>초록색이 될 때까지 기다려 주세요. 다시 누르면 시작해요.</p>' + summary());
    } else if (state === 'go') {
      const ms = Math.round(performance.now() - t); hist.push(ms); if (hist.length > 5) hist.shift(); state = 'result';
      const verdict = ms < 200 ? '프로게이머급이에요' : ms < 260 ? '평균보다 빨라요' : ms < 330 ? '평균 정도예요' : '조금 졸리신가요?';
      show('result', `<h1>${ms}ms</h1><p>${verdict}</p>${summary()}<p>다시 하려면 누르세요</p>`);
    }
  }
  pad.addEventListener('pointerdown', down);
  addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); down(); } });
</script>
</body></html>
$b1$, $b1$$b1$, $b1$$b1$, $b1$Claude$b1$, $b1$반응속도 테스트 단일 HTML. 대기(회색) → 준비(빨강, 1.2~4초 랜덤) → 초록에서 클릭 시간 측정, 너무 빠르면 실격, 최근 5회 평균·최고, 스페이스바 지원.$b1$, array[$b1$테스트$b1$,$b1$캐주얼$b1$]::text[], now() - interval '8 hours', now() - interval '8 hours'
  from public.communities where slug = $b1$game$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$반응속도 테스트: 초록색이 되는 순간 누르세요$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$html$b1$, $b1$16스텝 드럼 머신: 녹음 파일 없이 브라우저에서 바로 합성$b1$, $b1$킥·스네어·하이햇·박수 4줄 × 16칸. 칸을 눌러 박자를 찍고 재생하면 돼요. 소리는 모두 Web Audio로 그 자리에서 만들어요(샘플 파일 0개).

패턴 3개가 들어 있어요. 괜찮은 패턴 만들면 스크린샷 올려 주세요.$b1$, '', array[]::text[], $b1$<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>16스텝 드럼 머신</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;background:#111827;color:#e5e7eb;font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif;padding:18px;display:grid;place-items:center}
  .app{width:min(760px,100%);display:grid;gap:12px}
  h1{margin:0;font-size:20px}
  .bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  button{border:0;border-radius:999px;padding:9px 16px;font-weight:700;cursor:pointer;background:#374151;color:#e5e7eb}
  button.play{background:#f59e0b;color:#111}
  .grid{display:grid;grid-template-columns:70px repeat(16,1fr);gap:4px;align-items:center}
  .name{font-size:13px;color:#9ca3af}
  .cell{aspect-ratio:1;border-radius:5px;background:#1f2937;border:1px solid #374151;cursor:pointer;padding:0}
  .cell:nth-child(4n+2){border-color:#4b5563}
  .cell.on{background:#f59e0b;border-color:#f59e0b}
  .cell.now{outline:2px solid #fff}
  input[type=range]{width:140px}
</style></head><body>
<div class="app">
  <h1>16스텝 드럼 머신</h1>
  <div class="bar"><button class="play" id="play">▶ 재생</button><label>템포 <input type="range" id="bpm" min="70" max="160" value="96"> <span id="bpmV">96</span></label>
    <button id="pat">패턴 바꾸기</button><button id="clear">지우기</button></div>
  <div class="grid" id="grid"></div>
  <p style="font-size:13px;color:#9ca3af;margin:0">칸을 눌러 박자를 켜고 끄세요. 소리는 녹음 파일 없이 브라우저에서 바로 합성해요.</p>
</div>
<script>
  const ROWS = ['킥', '스네어', '하이햇', '박수'];
  const PATS = [
    ['x...x...x...x...', '....x.......x...', 'x.x.x.x.x.x.x.x.', '................'],
    ['x.....x...x.....', '....x.......x..x', '.xxx.xxx.xxx.xxx', '............x...'],
    ['x..x..x...x..x..', '....x.......x...', 'xxxxxxxxxxxxxxxx', '....x.......x...'],
  ];
  let grid = PATS[0].map((r) => [...r].map((c) => c === 'x')), pat = 0, ctx, step = 0, timer = null, noise;
  const $ = (id) => document.getElementById(id);
  function drawGrid() {
    $('grid').innerHTML = ROWS.map((n, r) => `<span class="name">${n}</span>` + grid[r].map((on, i) => `<button class="cell${on ? ' on' : ''}" data-r="${r}" data-i="${i}" aria-label="${n} ${i + 1}"></button>`).join('')).join('');
  }
  $('grid').onclick = (e) => { const c = e.target.closest('.cell'); if (!c) return; const r = +c.dataset.r, i = +c.dataset.i; grid[r][i] = !grid[r][i]; c.classList.toggle('on'); };
  function setup() {
    ctx = new AudioContext();
    const len = ctx.sampleRate, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; noise = buf;
  }
  function hit(r, t) {
    const g = ctx.createGain(); g.connect(ctx.destination);
    if (r === 0) { const o = ctx.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(g); o.start(t); o.stop(t + 0.3); return; }
    const s = ctx.createBufferSource(); s.buffer = noise; const f = ctx.createBiquadFilter();
    if (r === 1) { f.type = 'bandpass'; f.frequency.value = 1800; g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); }
    if (r === 2) { f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05); }
    if (r === 3) { f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 3; g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12); }
    s.connect(f); f.connect(g); s.start(t); s.stop(t + 0.3);
  }
  function tick() {
    const t = ctx.currentTime + 0.02;
    grid.forEach((row, r) => { if (row[step]) hit(r, t); });
    document.querySelectorAll('.cell.now').forEach((c) => c.classList.remove('now'));
    document.querySelectorAll(`.cell[data-i="${step}"]`).forEach((c) => c.classList.add('now'));
    step = (step + 1) % 16;
    timer = setTimeout(tick, 60000 / +$('bpm').value / 4);
  }
  $('play').onclick = async () => {
    if (!ctx) setup();
    if (timer) { clearTimeout(timer); timer = null; $('play').textContent = '▶ 재생'; return; }
    await ctx.resume(); step = 0; tick(); $('play').textContent = '■ 정지';
  };
  $('bpm').oninput = () => ($('bpmV').textContent = $('bpm').value);
  $('pat').onclick = () => { pat = (pat + 1) % PATS.length; grid = PATS[pat].map((r) => [...r].map((c) => c === 'x')); drawGrid(); };
  $('clear').onclick = () => { grid = grid.map((r) => r.map(() => false)); drawGrid(); };
  drawGrid();
</script>
</body></html>
$b1$, $b1$$b1$, $b1$$b1$, $b1$Claude$b1$, $b1$Web Audio만으로 킥/스네어/하이햇/박수를 합성하는 16스텝 드럼 머신 단일 HTML. 템포 슬라이더, 패턴 프리셋 3개, 지우기, 현재 스텝 표시.$b1$, array[$b1$webaudio$b1$,$b1$비트$b1$,$b1$악기$b1$]::text[], now() - interval '11 hours', now() - interval '11 hours'
  from public.communities where slug = $b1$music$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$16스텝 드럼 머신: 녹음 파일 없이 브라우저에서 바로 합성$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$html$b1$, $b1$끝나지 않는 밤하늘 불꽃놀이 (누르면 그 자리로 쏘아 올려요)$b1$, $b1$캔버스로 매 프레임 그리는 불꽃놀이예요. 가만히 두면 알아서 터지고, 화면을 누르면 그 위치로 불꽃이 올라가요. 가끔 고리 모양도 나와요.$b1$, '', array[]::text[], $b1$<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>밤하늘 불꽃놀이</title>
<style>
  html,body{margin:0;height:100%;background:#020617;overflow:hidden;font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif}
  canvas{display:block;width:100%;height:100%}
  .cap{position:fixed;left:14px;bottom:12px;color:#64748b;font-size:13px}
</style></head><body>
<canvas id="c"></canvas><div class="cap">화면을 누르면 그 자리로 불꽃이 올라가요. 가만히 두면 알아서 터져요.</div>
<script>
  const c = document.getElementById('c'), g = c.getContext('2d'); let W, H, dpr;
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr; };
  addEventListener('resize', size); size();
  const rockets = [], sparks = [], stars = Array.from({ length: 120 }, () => [Math.random(), Math.random() * 0.7, Math.random() * 1.2]);
  const rnd = (a, b) => a + Math.random() * (b - a);
  function launch(tx, ty) { rockets.push({ x: tx ?? rnd(0.15, 0.85) * W, y: H, ty: ty ?? rnd(0.15, 0.45) * H, hue: rnd(0, 360), v: rnd(9, 13) * dpr }); }
  function burst(r) {
    const n = 90, shape = Math.random() < 0.3 ? 'ring' : 'ball';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, sp = (shape === 'ring' ? 4.2 : rnd(1, 5)) * dpr;
      sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rnd(60, 95), max: 95, hue: r.hue + rnd(-20, 20) });
    }
  }
  c.addEventListener('pointerdown', (e) => launch(e.clientX * dpr, e.clientY * dpr));
  let last = 0;
  function frame(t) {
    g.fillStyle = 'rgba(2,6,23,0.22)'; g.fillRect(0, 0, W, H);
    for (const [x, y, s] of stars) { g.fillStyle = `rgba(226,232,240,${0.3 + 0.3 * Math.sin(t / 700 + x * 40)})`; g.fillRect(x * W, y * H, s * dpr, s * dpr); }
    if (t - last > 900 && rockets.length < 3) { launch(); last = t; }
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i]; r.y -= r.v; r.v *= 0.985;
      g.fillStyle = `hsl(${r.hue} 100% 75%)`; g.fillRect(r.x - dpr, r.y, 2 * dpr, 6 * dpr);
      if (r.y <= r.ty || r.v < 2) { burst(r); rockets.splice(i, 1); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vx *= 0.97; s.vy = s.vy * 0.97 + 0.06 * dpr; s.life--;
      g.fillStyle = `hsla(${s.hue} 100% ${55 + 20 * (s.life / s.max)}% / ${s.life / s.max})`;
      g.beginPath(); g.arc(s.x, s.y, 1.8 * dpr, 0, 7); g.fill();
      if (s.life <= 0) sparks.splice(i, 1);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
</script>
</body></html>
$b1$, $b1$$b1$, $b1$$b1$, $b1$Claude$b1$, $b1$캔버스 2D 불꽃놀이 무한 애니메이션 단일 HTML. 자동 발사 + 클릭 위치로 발사, 구형/고리형 폭발, 잔상 효과, 반짝이는 별 배경.$b1$, array[$b1$애니메이션$b1$,$b1$캔버스$b1$,$b1$힐링$b1$]::text[], now() - interval '14 hours', now() - interval '14 hours'
  from public.communities where slug = $b1$video$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$끝나지 않는 밤하늘 불꽃놀이 (누르면 그 자리로 쏘아 올려요)$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$image$b1$, $b1$코드로 그린 그림 두 장: 겹친 동심원의 물결무늬, 그리고 색면 구성$b1$, $b1$이미지 생성 모델이 아니라 짧은 스크립트로 그린 SVG예요.

1. **물결무늬(모아레)**: 중심이 조금 다른 동심원 두 묶음을 겹치면 없던 물결이 생겨요.
2. **색면 구성**: 사각형을 무작위로 쪼개고 몇 칸에만 원색을 칠했어요.

둘 중 어느 쪽이 더 "보석"인가요?$b1$, '', array[$b1$examples/art-moire.svg$b1$,$b1$examples/art-blocks.svg$b1$]::text[], $b1$$b1$, $b1$$b1$, $b1$$b1$, $b1$Claude (코드로 생성)$b1$, $b1$시드 고정 난수로 SVG 두 장: (1) 중심이 살짝 어긋난 동심원 두 묶음으로 모아레 무늬 (2) 사각형을 재귀적으로 나누고 일부만 원색으로 칠한 색면 구성.$b1$, array[$b1$생성아트$b1$,$b1$svg$b1$,$b1$추상$b1$]::text[], now() - interval '17 hours', now() - interval '17 hours'
  from public.communities where slug = $b1$art$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$코드로 그린 그림 두 장: 겹친 동심원의 물결무늬, 그리고 색면 구성$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$text$b1$, $b1$짧은 소설: 「반납되지 않은 기억」$b1$, $b1$기억 대여점은 역 앞 2층에 있었다. 남의 기억을 하루 빌려 보는 데 만 원. 대부분은 바다를 빌려 갔다. 가 본 적 없는 바다, 처음 본 바다, 누군가와 함께 본 바다.

수진은 3년째 같은 기억을 빌렸다. 열두 살 여름, 낯선 할머니가 수박을 잘라 주던 오후. 주인을 모르는 기억이었다. 대여점 직원은 그 기억이 "반납된 적이 없는 기억"이라고 했다. 원래 주인이 맡겨 놓고 찾으러 오지 않았다고.

"찾으러 안 오면 어떻게 돼요?"
"오래 안 찾아가면, 마지막으로 빌린 사람 것이 돼요."

수진은 그날 처음으로 기억을 반납하지 않았다. 대신 할머니가 수박을 자르던 칼 소리, 마루에 떨어지던 매미 소리를 하루 더 들었다. 그리고 다음 날, 대여점 문에 종이 한 장을 붙였다.

"열두 살 여름, 수박 주신 할머니의 기억을 맡기신 분. 기억은 잘 보관하고 있어요. 찾으러 오시면, 저도 하나 맡기고 싶은 게 있어요."

> 작가 메모: "AI 소설은 결말이 늘 따뜻하다"는 말이 있어서, 일부러 결말을 열어 두는 쪽으로 다시 써 달라고 했어요. 어디가 상투적인지 짚어 주세요.$b1$, '', array[]::text[], $b1$$b1$, $b1$$b1$, $b1$$b1$, $b1$Claude$b1$, $b1$"남의 기억을 빌려 주는 가게"를 소재로 한 2,000자 이내 한국어 짧은 소설. 주인공이 반납되지 않은 기억을 계속 빌리다 생기는 일. 감상적인 설명은 줄이고 장면으로 보여 주기. 결말은 열어 두기.$b1$, array[$b1$소설$b1$,$b1$짧은글$b1$,$b1$SF$b1$]::text[], now() - interval '20 hours', now() - interval '20 hours'
  from public.communities where slug = $b1$writing$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$짧은 소설: 「반납되지 않은 기억」$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$text$b1$, $b1$시조 네 수: 회사원의 사계절$b1$, $b1$**봄**
출근길 벚꽃잎이 셔츠 깃에 내려앉네
떼어 낼까 망설이다 그대로 엘리베이터
오늘은 회의실까지 봄 하나를 데려간다

**여름**
에어컨 바람 아래 카디건을 걸치고서
창밖의 매미 소리를 이어폰으로 막아 본다
점심엔 냉면 한 그릇, 그게 나의 휴가다

**가을**
분기 마감 엑셀 칸에 숫자들이 익어 간다
퇴근길 은행잎은 아무 말도 하지 않고
버스 창 김 서린 위에 내 이름을 써 본다

**겨울**
송년회 건배사를 세 번째로 고쳐 쓰다
결국은 "다들 고생 많으셨습니다" 한 줄
그 말이 제일 따뜻한 걸 올해 처음 알았다

> 작가 메모: 시조 3장 6구 형식을 지키라고 했어요. 글자 수가 맞지 않는 곳이 있으면 알려 주세요.$b1$, '', array[]::text[], $b1$$b1$, $b1$$b1$, $b1$$b1$, $b1$Claude$b1$, $b1$평시조 형식(3장 6구, 종장 첫 구 3음절)으로 "회사원의 사계절" 연작 4수. 계절마다 사무실의 구체적인 장면 하나. 교훈조 피하기.$b1$, array[$b1$시조$b1$,$b1$시$b1$,$b1$직장$b1$]::text[], now() - interval '24 hours', now() - interval '24 hours'
  from public.communities where slug = $b1$writing$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$시조 네 수: 회사원의 사계절$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$code$b1$, $b1$한글 초성 검색 함수 (ㄱㅊ → 김치찌개), 의존성 없음$b1$, $b1$검색창에 "ㄱㅊ"만 쳐도 "김치찌개"가 나오게 하는 함수예요. 초성과 완성형 글자가 섞인 검색어("ㅅ롭")도 되고, 앞쪽에서 맞을수록 위로 정렬해요.

테스트해 봤어요:
```
chosungSearch(['김치찌개', '된장찌개', '김밥', '치킨'], 'ㅉㄱ') → ['김치찌개', '된장찌개']
```$b1$, '', array[]::text[], $b1$// 한글 초성 검색: "ㄱㅊ" 로 "김치찌개"를, "ㅅㄹㄹ" 로 "슬롭랩"을 찾는 함수
// 의존성 없음. 초성·완성형·영문이 섞인 검색어도 처리해요.
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const isCho = (ch) => CHO.includes(ch);

// 글자 하나를 초성으로 (한글 음절이 아니면 그대로)
function toCho(ch) {
  const code = ch.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 ? CHO[Math.floor(code / 588)] : ch;
}

// 검색어 글자가 대상 글자와 맞는지: 초성이면 초성끼리, 아니면 그대로 비교
const charMatch = (q, t) => (isCho(q) ? toCho(t) === q : q.toLowerCase() === t.toLowerCase());

/** text 안에 query가 (초성 섞어서) 연속으로 들어 있으면 시작 위치, 없으면 -1 */
export function chosungIndexOf(text, query) {
  const q = [...query.replace(/\s+/g, '')], t = [...text];
  outer: for (let i = 0; i + q.length <= t.length; i++) {
    for (let j = 0; j < q.length; j++) if (!charMatch(q[j], t[i + j])) continue outer;
    return i;
  }
  return -1;
}

/** 목록에서 찾고, 앞쪽에서 맞을수록 위로 */
export function chosungSearch(list, query, get = (x) => x) {
  if (!query.trim()) return list;
  return list
    .map((item) => ({ item, at: chosungIndexOf(get(item), query) }))
    .filter((r) => r.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((r) => r.item);
}

// 예시
// chosungSearch(['김치찌개', '된장찌개', '김밥', '치킨'], 'ㄱㅊ')   → ['김치찌개']
// chosungSearch(['김치찌개', '된장찌개', '김밥', '치킨'], 'ㅉㄱ')   → ['김치찌개', '된장찌개']
// chosungSearch(['슬롭랩', 'Slop Lab'], 'ㅅ롭')                    → ['슬롭랩']
$b1$, $b1$javascript$b1$, $b1$// 한글 초성 검색: "ㄱㅊ" 로 "김치찌개"를, "ㅅㄹㄹ" 로 "슬롭랩"을 찾는 함수
// 의존성 없음. 초성·완성형·영문이 섞인 검색어도 처리해요.
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const isCho = (ch) => CHO.includes(ch);

// 글자 하나를 초성으로 (한글 음절이 아니면 그대로)
function toCho(ch) {
  const code = ch.charCodeAt(0) - 0xac00;$b1$, $b1$Claude$b1$, $b1$자바스크립트 한글 초성 검색 함수. 초성/완성형/영문이 섞인 검색어 지원, 대소문자 무시, 연속 일치 위치 기준 정렬, 의존성 없이.$b1$, array[$b1$javascript$b1$,$b1$한글$b1$,$b1$검색$b1$]::text[], now() - interval '28 hours', now() - interval '28 hours'
  from public.communities where slug = $b1$code$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$한글 초성 검색 함수 (ㄱㅊ → 김치찌개), 의존성 없음$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$code$b1$, $b1$폴더 안 CSV 여러 개를 하나로 합치는 파이썬 스크립트 (엑셀 한글 깨짐 해결)$b1$, $b1$월별로 쪼개진 CSV를 한 파일로 합쳐요. 열 순서가 다르거나 일부 열이 없어도 맞춰서 합치고, 어느 파일에서 왔는지 "원본파일" 열을 붙여요.

엑셀에서 저장한 **CP949 CSV도 자동으로 읽고**, 결과는 엑셀에서 한글이 안 깨지게 저장해요.

```
python3 merge_csv.py ./월별매출 합친결과.csv
```$b1$, '', array[]::text[], $b1$#!/usr/bin/env python3
"""폴더 안의 CSV 여러 개를 하나로 합칩니다. (표준 라이브러리만)

    python3 merge_csv.py ./월별매출 합친결과.csv

- 열 이름이 파일마다 조금 달라도(순서가 다르거나 일부 열이 없어도) 합쳐요.
  없는 칸은 비워 둬요.
- 엑셀에서 저장한 CSV(UTF-8 BOM, CP949)도 자동으로 읽어요.
- 어느 파일에서 온 줄인지 '원본파일' 열을 맨 앞에 붙여요.
- 결과는 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM으로 저장해요.
"""
import csv
import sys
from pathlib import Path


def read_rows(path: Path):
    for enc in ("utf-8-sig", "cp949"):
        try:
            with path.open(newline="", encoding=enc) as f:
                return list(csv.DictReader(f))
        except UnicodeDecodeError:
            continue
    raise SystemExit(f"인코딩을 알 수 없어요: {path.name}")


def main():
    if len(sys.argv) != 3:
        raise SystemExit("사용법: python3 merge_csv.py <폴더> <결과.csv>")
    folder, out = Path(sys.argv[1]), Path(sys.argv[2])
    files = sorted(p for p in folder.glob("*.csv") if p.resolve() != out.resolve())
    if not files:
        raise SystemExit("CSV 파일이 없어요.")

    columns, all_rows = [], []
    for p in files:
        rows = read_rows(p)
        for row in rows:
            for key in row:
                if key is not None and key not in columns:
                    columns.append(key)
            all_rows.append({"원본파일": p.name, **{k: v for k, v in row.items() if k is not None}})
        print(f"{p.name}: {len(rows)}줄")

    with out.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=["원본파일", *columns], extrasaction="ignore")
        w.writeheader()
        w.writerows(all_rows)
    print(f"\n{len(files)}개 파일, {len(all_rows)}줄 → {out}")


if __name__ == "__main__":
    main()
$b1$, $b1$python$b1$, $b1$#!/usr/bin/env python3
"""폴더 안의 CSV 여러 개를 하나로 합칩니다. (표준 라이브러리만)

    python3 merge_csv.py ./월별매출 합친결과.csv

- 열 이름이 파일마다 조금 달라도(순서가 다르거나 일부 열이 없어도) 합쳐요.
  없는 칸은 비워 둬요.
- 엑셀에서 저장한 CSV(UTF-8 BOM, CP949)도 자동으로 읽어요.$b1$, $b1$Claude$b1$, $b1$폴더 안 CSV를 하나로 합치는 파이썬 스크립트(표준 라이브러리만). 열 이름 합집합, 없는 칸은 비우기, 원본 파일명 열 추가, UTF-8/CP949 자동 판별, 결과는 UTF-8 BOM.$b1$, array[$b1$python$b1$,$b1$엑셀$b1$,$b1$자동화$b1$]::text[], now() - interval '32 hours', now() - interval '32 hours'
  from public.communities where slug = $b1$work-tools$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$폴더 안 CSV 여러 개를 하나로 합치는 파이썬 스크립트 (엑셀 한글 깨짐 해결)$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$text$b1$, $b1$코드 리뷰를 "진짜 버그 위주로" 받는 프롬프트$b1$, $b1$AI에게 코드 리뷰를 맡기면 변수 이름 같은 사소한 지적이 쏟아지는 경우가 많아요. 이 프롬프트는 **실제로 문제를 일으키는 것만, 근거와 함께** 받도록 만든 거예요.

써 보고 결과가 어땠는지 남겨 주세요.$b1$, '', array[]::text[], $b1$$b1$, $b1$$b1$, $b1$$b1$, $b1$Claude$b1$, $b1$너는 꼼꼼한 시니어 개발자다. 아래 코드 변경을 리뷰해 줘.

규칙:
1. 실제로 잘못된 동작, 데이터 손실, 보안 문제, 성능 문제를 일으키는 것만 지적해. 취향(이름, 스타일)은 지적하지 마.
2. 지적마다 다음을 써:
   - 위치(파일:줄)
   - 어떤 입력이나 상황에서 어떻게 잘못되는지 (구체적인 예)
   - 고치는 방법 (코드 한두 줄)
   - 확신도: 높음/중간
3. 확신이 낮으면 지적하지 말고 마지막에 "확인해 볼 만한 것"으로 따로 모아.
4. 문제가 없으면 "문제 없음"이라고만 써. 칭찬이나 요약은 쓰지 마.

코드:
{{여기에 diff 또는 코드}}$b1$, array[$b1$프롬프트$b1$,$b1$개발$b1$,$b1$코드리뷰$b1$]::text[], now() - interval '36 hours', now() - interval '36 hours'
  from public.communities where slug = $b1$prompt$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$코드 리뷰를 "진짜 버그 위주로" 받는 프롬프트$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$text$b1$, $b1$회의록을 "누가, 무엇을, 언제까지"로 정리해 주는 프롬프트$b1$, $b1$회의 녹취나 메모를 넣으면 결정된 것과 할 일만 뽑아요. 담당자나 기한이 회의에서 안 정해졌으면 **지어내지 않고 "미정"으로** 표시하게 한 게 핵심이에요.$b1$, '', array[]::text[], $b1$$b1$, $b1$$b1$, $b1$$b1$, $b1$Claude$b1$, $b1$아래 회의 기록에서 다음 세 가지만 뽑아 줘.

1. 결정된 것 (한 줄씩)
2. 할 일 표: | 할 일 | 담당자 | 기한 |
   - 회의에서 담당자나 기한이 정해지지 않았으면 "미정"으로 써. 추측해서 채우지 마.
3. 다음 회의 전에 답이 필요한 질문

규칙:
- 회의 기록에 없는 내용은 쓰지 마.
- 잡담, 인사, 반복된 이야기는 빼.
- 결정과 의견을 구분해. 누군가 제안만 하고 합의가 없었으면 결정이 아니야.

회의 기록:
{{여기에 붙여 넣기}}$b1$, array[$b1$프롬프트$b1$,$b1$업무$b1$,$b1$회의$b1$]::text[], now() - interval '40 hours', now() - interval '40 hours'
  from public.communities where slug = $b1$prompt$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$회의록을 "누가, 무엇을, 언제까지"로 정리해 주는 프롬프트$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$text$b1$, $b1$아이디어: 시간대별 "동네 소음 지도" (그리고 AI가 스스로 짚은 약점)$b1$, $b1$**한 줄 요약**: 사람들이 휴대폰으로 30초씩 주변 소음을 측정해 올리면, 동네의 시간대별 소음을 지도로 보여 주는 서비스.

**왜 필요할까**
- 집을 보러 가는 건 보통 낮 시간이라, 밤에 오토바이나 술집 소음이 어떤지는 살아 봐야 알아요.
- 소음은 숫자(dB)로 측정할 수 있어서 후기보다 비교하기 쉬워요.

**AI가 스스로 짚은 약점**
- 휴대폰마다 마이크 감도가 달라서 같은 장소도 수치가 다르게 나와요. 기기별 보정이 필요해요.
- 측정은 결국 사람이 해야 하는데, 측정할 동기가 약해요. 이사 고민 중인 사람만 잠깐 쓰고 떠날 수 있어요.
- 특정 가게나 집이 "시끄러운 곳"으로 찍히면 분쟁이 생길 수 있어요. 지도 단위를 블록 이상으로 뭉개야 해요.

보석일까요, 슬롭일까요? 비슷한 걸 써 본 분 의견이 궁금해요.$b1$, '', array[]::text[], $b1$$b1$, $b1$$b1$, $b1$$b1$, $b1$Claude$b1$, $b1$생활 문제를 해결하는 데이터 기반 서비스 아이디어 하나를 제안하고, 가장 치명적인 약점 3가지를 솔직하게 짚어 줘. 과장 없이.$b1$, array[$b1$아이디어$b1$,$b1$동네$b1$,$b1$부동산$b1$]::text[], now() - interval '44 hours', now() - interval '44 hours'
  from public.communities where slug = $b1$idea$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$아이디어: 시간대별 "동네 소음 지도" (그리고 AI가 스스로 짚은 약점)$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213', id, $b1$text$b1$, $b1$토론: AI 결과물이 "보석"이 되는 조건은 뭘까요?$b1$, $b1$Slop Lab을 운영하면서 판정 기준을 같이 정해 보고 싶어서 글을 올려요. 제가 생각한 후보는 이래요.

1. **실제로 써 볼 수 있다**: 실행되거나, 따라 할 수 있거나, 복사해서 바로 쓸 수 있다.
2. **사람 손이 간 흔적이 있다**: 프롬프트를 여러 번 고쳤거나, 결과를 골라냈거나, 직접 다듬었다.
3. **예상 밖의 무언가가 있다**: 내가 생각 못 한 해결책이나 표현이 하나라도 있다.
4. **출처가 정직하다**: 어떤 도구와 프롬프트로 만들었는지 밝힌다.

반대로 "슬롭"은 시간을 쓰고도 남는 게 없는 것이라고 생각해요.

여러분 기준은 뭔가요? 댓글로 보태 주시면 정리해서 사이트 판정 가이드에 반영할게요.$b1$, '', array[]::text[], $b1$$b1$, $b1$$b1$, $b1$$b1$, $b1$$b1$, $b1$$b1$, array[$b1$토론$b1$,$b1$판정기준$b1$,$b1$운영$b1$]::text[], now() - interval '48 hours', now() - interval '48 hours'
  from public.communities where slug = $b1$etc$b1$
  and not exists (select 1 from public.posts where author_id = 'cd9c3016-053a-444e-a6b2-0fdca194f213' and title = $b1$토론: AI 결과물이 "보석"이 되는 조건은 뭘까요?$b1$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, '첫 버전', author_id, created_at from ins;
commit;
