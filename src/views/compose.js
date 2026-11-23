import { api, S, $, app, KINDS, TOOLS, MAX_CODE, MAX_BODY, sandboxFrame, canWrite, isMod, remember, commBySlug, toast, errMsg, go, currentHash, icon, KIND_ICON, KIND_ORDER } from '../core.js';
import { esc, md, safeUrl, domain, ytId } from '../text.js';

// what the composer says and asks for, by kind of post
const K = {
  html: { help: 'AI가 만들어 준 HTML 파일 하나를 통째로 붙여 넣으면 글에서 바로 실행돼요. 게임, 도구, 시각화에 좋아요.', title: '예: 시계 없이 10초를 맞히는 게임', bodyLabel: '설명', body: '무엇을 하는 실행물인지, 어디가 좋고 어디가 아쉬운지 적어 주세요.', main: '실행할 HTML 코드',
    tips: ['HTML 파일 하나에 CSS와 스크립트를 모두 넣어요.', '올리기 전에 미리 실행해서 휴대폰 너비에서도 되는지 봐요.', '외부로 데이터를 보내는 코드는 신고 대상이에요.', '조작법을 설명에 한 줄 적어 두면 판정받기 쉬워요.'] },
  image: { help: 'AI로 만든 그림, 사진, 디자인을 올려요. 첫 번째 이미지가 목록에 대표로 보여요.', title: '예: 비 오는 밤의 창문, 세 가지 화풍으로', bodyLabel: '설명', body: '어떤 의도로 만들었고, 어디를 봐 주면 좋을지 적어 주세요.', main: '이미지',
    tips: ['가장 잘 나온 한 장을 맨 앞에 둬요.', '프롬프트를 같이 올리면 다른 사람이 재현해 볼 수 있어요.', '여러 번 뽑은 것 중 고른 것이라면 그렇게 적어 주세요.', '다른 사람의 얼굴이나 저작물이 들어간 이미지는 올리지 말아 주세요.'] },
  text: { help: 'AI와 쓴 글, 쓸 만한 프롬프트, 아이디어를 올려요. 본문이 곧 결과물이에요.', title: '예: 감사 편지를 쓰기 전에 AI가 먼저 나를 인터뷰하게 하는 프롬프트', bodyLabel: '본문', body: '결과물을 그대로 붙여 넣고, 어디가 좋고 어디가 아쉬운지 덧붙여 주세요.', main: '본문',
    tips: ['첫 두세 줄이 목록에 보여요. 핵심을 앞에 써요.', '좋은 점과 아쉬운 점을 나눠 적으면 판정이 잘 붙어요.', '프롬프트가 결과물이라면 "사용한 프롬프트" 칸에 넣어요. 복사 버튼이 생겨요.', '마지막에 물어보고 싶은 것을 한 줄 적어요.'] },
  code: { help: 'AI가 짜 준 스크립트나 코드 조각을 올려요. 줄 번호와 복사·내려받기 버튼이 붙어요.', title: '예: 폴더 속 중복 파일을 찾아 주는 파이썬 스크립트', bodyLabel: '설명', body: '무엇을 하는 코드인지, 어떻게 실행하는지, 주의할 점을 적어 주세요.', main: '코드',
    tips: ['실행 방법을 설명에 한 줄 적어요.', '언어를 적으면 내려받을 때 확장자가 맞게 붙어요.', '비밀번호나 API 키가 들어 있지 않은지 꼭 확인해요.', '브라우저에서 돌아가는 HTML이면 "실행물"로 올려요.'] },
  link: { help: '다른 곳에 올린 AI 결과물을 주소로 소개해요. 유튜브 주소는 글에서 바로 재생돼요.', title: '예: Suno로 만든 3분짜리 시티팝', bodyLabel: '소개', body: '어떤 결과물이고 무엇으로 만들었는지, 왜 볼 만한지 적어 주세요.', main: '링크 주소',
    tips: ['결과물이 바로 보이는 주소를 넣어요.', '로그인해야 보이는 페이지는 판정받기 어려워요.', '어떤 도구로 만들었는지 꼭 적어요.', '내가 만든 것이 아니면 그렇게 밝혀 주세요.'] },
};
const DROP_TEXT = '여기로 끌어 놓거나, 붙여 넣거나, 눌러서 고르세요 (최대 8장, 장당 10MB)';
const LANG_BY_EXT = { py: 'python', js: 'javascript', mjs: 'javascript', ts: 'typescript', sh: 'bash', html: 'html', htm: 'html', css: 'css', json: 'json', sql: 'sql', lua: 'lua', go: 'go', rs: 'rust', java: 'java', c: 'c', cpp: 'cpp', rb: 'ruby', php: 'php', swift: 'swift', kt: 'kotlin', md: 'markdown', yml: 'yaml', yaml: 'yaml' };
const guessLang = (c) => (/^#!.*python|^\s*(def |import \w+$|from \w+ import )/m.test(c) ? 'python' : /^#!.*\b(ba)?sh\b/.test(c) ? 'bash' : /<\?php/.test(c) ? 'php' : /^\s*(SELECT|INSERT|CREATE TABLE)\b/im.test(c) ? 'sql' : /^\s*(const|let|var|function|import .+ from|export )\b/m.test(c) ? 'javascript' : '');

const DRAFT = 'slop-draft-v2';
export function closeCompose() { S.c = null; }

export async function renderCompose(v) {
  if (S.c?.hash === location.hash) return;
  const st = S.c = { hash: location.hash, mode: v.mode, id: v.id, images: [], kindTouched: v.mode !== 'new' };
  if (!canWrite()) {
    app.innerHTML = `<a class="crumb" href="#/">← 게시판으로</a><div class="banner">${api.me ? '작성이 제한된 계정이에요.' : '글을 쓰려면 먼저 로그인해 주세요. <a class="btn sm pri" href="#/login">로그인</a>'}</div>`;
    if (!api.me) try { sessionStorage.setItem('slop-after-login', currentHash()); } catch { /* */ }
    return;
  }
  let all = []; try { all = await api.listCommunities({ limit: 300 }); all.forEach(remember); } catch { /* fall back to known ones */ }
  if (S.c !== st) return;
  if (!all.length) all = [...S.comms.values()];
  const fromSlug = v.slug ? (commBySlug(v.slug) || all.find((c) => c.slug === v.slug)) : null;
  let f = { communityId: fromSlug?.id || S.lastCommunity || '', kind: null, title: '', body: '', url: '', code: '', codeLang: '', tool: '', prompt: '', tags: '', images: [] }, src = null, ver = null, open = [];
  if (v.mode === 'new') { try { const dft = JSON.parse(localStorage.getItem(DRAFT) || 'null'); if (dft && (dft.title || dft.body || dft.code)) { Object.assign(f, dft); if (fromSlug) f.communityId = fromSlug.id; st.restored = true; } } catch { /* */ } }
  else {
    app.innerHTML = '<div class="skel" style="height:300px"></div>';
    try { [src, ver] = await Promise.all([api.getPost(v.id), api.getVersions(v.id)]); } catch { /* handled below */ }
    if (S.c !== st) return;
    ver = ver?.find((x) => x.n === (v.mode === 'edit' ? src?.version : v.n)) || ver?.[ver.length - 1];
    if (!src || !ver) { app.innerHTML = '<a class="crumb" href="#/">← 게시판으로</a><div class="banner">원본 글을 찾을 수 없어요.</div>'; return; }
    if (v.mode === 'translate' && src.authorId !== api.me.id && !isMod()) { app.innerHTML = '<div class="banner">언어판은 글쓴이만 올릴 수 있어요.</div>'; return; }
    if (v.mode === 'edit' && src.authorId !== api.me.id && !isMod()) { app.innerHTML = `<div class="banner">작성자만 수정판을 올릴 수 있어요. 대신 <a href="#/remix/${src.id}/${ver.n}">리믹스</a>해 보세요.</div>`; return; }
    f = { communityId: src.communityId, kind: src.kind, title: v.mode === 'remix' ? `${src.title} (리믹스)`.slice(0, 120) : ver.title, body: ver.body, url: ver.url, code: ver.code, codeLang: src.codeLang, tool: src.tool, prompt: ver.prompt, tags: src.tags.join(', '), images: v.mode === 'remix' ? [] : [...ver.images] };
    st.src = src; st.ver = ver;
    if (v.mode === 'edit') { try { open = (await api.listComments(v.id)).filter((c) => !c.deleted && !c.resolvedIn && (c.flair === 'improve' || c.flair === 'question')); } catch { /* optional */ } }
    if (S.c !== st) return;
  }
  const byId = (id) => S.comms.get(id) || all.find((c) => c.id === id);
  f.kind ??= byId(f.communityId)?.defaultKind || 'text'; st.images = [...f.images]; st.byId = byId;
  const followed = all.filter((c) => S.my.has(c.id)), others = all.filter((c) => !S.my.has(c.id));
  const opt = (c) => `<option value="${c.id}"${c.id === f.communityId ? ' selected' : ''}>${esc(c.name)} · c/${esc(c.slug)}</option>`;
  const LN = { ko: '한국어', en: 'English' };
  const head = v.mode === 'new' ? '새 글' : v.mode === 'edit' ? `새 버전 올리기 · v${src.version + 1}` : v.mode === 'translate' ? `${LN[v.lang]}판 올리기` : `리믹스: ${esc(src.title)}`;
  const locked = v.mode !== 'new'; // a new version, a language edition or a remix keeps the original's kind
  app.innerHTML = `<a class="crumb" href="${v.mode === 'new' ? (fromSlug ? '#/c/' + esc(fromSlug.slug) : '#/') : '#/p/' + v.id}">← 돌아가기</a><div class="compose"><form class="form" id="cmp" novalidate>
    <h1>${head}</h1>${v.mode === 'translate' ? `<div class="banner" style="margin:0">원본 글과 같은 커뮤니티에 올라가고, 글 화면에서 언어를 골라 볼 수 있게 묶여요. 제목·본문·코드를 ${LN[v.lang]}로 바꿔 주세요.</div>` : ''}${st.restored ? '<div class="banner" style="margin:0">작성하던 초안을 불러왔어요. <button type="button" class="linkbtn" id="clearDraft">비우기</button></div>' : ''}
    <section class="cstep"><h2><b>1</b><span>무엇을 올리나요?</span></h2>
      <div class="kinds big" role="group" aria-label="종류">${KIND_ORDER.map((k) => `<button type="button" class="k-${k}" data-kind="${k}" aria-pressed="${f.kind === k}"${locked && f.kind !== k ? ' disabled' : ''}>${icon(KIND_ICON[k])}<b>${KINDS[k][0]}</b><small>${KINDS[k][1]}</small></button>`).join('')}</div>
      <p class="khelp" id="kHelp"></p></section>
    <section class="cstep"><h2><b>2</b><span id="mainLabel">내용</span></h2>
      <div class="field" data-for="link"><label for="fUrl" class="sr">링크 주소</label><input type="url" id="fUrl" inputmode="url" value="${esc(f.url)}" placeholder="https://"><div id="linkPrev"></div></div>
      <div class="field" data-for="image link"><span class="flabel" data-for="link">스크린샷 (선택)</span><div class="drop" id="drop" tabindex="0" role="button">${icon('upload')}<span id="dropText">${DROP_TEXT}</span></div><input type="file" id="fFile" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden><div class="upl" id="upl"></div></div>
      <div class="field" data-for="html code"><label for="fCode" class="sr" id="codeLabel">코드</label>
        <div class="codebar"><button type="button" class="btn sm" id="loadFile">${icon('upload')}<span>파일에서 불러오기</span></button><input type="file" id="fCodeFile" hidden><input type="text" id="fLang" data-for="code" maxlength="20" value="${esc(f.codeLang)}" placeholder="언어 (예: python)" aria-label="언어"><span class="sp"></span><span class="hint mono" id="codeSize"></span></div>
        <textarea id="fCode" class="codeed" spellcheck="false">${esc(f.code)}</textarea>
        <ul class="checks" id="codeChecks" data-for="html"></ul>
        <div class="stage" id="pvWrap" data-for="html" hidden><div class="stage-bar"><span class="label">미리 실행</span><span class="sp"></span><div class="seg" role="group" aria-label="미리보기 너비"><button type="button" data-pvw="full" aria-pressed="true">넓게</button><button type="button" data-pvw="phone" aria-pressed="false">휴대폰</button></div><button type="button" class="btn sm" id="pvBtn">다시 실행</button></div><div class="runner" id="pv"></div></div></div>
      <div class="field"><label for="fTitle">제목</label><input type="text" id="fTitle" maxlength="120" value="${esc(f.title)}"><span class="hint cnt" id="titleCnt"></span></div>
      <div class="field"><label for="fBody" id="bodyLabel">본문</label>
        <div class="mdbar" role="toolbar" aria-label="서식"><button type="button" data-md="b" title="굵게"><b>B</b></button><button type="button" data-md="ul" title="목록">• 목록</button><button type="button" data-md="quote" title="인용">❝ 인용</button><button type="button" data-md="code" title="코드">&lt;/&gt;</button><button type="button" data-md="link" title="링크">링크</button><span class="sp"></span><button type="button" class="linkbtn" id="mdToggle">미리보기</button></div>
        <textarea id="fBody" rows="7" maxlength="${MAX_BODY}">${esc(f.body)}</textarea>
        <div class="row"><span class="hint">**굵게**, \`코드\`, - 목록, &gt; 인용, 링크는 자동 연결돼요</span><span class="sp"></span><span class="hint cnt mono" id="bodyCnt"></span></div><div class="mdprev md" id="mdPrev" hidden></div></div>
      <details class="prompt" id="promptBox"${f.prompt || f.kind === 'image' ? ' open' : ''}><summary>사용한 프롬프트 (선택, 강력 추천)</summary><textarea id="fPrompt" rows="4" maxlength="8000" style="margin-top:8px" placeholder="어떤 프롬프트로 만들었나요? 다른 사람이 재현하고 개선하는 데 도움이 돼요.">${esc(f.prompt)}</textarea></details></section>
    <section class="cstep"><h2><b>3</b><span>어디에, 무엇으로</span></h2>
      <div class="grid2"><div class="field"><label for="fCat">커뮤니티</label><select id="fCat"${v.mode === 'edit' || v.mode === 'translate' ? ' disabled' : ''}><option value="">커뮤니티를 고르세요</option>${followed.length ? `<optgroup label="팔로우 중">${followed.map(opt).join('')}</optgroup>` : ''}${others.length ? `<optgroup label="다른 커뮤니티">${others.map(opt).join('')}</optgroup>` : ''}</select>
          <span class="hint">맞는 곳이 없으면 <a href="#/communities/new">새로 만들 수 있어요</a>.</span></div>
        <div class="field"><label for="fTool">만든 도구</label><input type="text" id="fTool" list="toolList" maxlength="40" value="${esc(f.tool)}" placeholder="예: Claude, Midjourney, Suno"><datalist id="toolList">${TOOLS.map((t) => `<option value="${esc(t)}">`).join('')}</datalist></div></div>
      <div class="field"><label for="fTags">태그</label><input type="text" id="fTags" value="${esc(f.tags)}" placeholder="쉼표로 구분, 최대 5개"></div>
      ${v.mode === 'edit' ? `<div class="field"><label for="fNote">무엇이 바뀌었나요?</label><input type="text" id="fNote" maxlength="200" placeholder="예: 댓글 의견대로 색 대비를 높였어요">
        ${open.length ? `<span class="hint">아래 개선 제안·질문 중 이번에 반영한 것을 고르면 "v${src.version + 1}에서 반영"으로 표시되고, 쓴 사람에게 알림이 가요.</span><div class="addr">${open.map((c) => `<label><input type="checkbox" data-addr="${c.id}"><span><b>${esc(c.author?.name || '')}</b> ${esc(c.text.slice(0, 200))}</span></label>`).join('')}</div>` : ''}</div>` : ''}</section>
    <div class="submitbar"><button class="btn pri" type="submit" id="submitBtn">${v.mode === 'edit' ? '새 버전 올리기' : '올리기'}</button><span class="hint" id="subStatus" role="alert"></span></div>
  </form>
  <aside class="side"><section class="panel"><h2>올리기 전 확인</h2><ul class="todo" id="todo"></ul></section>
    <section class="panel"><h2>이렇게 올리면 좋아요</h2><ul id="kTips"></ul></section>
    ${api.aiAvailable ? '<section class="panel"><h2>Claude 도우미</h2><p>내용을 보고 게시판, 형식, 제목, 태그를 추천해 줘요. 이미 쓴 칸은 건드리지 않아요.</p><button type="button" class="btn sm" id="aiGo">분류·제목 추천받기</button><p class="hint" id="aiStatus" style="margin:8px 0 0"></p></section>' : ''}</aside></div>`;
  bind(v, f);
}

function bind(v, f) {
  const st = S.c;
  const code = $('#fCode'), title = $('#fTitle'), body = $('#fBody');
  const kindSet = (k) => {
    st.kind = k; const c = K[k];
    app.querySelectorAll('[data-kind]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === k)));
    app.querySelectorAll('[data-for]').forEach((el) => (el.hidden = !el.dataset.for.split(' ').includes(k)));
    $('#kHelp').textContent = c.help; $('#mainLabel').textContent = k === 'text' ? '제목과 본문' : c.main;
    $('#kTips').innerHTML = c.tips.map((t) => `<li>${t}</li>`).join('');
    title.placeholder = c.title; body.placeholder = c.body;
    $('#bodyLabel').innerHTML = k === 'text' ? '본문' : `${c.bodyLabel} <span class="opt">선택</span>`;
    body.rows = k === 'text' ? 12 : 5;
    code.placeholder = k === 'html' ? '<!doctype html> … AI가 만들어 준 HTML 파일 전체를 붙여 넣으세요' : '코드를 붙여 넣으세요';
    $('#fCodeFile').accept = k === 'html' ? '.html,.htm,text/html' : '';
    if (k === 'image') $('#promptBox').open = true;
    if (k === 'html') schedulePv(0); else $('#pvWrap').hidden = true;
    linkPrev(); check();
  };
  // live checklist: what is still missing before this can go up
  const mainDone = () => (st.kind === 'link' ? !!safeUrl($('#fUrl').value.trim()) : st.kind === 'image' ? st.images.length > 0 : st.kind === 'text' ? !!body.value.trim() : !!code.value.trim());
  const check = () => {
    const items = [[mainDone(), K[st.kind].main], [!!title.value.trim(), '제목'], [!!$('#fCat').value, '커뮤니티'], [!!$('#fTool').value.trim(), '만든 도구', 1], [!!$('#fPrompt').value.trim(), '사용한 프롬프트', 1]];
    $('#todo').innerHTML = items.map(([ok, l, opt]) => `<li class="${ok ? 'done' : ''}">${icon(ok ? 'check' : 'x')}<span>${l}</span>${opt ? '<span class="opt">선택</span>' : ''}</li>`).join('');
    $('#titleCnt').textContent = title.value.length > 80 ? `${title.value.length} / 120` : '';
    $('#bodyCnt').textContent = body.value.length ? `${body.value.length.toLocaleString()}자` : '';
    app.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  };
  st.check = check;
  // app posts: things worth knowing before it goes up, read from the code itself
  const codeChecks = () => {
    const c = code.value, out = [];
    if (c.trim()) {
      if (!/<[a-z!][^>]*>/i.test(c)) out.push(['warn', 'HTML이 아닌 것 같아요. 코드만 공유하려면 "코드"를 골라 주세요.']);
      if (/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\b|(src|href|action)\s*=\s*["']https?:\/\//i.test(c)) out.push(['warn', '외부 주소를 쓰는 코드가 있어요. 꼭 필요하지 않으면 빼 주세요. 데이터를 밖으로 보내는 실행물은 신고 대상이에요.']);
      if (/\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/.test(c)) out.push(['info', '실행 창은 격리돼 있어서 저장 기능(localStorage 등)이 막혀 있어요. 저장이 안 돼도 멈추지 않는지 미리 실행으로 확인해 주세요.']);
      if (/<[a-z]/i.test(c) && !/name\s*=\s*["']viewport["']/i.test(c)) out.push(['info', '휴대폰에서도 잘 보이게 하려면 viewport 메타 태그를 넣어 주세요.']);
      if (!out.length) out.push(['ok', '외부 요청 없이 혼자 돌아가는 실행물로 보여요.']);
    }
    $('#codeChecks').innerHTML = out.map(([t, m]) => `<li class="${t}">${icon(t === 'ok' ? 'check' : t === 'warn' ? 'flag' : 'shield')}<span>${m}</span></li>`).join('');
  };
  const sz = () => { const b = new Blob([code.value]).size; $('#codeSize').textContent = `${code.value ? code.value.split('\n').length.toLocaleString() + '줄 · ' : ''}${(b / 1024).toFixed(1)} KB / 400 KB`; $('#codeSize').style.color = b > MAX_CODE ? 'var(--warn)' : ''; };
  const runPv = () => { if (st.kind !== 'html' || !code.value.trim()) { $('#pvWrap').hidden = true; return; } $('#pv').replaceChildren(sandboxFrame(code.value, '미리보기')); $('#pvWrap').hidden = false; };
  let pvT; const schedulePv = (ms = 900) => { clearTimeout(pvT); pvT = setTimeout(runPv, ms); };
  // a pasted or loaded file can name itself: use its <title> when the title is still empty
  const adoptCode = (name = '') => {
    if (st.kind === 'html' && !title.value.trim()) { const m = code.value.match(/<title[^>]*>([^<]{2,120})<\/title>/i); if (m) title.value = m[1].trim(); }
    if (st.kind === 'code' && !$('#fLang').value.trim()) $('#fLang').value = LANG_BY_EXT[name.split('.').pop().toLowerCase()] || guessLang(code.value);
  };
  const onCode = () => { sz(); codeChecks(); schedulePv(); check(); draft(); };
  code.oninput = onCode; code.onpaste = () => setTimeout(() => { adoptCode(); check(); }, 0);
  code.onkeydown = (e) => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); code.setRangeText('  ', code.selectionStart, code.selectionEnd, 'end'); } };
  $('#pvBtn').onclick = runPv;
  app.querySelectorAll('[data-pvw]').forEach((b) => (b.onclick = () => { app.querySelectorAll('[data-pvw]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); $('#pv').classList.toggle('phone', b.dataset.pvw === 'phone'); }));
  const cf = $('#fCodeFile');
  $('#loadFile').onclick = () => cf.click();
  cf.onchange = async () => { const file = cf.files[0]; cf.value = ''; if (!file) return; if (file.size > MAX_CODE) { toast('파일이 400KB를 넘어요'); return; } code.value = await file.text(); adoptCode(file.name); onCode(); };
  // link posts: show what the link will look like
  const linkPrev = () => {
    const u = $('#fUrl').value.trim(), el = $('#linkPrev'); if (st.kind !== 'link' || !u) { el.innerHTML = ''; return; }
    if (!safeUrl(u)) { el.innerHTML = '<p class="hint warn">http:// 또는 https://로 시작하는 주소를 넣어 주세요.</p>'; return; }
    const yt = ytId(u);
    el.innerHTML = `<div class="linkcard static">${yt ? `<img class="lc-thumb" src="https://i.ytimg.com/vi/${yt}/mqdefault.jpg" alt="" referrerpolicy="no-referrer">` : `<span class="lc-ic">${icon('link')}</span>`}<span class="lc-t"><span class="d">${esc(domain(u))}</span><span>${esc(u)}</span></span></div><p class="hint">${yt ? '유튜브 영상이에요. 글에서 바로 재생돼요.' : '글에서 이 주소로 가는 카드가 보여요.'}</p>`;
  };
  $('#fUrl').addEventListener('input', () => { linkPrev(); check(); });
  kindSet(f.kind); sz(); codeChecks();
  app.querySelectorAll('[data-kind]').forEach((b) => (b.onclick = () => { st.kindTouched = true; kindSet(b.dataset.kind); draft(); }));
  $('#fCat').onchange = () => { S.lastCommunity = $('#fCat').value; const c = st.byId($('#fCat').value); if (!st.kindTouched && c) kindSet(c.defaultKind); check(); draft(); };
  const mdT = $('#mdToggle'), mdP = $('#mdPrev');
  mdT.onclick = () => { mdP.hidden = !mdP.hidden; mdT.textContent = mdP.hidden ? '미리보기' : '미리보기 닫기'; mdP.innerHTML = md(body.value) || '<span class="muted">내용이 없어요</span>'; };
  body.oninput = () => { if (!mdP.hidden) mdP.innerHTML = md(body.value); check(); draft(); };
  // formatting buttons wrap the selection (or drop in a starter) and keep the caret where typing continues
  const MD = { b: ['**', '**', '굵게'], code: ['`', '`', '코드'], link: ['[', '](https://)', '링크 글자'] };
  app.querySelectorAll('[data-md]').forEach((b) => (b.onclick = () => {
    const k = b.dataset.md, a = body.selectionStart, z = body.selectionEnd, sel = body.value.slice(a, z);
    if (MD[k]) { const [l, r, ph] = MD[k], t = sel || ph; body.setRangeText(l + t + r, a, z, 'end'); body.setSelectionRange(a + l.length, a + l.length + t.length); }
    else { const pre = k === 'ul' ? '- ' : '> ', t = (sel || (k === 'ul' ? '항목' : '인용할 문장')).split('\n').map((x) => pre + x).join('\n'); body.setRangeText((a && body.value[a - 1] !== '\n' ? '\n' : '') + t, a, z, 'end'); }
    body.focus(); body.dispatchEvent(new Event('input'));
  }));
  ['fTitle', 'fTool', 'fTags', 'fPrompt', 'fUrl', 'fLang'].forEach((id) => $('#' + id).addEventListener('input', () => { check(); draft(); }));
  const cd = $('#clearDraft'); if (cd) cd.onclick = () => { try { localStorage.removeItem(DRAFT); } catch { /* */ } S.c = null; renderCompose(v); };

  const upl = $('#upl'), drop = $('#drop'), fi = $('#fFile');
  const drawUpl = () => {
    upl.innerHTML = st.images.map((u, i) => `<div><img src="${esc(u)}" alt="">${i ? `<button type="button" class="mv" data-first="${i}" title="대표로">대표로</button>` : '<span class="cover-tag">대표</span>'}<button type="button" class="rm" data-rm="${i}" aria-label="이미지 빼기">✕</button></div>`).join('');
    upl.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = () => { st.images.splice(+b.dataset.rm, 1); drawUpl(); st.check(); draft(); }));
    upl.querySelectorAll('[data-first]').forEach((b) => (b.onclick = () => { st.images.unshift(st.images.splice(+b.dataset.first, 1)[0]); drawUpl(); draft(); }));
  };
  const addFiles = async (files) => {
    for (const file of [...files].filter((x) => /^image\/(png|jpeg|gif|webp)$/.test(x.type))) {
      if (st.images.length >= 8) { toast('이미지는 8장까지예요'); break; }
      if (file.size > 10 * 1024 * 1024) { toast('10MB보다 큰 이미지는 올릴 수 없어요'); continue; }
      $('#dropText').textContent = '올리는 중…';
      try { st.images.push(await api.uploadImage(file)); drawUpl(); st.check(); draft(); } catch (e) { toast(errMsg(e, '이미지를 올리지 못했어요')); }
    }
    $('#dropText').textContent = DROP_TEXT;
  };
  drop.onclick = () => fi.click(); drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); } };
  fi.onchange = () => { addFiles(fi.files); fi.value = ''; };
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); }; drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); addFiles(e.dataTransfer.files); };
  $('#cmp').addEventListener('paste', (e) => { const fs = [...(e.clipboardData?.files || [])]; if (fs.length && (st.kind === 'image' || st.kind === 'link')) { e.preventDefault(); addFiles(fs); } });
  drawUpl();
  const ai = $('#aiGo'); if (ai) ai.onclick = () => suggest(ai);
  $('#cmp').onsubmit = (e) => { e.preventDefault(); submit(v); };
}

function readForm() {
  const kind = S.c.kind, code = $('#fCode').value, hasCode = kind === 'html' || kind === 'code';
  return { communityId: $('#fCat').value, kind, title: $('#fTitle').value.trim(), body: $('#fBody').value.trim(), url: kind === 'link' ? $('#fUrl').value.trim() : '',
    code: hasCode ? code : '', codeLang: kind === 'code' ? $('#fLang').value.trim() : '', codeHead: kind === 'code' ? code.split('\n').slice(0, 8).join('\n').slice(0, 600) : '',
    tool: $('#fTool').value.trim(), prompt: $('#fPrompt').value.trim(), images: kind === 'image' || kind === 'link' ? [...S.c.images] : [],
    tags: [...new Set($('#fTags').value.split(',').map((t) => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean))].slice(0, 5).map((t) => t.slice(0, 24)) };
}
let draftT;
function draft() {
  if (S.c?.mode !== 'new') return; clearTimeout(draftT);
  draftT = setTimeout(() => { try { const f = readForm(); f.code = $('#fCode').value; f.url = $('#fUrl').value; localStorage.setItem(DRAFT, JSON.stringify({ ...f, images: S.c.images.filter((u) => !u.startsWith('data:')), tags: f.tags.join(', ') })); } catch { /* storage full */ } }, 500);
}

async function suggest(btn) {
  const out = $('#aiStatus'), f = readForm(); f.code = $('#fCode').value;
  if (!f.body && !f.code && !$('#fUrl').value && !f.title && !f.prompt) { out.textContent = '먼저 내용을 조금 넣어 주세요.'; return; }
  btn.disabled = true; out.textContent = '보는 중…';
  try {
    const r = await api.ai('classify', { draft: { title: f.title, tool: f.tool, url: $('#fUrl').value, body: f.body.slice(0, 2000), prompt: f.prompt.slice(0, 1000), code: f.code.slice(0, 1500) } });
    if (r.community) { const c = [...S.comms.values()].find((x) => x.slug === r.community); if (c && $(`#fCat option[value="${c.id}"]`)) $('#fCat').value = c.id; }
    if (r.kind && KINDS[r.kind]) app.querySelector(`[data-kind="${r.kind}"]`)?.click();
    if (r.title && !$('#fTitle').value.trim()) $('#fTitle').value = String(r.title).slice(0, 120);
    if (Array.isArray(r.tags) && !$('#fTags').value.trim()) $('#fTags').value = r.tags.slice(0, 5).join(', ');
    if (r.tool && !$('#fTool').value.trim()) $('#fTool').value = String(r.tool).slice(0, 40);
    out.textContent = '추천을 넣었어요. 이미 쓴 칸은 건드리지 않았어요.'; draft();
  } catch (e) { out.textContent = e.code === 'not_configured' ? '이 사이트에는 아직 Claude 연결이 설정되지 않았어요.' : e.code === 'rate_limited' ? '요청이 많아요. 잠시 후 다시 시도해 주세요.' : '추천을 받지 못했어요.'; }
  btn.disabled = false;
}

async function submit(v) {
  const st = $('#subStatus'), btn = $('#submitBtn'), f = readForm();
  const bad = (f.kind === 'link' && !safeUrl(f.url)) ? ['#fUrl', 'http:// 또는 https://로 시작하는 링크 주소를 넣어 주세요.']
    : f.kind === 'image' && !f.images.length ? ['#drop', '이미지를 한 장 이상 올려 주세요.'] : (f.kind === 'html' || f.kind === 'code') && !f.code.trim() ? ['#fCode', '코드를 넣어 주세요.']
    : new Blob([f.code]).size > MAX_CODE ? ['#fCode', '코드가 400KB를 넘어요.'] : f.kind === 'text' && !f.body ? ['#fBody', '본문을 적어 주세요.']
    : !f.title ? ['#fTitle', '제목을 적어 주세요.'] : !f.communityId ? ['#fCat', '올릴 커뮤니티를 골라 주세요.'] : null;
  if (bad) { st.textContent = bad[1]; const el = $(bad[0]); el.setAttribute('aria-invalid', 'true'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.focus({ preventScroll: true }); return; }
  btn.disabled = true; st.textContent = '올리는 중…';
  try {
    if (v.mode === 'edit') {
      const resolved = [...app.querySelectorAll('[data-addr]:checked')].map((b) => b.dataset.addr);
      const n = await api.saveVersion(v.id, f, $('#fNote').value.trim(), resolved);
      S.cache.delete(v.id); S.c = null; toast(`v${n}을 올렸어요`); go('/p/' + v.id); return;
    }
    const tr = v.mode === 'translate' ? { translationOf: v.id, lang: v.lang, note: v.lang === 'en' ? 'Language edition added' : '언어판 추가' } : {};
    const id = await api.createPost({ ...f, ...tr, remixOf: v.mode === 'remix' ? S.c.src.id : null, remixOfVersion: v.mode === 'remix' ? S.c.ver.n : null });
    if (v.mode === 'new') try { localStorage.removeItem(DRAFT); } catch { /* */ }
    if (tr.translationOf) S.cache.delete(v.id);
    S.c = null; toast(tr.translationOf ? '언어판을 올렸어요' : '올렸어요'); go('/p/' + id);
  } catch (e) { console.error(e); btn.disabled = false; st.textContent = v.mode === 'translate' && e?.code === '23505' ? '이 언어판은 이미 있어요.' : errMsg(e, '올리지 못했어요. 다시 시도해 주세요.'); }
}
