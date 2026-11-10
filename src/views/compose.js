import { api, S, $, app, KINDS, TOOLS, MAX_CODE, MAX_BODY, sandboxFrame, canWrite, isMod, remember, commBySlug, toast, errMsg, go, currentHash } from '../core.js';
import { esc, md, safeUrl, domain } from '../text.js';

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
  app.innerHTML = `<a class="crumb" href="${v.mode === 'new' ? (fromSlug ? '#/c/' + esc(fromSlug.slug) : '#/') : '#/p/' + v.id}">← 돌아가기</a><div class="compose"><form class="form" id="cmp" novalidate>
    <h1>${head}</h1>${v.mode === 'translate' ? `<div class="banner" style="margin:0">원본 글과 같은 커뮤니티에 올라가고, 글 화면에서 언어를 골라 볼 수 있게 묶여요. 제목·본문·코드를 ${LN[v.lang]}로 바꿔 주세요.</div>` : ''}${st.restored ? '<div class="banner" style="margin:0">작성하던 초안을 불러왔어요. <button type="button" class="linkbtn" id="clearDraft">비우기</button></div>' : ''}
    <div class="grid2"><div class="field"><label for="fCat">커뮤니티</label><select id="fCat"${v.mode === 'edit' || v.mode === 'translate' ? ' disabled' : ''}><option value="">커뮤니티를 고르세요</option>${followed.length ? `<optgroup label="팔로우 중">${followed.map(opt).join('')}</optgroup>` : ''}${others.length ? `<optgroup label="다른 커뮤니티">${others.map(opt).join('')}</optgroup>` : ''}</select>
        <span class="hint">맞는 곳이 없으면 <a href="#/communities/new">새로 만들 수 있어요</a>.</span></div>
      <div class="field"><label for="fTool">만든 도구</label><input type="text" id="fTool" list="toolList" maxlength="40" value="${esc(f.tool)}" placeholder="예: Claude, Midjourney, Suno"><datalist id="toolList">${TOOLS.map((t) => `<option value="${esc(t)}">`).join('')}</datalist></div></div>
    <div class="field"><span class="flabel">형식</span><div class="kinds" role="group">${Object.entries(KINDS).map(([k, [l, dd]]) => `<button type="button" data-kind="${k}" aria-pressed="${f.kind === k}">${l}<small>${dd}</small></button>`).join('')}</div></div>
    <div class="field"><label for="fTitle">제목</label><input type="text" id="fTitle" maxlength="120" value="${esc(f.title)}" placeholder="무엇을 만들었고, 어디가 볼 만한가요?"></div>
    <div class="field" data-for="link"><label for="fUrl">링크 주소</label><input type="url" id="fUrl" value="${esc(f.url)}" placeholder="https://"></div>
    <div class="field" data-for="image"><span class="flabel">이미지</span><div class="drop" id="drop" tabindex="0" role="button">여기로 끌어 놓거나, 붙여 넣거나, 눌러서 고르세요 (최대 8장, 장당 10MB)</div><input type="file" id="fFile" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden><div class="upl" id="upl"></div></div>
    <div class="field" data-for="html code"><label for="fCode" id="codeLabel">코드</label><textarea id="fCode" class="codeed" spellcheck="false">${esc(f.code)}</textarea>
      <div class="row"><span class="hint" id="codeSize"></span><span class="sp"></span><input type="text" id="fLang" data-for="code" style="width:150px" maxlength="20" value="${esc(f.codeLang)}" placeholder="언어 (예: python)"><button type="button" class="btn sm" id="pvBtn" data-for="html">미리 실행</button></div>
      <div class="stage" id="pvWrap" hidden><div class="runner" id="pv"></div></div></div>
    <div class="field"><label for="fBody" id="bodyLabel">본문</label><textarea id="fBody" rows="7" maxlength="${MAX_BODY}">${esc(f.body)}</textarea>
      <div class="row"><span class="hint">**굵게**, \`코드\`, - 목록, &gt; 인용, 링크는 자동 연결돼요</span><span class="sp"></span><button type="button" class="linkbtn" id="mdToggle">미리보기</button></div><div class="mdprev md" id="mdPrev" hidden></div></div>
    <details class="prompt"${f.prompt ? ' open' : ''}><summary>사용한 프롬프트 (선택, 강력 추천)</summary><textarea id="fPrompt" rows="4" maxlength="8000" style="margin-top:8px" placeholder="어떤 프롬프트로 만들었나요? 다른 사람이 재현하고 개선하는 데 도움이 돼요.">${esc(f.prompt)}</textarea></details>
    <div class="field"><label for="fTags">태그</label><input type="text" id="fTags" value="${esc(f.tags)}" placeholder="쉼표로 구분, 최대 5개"></div>
    ${v.mode === 'edit' ? `<div class="field"><label for="fNote">무엇이 바뀌었나요?</label><input type="text" id="fNote" maxlength="200" placeholder="예: 댓글 의견대로 색 대비를 높였어요">
      ${open.length ? `<span class="hint">아래 개선 제안·질문 중 이번에 반영한 것을 고르면 "v${src.version + 1}에서 반영"으로 표시되고, 쓴 사람에게 알림이 가요.</span><div class="addr">${open.map((c) => `<label><input type="checkbox" data-addr="${c.id}"><span><b>${esc(c.author?.name || '')}</b> ${esc(c.text.slice(0, 200))}</span></label>`).join('')}</div>` : ''}</div>` : ''}
    <div class="row"><button class="btn pri" type="submit" id="submitBtn">${v.mode === 'edit' ? '새 버전 올리기' : '올리기'}</button><span class="hint" id="subStatus" role="status"></span></div>
  </form>
  <aside class="side"><section class="panel"><h2>좋은 글의 조건</h2><ul><li>어떤 도구로, 어떤 프롬프트로 만들었는지 적어요.</li><li>어디가 볼 만한지 한두 줄로 설명해요.</li><li>맞는 게시판과 형식을 골라요. 웹·게임은 실행물로 올리면 바로 돌려볼 수 있어요.</li><li>실행물은 격리된 샌드박스에서 돌아가요. 외부 주소로 데이터를 보내는 코드는 신고 대상이에요.</li></ul></section>
    ${api.aiAvailable ? '<section class="panel"><h2>Claude 도우미</h2><p>내용을 보고 게시판, 형식, 제목, 태그를 추천해 줘요. 이미 쓴 칸은 건드리지 않아요.</p><button type="button" class="btn sm" id="aiGo">분류·제목 추천받기</button><p class="hint" id="aiStatus" style="margin:8px 0 0"></p></section>' : ''}</aside></div>`;
  bind(v, f);
}

function bind(v, f) {
  const st = S.c;
  const kindSet = (k) => {
    st.kind = k; app.querySelectorAll('[data-kind]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === k)));
    app.querySelectorAll('[data-for]').forEach((el) => (el.hidden = !el.dataset.for.split(' ').includes(k)));
    $('#pvWrap').hidden = k !== 'html' || !$('#pv').firstChild;
    $('#codeLabel').textContent = k === 'html' ? 'HTML 코드 (한 파일)' : '코드';
    $('#fCode').placeholder = k === 'html' ? '<!doctype html> … AI가 만들어 준 HTML 파일 전체를 붙여 넣으세요' : '코드를 붙여 넣으세요';
    $('#bodyLabel').textContent = k === 'text' ? '본문' : '설명 (선택)';
  };
  kindSet(f.kind);
  app.querySelectorAll('[data-kind]').forEach((b) => (b.onclick = () => { st.kindTouched = true; kindSet(b.dataset.kind); draft(); }));
  $('#fCat').onchange = () => { S.lastCommunity = $('#fCat').value; const c = st.byId($('#fCat').value); if (!st.kindTouched && c) kindSet(c.defaultKind); draft(); };
  const code = $('#fCode'), sz = () => { const b = new Blob([code.value]).size; $('#codeSize').textContent = `${(b / 1024).toFixed(1)} KB / 200 KB`; $('#codeSize').style.color = b > MAX_CODE ? 'var(--warn)' : ''; };
  const runPv = () => { if (!code.value.trim()) return; $('#pv').replaceChildren(sandboxFrame(code.value, '미리보기')); $('#pvWrap').hidden = false; };
  code.oninput = () => { sz(); draft(); }; sz();
  code.onkeydown = (e) => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); code.setRangeText('  ', code.selectionStart, code.selectionEnd, 'end'); } };
  $('#pvBtn').onclick = runPv;
  $('#fUrl').onchange = () => { const u = $('#fUrl').value.trim(); if (u && !$('#fTitle').value) $('#fTitle').placeholder = `${domain(u)}에서 찾은 …`; };
  const mdT = $('#mdToggle'), mdP = $('#mdPrev');
  mdT.onclick = () => { mdP.hidden = !mdP.hidden; mdT.textContent = mdP.hidden ? '미리보기' : '미리보기 닫기'; mdP.innerHTML = md($('#fBody').value) || '<span class="muted">내용이 없어요</span>'; };
  $('#fBody').oninput = () => { if (!mdP.hidden) mdP.innerHTML = md($('#fBody').value); draft(); };
  ['fTitle', 'fTool', 'fTags', 'fPrompt', 'fUrl', 'fLang'].forEach((id) => $('#' + id).addEventListener('input', draft));
  const cd = $('#clearDraft'); if (cd) cd.onclick = () => { try { localStorage.removeItem(DRAFT); } catch { /* */ } S.c = null; renderCompose(v); };

  const upl = $('#upl'), drop = $('#drop'), fi = $('#fFile');
  const drawUpl = () => { upl.innerHTML = st.images.map((u, i) => `<div><img src="${esc(u)}" alt=""><button type="button" data-rm="${i}" aria-label="이미지 빼기">✕</button></div>`).join(''); upl.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = () => { st.images.splice(+b.dataset.rm, 1); drawUpl(); draft(); })); };
  const addFiles = async (files) => {
    for (const file of [...files].filter((x) => /^image\/(png|jpeg|gif|webp)$/.test(x.type))) {
      if (st.images.length >= 8) { toast('이미지는 8장까지예요'); break; }
      if (file.size > 10 * 1024 * 1024) { toast('10MB보다 큰 이미지는 올릴 수 없어요'); continue; }
      drop.textContent = '올리는 중…';
      try { st.images.push(await api.uploadImage(file)); drawUpl(); draft(); } catch (e) { toast(errMsg(e, '이미지를 올리지 못했어요')); }
    }
    drop.textContent = '여기로 끌어 놓거나, 붙여 넣거나, 눌러서 고르세요 (최대 8장, 장당 10MB)';
  };
  drop.onclick = () => fi.click(); drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); } };
  fi.onchange = () => { addFiles(fi.files); fi.value = ''; };
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); }; drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); addFiles(e.dataTransfer.files); };
  $('#cmp').addEventListener('paste', (e) => { const fs = [...(e.clipboardData?.files || [])]; if (fs.length && st.kind === 'image') { e.preventDefault(); addFiles(fs); } });
  drawUpl();
  const ai = $('#aiGo'); if (ai) ai.onclick = () => suggest(ai);
  $('#cmp').onsubmit = (e) => { e.preventDefault(); submit(v); };
}

function readForm() {
  const kind = S.c.kind, code = $('#fCode').value, hasCode = kind === 'html' || kind === 'code';
  return { communityId: $('#fCat').value, kind, title: $('#fTitle').value.trim(), body: $('#fBody').value.trim(), url: kind === 'link' ? $('#fUrl').value.trim() : '',
    code: hasCode ? code : '', codeLang: kind === 'code' ? $('#fLang').value.trim() : '', codeHead: kind === 'code' ? code.split('\n').slice(0, 8).join('\n').slice(0, 600) : '',
    tool: $('#fTool').value.trim(), prompt: $('#fPrompt').value.trim(), images: kind === 'image' ? [...S.c.images] : [],
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
  const err = !f.communityId ? '올릴 커뮤니티를 골라 주세요.' : !f.title ? '제목을 적어 주세요.' : f.kind === 'link' && !safeUrl(f.url) ? 'http:// 또는 https://로 시작하는 링크 주소를 넣어 주세요.'
    : f.kind === 'image' && !f.images.length ? '이미지를 한 장 이상 올려 주세요.' : (f.kind === 'html' || f.kind === 'code') && !f.code.trim() ? '코드를 넣어 주세요.'
    : new Blob([f.code]).size > MAX_CODE ? '코드가 200KB를 넘어요.' : f.kind === 'text' && !f.body ? '본문을 적어 주세요.' : '';
  if (err) { st.textContent = err; return; }
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
