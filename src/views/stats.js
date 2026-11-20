// admins: where visitors come from (referrals, one per browser session) and what they read (page_views)
import { api, S, $, app } from '../core.js';
import { esc } from '../text.js';

const GROUPS = [
  ['검색', ['google', 'naver', 'daum-kakao', 'bing', 'duckduckgo', 'yahoo']],
  ['SNS·커뮤니티', ['x', 'facebook', 'instagram', 'threads', 'youtube', 'reddit', 'linkedin', 'disquiet.io', 'github']],
  ['AI 답변', ['chatgpt', 'perplexity', 'claude']],
  ['내 블로그·사이트', ['slop-log', 'jungtaejoon.github.io', 'slop', 'curseforge']],
  ['직접·앱', ['direct', 'app']],
];
const NAMES = { google: 'Google', naver: '네이버', 'daum-kakao': '다음·카카오', bing: 'Bing', duckduckgo: 'DuckDuckGo', yahoo: 'Yahoo', x: 'X(트위터)', facebook: '페이스북',
  instagram: '인스타그램', threads: '스레드', youtube: '유튜브', reddit: '레딧', linkedin: '링크드인', 'disquiet.io': '디스콰이엇', github: 'GitHub', chatgpt: 'ChatGPT',
  perplexity: 'Perplexity', claude: 'Claude', 'slop-log': 'Slop 로그(블로그)', 'jungtaejoon.github.io': 'jungtaejoon.github.io', slop: 'Slop(slop.ai.kr)', curseforge: 'CurseForge', direct: '직접 입력·북마크', app: '안드로이드 앱' };
const groupOf = (s) => (GROUPS.find(([, l]) => l.includes(s)) || [s.startsWith('utm:') ? '캠페인 링크' : '기타 사이트'])[0];
const nameOf = (s) => NAMES[s] || (s.startsWith('utm:') ? `링크 표시 ${s.slice(4)}` : s);
const kst = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
const sum = (m, k, n) => m.set(k, (m.get(k) || 0) + n);
const sorted = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);
const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0) + '%';
let range = 7, site = 'slop', timer = null;
const BLOG = 'https://jungtaejoon.github.io/blog';

export async function renderStats() {
  clearInterval(timer);
  if (api.me?.role !== 'admin') { app.innerHTML = '<div class="banner warnb">관리자만 볼 수 있어요.</div>'; return; }
  if (!$('#statsRoot')) app.innerHTML = '<div id="statsRoot"><div class="skel"></div></div>';
  await draw();
  // keep it live while the page is open
  timer = setInterval(() => { if (S.view.name !== 'stats') return clearInterval(timer); if (!document.hidden) draw(); }, 60e3);
}

async function draw() {
  const since = kst(new Date(Date.now() - (range - 1) * 864e5)), today = kst();
  let refs = [], views = [], toSlop = 0;
  try {
    if (site === 'blog') {
      const [rows, slopRefs] = await Promise.all([api.blogStats(since), api.referralStats(since)]);
      // same shapes as the Slop data: visits by first page and source, views by page
      refs = rows.filter((r) => r.visits > 0).map((r) => ({ day: r.day, source: r.source, landing: r.path, visits: r.visits }));
      views = rows.map((r) => ({ day: r.day, path: r.path, views: r.views }));
      toSlop = slopRefs.filter((r) => r.source === 'slop-log').reduce((a, r) => a + r.visits, 0);
    } else [refs, views] = await Promise.all([api.referralStats(since), api.viewStatsSince(since)]);
  }
  catch (e) { console.error(e); $('#statsRoot').innerHTML = '<div class="banner warnb">통계를 불러오지 못했어요.</div>'; return; }
  if (S.view.name !== 'stats' || !$('#statsRoot')) return;

  const days = []; for (let i = range - 1; i >= 0; i--) days.push(kst(new Date(Date.now() - i * 864e5)));
  const visitsDay = new Map(), viewsDay = new Map(), bySrc = new Map(), byGroup = new Map(), byLand = new Map(), landSrc = new Map();
  refs.forEach((r) => { sum(visitsDay, r.day, r.visits); sum(bySrc, r.source, r.visits); sum(byGroup, groupOf(r.source), r.visits); sum(byLand, r.landing, r.visits);
    if (!landSrc.has(r.landing)) landSrc.set(r.landing, new Map()); sum(landSrc.get(r.landing), r.source, r.visits); });
  views.forEach((v) => sum(viewsDay, v.day, v.views));
  const totalV = [...visitsDay.values()].reduce((a, b) => a + b, 0), totalPV = [...viewsDay.values()].reduce((a, b) => a + b, 0);
  const todayV = visitsDay.get(today) || 0, searchV = byGroup.get('검색') || 0;
  const max = Math.max(1, ...days.map((d) => visitsDay.get(d) || 0));
  const blogLabel = (p) => { let t = p; try { t = decodeURIComponent(p); } catch { /* keep */ } return esc(t === '/' ? '홈 (한국어)' : t === '/en/' ? '홈 (영어)' : t.replace(/^\/(en\/)?(\d{4})\/(\d\d)\/(\d\d)\//, (m, en, y, mo, d) => `${en ? '[EN] ' : ''}${mo}.${d} `).replace(/\/$/, '')); };
  const label = site === 'blog' ? blogLabel : (p) => (p.startsWith('p/') ? esc(S.cache.get(p.slice(2))?.title || '글 ' + p.slice(2, 10)) : esc({ home: '홈', other: '기타 화면' }[p] || p));
  const href = site === 'blog' ? (p) => ` href="${BLOG}${esc(p)}" target="_blank" rel="noopener"` : (p) => (p === 'other' ? '' : ` href="#/${p === 'home' ? '' : esc(p)}"`);
  const topViewed = sorted(views.reduce((m, v) => sum(m, v.path, v.views), new Map())).slice(0, 15);
  const bars = (rows, total) => `<div class="vstats">${rows.map(([k, n, extra = '']) => `<div class="vrow"><span>${k}</span><i style="width:${Math.max(3, Math.round((n / Math.max(1, rows[0][1])) * 100))}%"></i><b class="mono">${n} <span class="muted">${pct(n, total)}</span></b>${extra}</div>`).join('')}</div>`;

  $('#statsRoot').innerHTML = `<div style="display:flex;flex-direction:column;gap:14px;max-width:880px">
    <div><h1>유입 모니터링</h1><p class="muted" style="margin:4px 0 0">방문은 브라우저 세션당 한 번, 처음 들어온 페이지와 출처만 세요. IP·쿠키 같은 개인 정보는 저장하지 않아요. 1분마다 새로 고쳐요.</p>
      <div class="chips" style="margin-top:8px">${[['slop', 'Slop'], ['blog', 'Slop 로그(블로그)']].map(([k, l]) => `<button class="chip${k === site ? ' on' : ''}" data-site="${k}" aria-pressed="${k === site}"><b>${l}</b></button>`).join('')}</div>
      <div class="chips" style="margin-top:6px">${[1, 7, 30, 90].map((n) => `<button class="chip${n === range ? ' on' : ''}" data-range="${n}" aria-pressed="${n === range}">${n === 1 ? '오늘' : `최근 ${n}일`}</button>`).join('')}</div></div>
    <div class="statcards">
      <div class="panel"><div class="hint">방문</div><b class="big mono">${totalV}</b></div>
      <div class="panel"><div class="hint">오늘 방문</div><b class="big mono">${todayV}</b></div>
      <div class="panel"><div class="hint">페이지 조회</div><b class="big mono">${totalPV}</b></div>
      <div class="panel"><div class="hint">검색 유입 비율</div><b class="big mono">${pct(searchV, totalV)}</b></div>
    </div>
    ${totalV ? '' : `<div class="banner">아직 유입 기록이 없어요. ${site === 'blog' ? '블로그 기록은 2026년 11월 20일부터 쌓여요.' : '유입 기록은 2026년 11월 20일부터 쌓여요. 페이지 조회 수는 그 전부터 있어요.'}</div>`}
    ${site === 'blog' ? `<p class="hint" style="margin:0">이 기간 블로그에서 Slop으로 넘어간 방문: <b class="mono">${toSlop}</b></p>` : ''}
    ${range > 1 ? `<section class="panel"><h2>날짜별 방문</h2><div class="vstats">${days.map((d) => { const n = visitsDay.get(d) || 0; return `<div class="vrow"><span class="mono">${d.slice(5)}</span><i style="width:${n ? Math.max(3, Math.round((n / max) * 100)) : 0}%"></i><b class="mono">${n} <span class="muted">· 조회 ${viewsDay.get(d) || 0}</span></b></div>`; }).join('')}</div></section>` : ''}
    <div class="statgrid">
      <section class="panel"><h2>유입 경로 묶음</h2>${totalV ? bars(sorted(byGroup).map(([g, n]) => [esc(g), n]), totalV) : '<p class="muted">기록 없음</p>'}</section>
      <section class="panel"><h2>출처 사이트</h2>${totalV ? bars(sorted(bySrc).slice(0, 15).map(([s, n]) => [esc(nameOf(s)), n]), totalV) : '<p class="muted">기록 없음</p>'}</section>
    </div>
    <section class="panel"><h2>처음 들어온 페이지</h2>${totalV ? `<div class="vstats">${sorted(byLand).slice(0, 15).map(([p, n]) => { const top = sorted(landSrc.get(p)).slice(0, 3).map(([s, m]) => `${esc(nameOf(s))} ${m}`).join(' · ');
      return `<div class="vrow"><a${href(p)} data-ugc>${label(p)}</a><b class="mono">${n}</b><div class="hint" style="grid-column:1/-1;margin:-2px 0 4px">${top}</div></div>`; }).join('')}</div>` : '<p class="muted">기록 없음</p>'}</section>
    ${site === 'blog' ? `<section class="panel"><h2>많이 본 글</h2>${topViewed.length ? `<div class="vstats">${topViewed.map(([p, n]) => `<div class="vrow"><a${href(p)}>${label(p)}</a><b class="mono">${n}</b></div>`).join('')}</div>` : '<p class="muted">기록 없음</p>'}</section>` : ''}
    <p class="hint">검색어는 구글·네이버가 넘겨주지 않아서 여기선 보이지 않아요. 검색어별 노출·클릭은 구글 서치 콘솔(실적)과 네이버 서치어드바이저(리포트)에서 봐요.</p>
  </div>`;
  $('#statsRoot').querySelectorAll('[data-site]').forEach((b) => b.addEventListener('click', () => { site = b.dataset.site; draw(); }));
  $('#statsRoot').querySelectorAll('[data-range]').forEach((b) => b.addEventListener('click', () => { range = +b.dataset.range; draw(); }));
}
