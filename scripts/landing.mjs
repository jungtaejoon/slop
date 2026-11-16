// Collection pages for people who search before they know the name "Slop":
// "AI-made games to try", "rate AI apps" and their Korean versions.
//
// Each card shows the post's preview image; "Play here" loads the post's code
// from Supabase and runs it on this page in the same sandbox the app uses
// (scripts only, no same-origin), and ▲ gem / ▼ slop open the post with
// ?vote=1 / ?vote=-1, where the app casts that verdict (guests need no account).
// Plain static HTML, rebuilt with the share pages every 3 hours.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clip = (s, n) => { const t = String(s || '').replace(/[#*`>\[\]]/g, '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

export const COLLECTIONS = [
  {
    key: 'games', path: { en: 'ai-games/', ko: 'ko/ai-games/' },
    pick: (p) => p.kind === 'html' && p.community_slug === 'game',
    en: {
      title: 'AI-Made Games You Can Play in Your Browser',
      desc: 'Browser games made with AI tools such as Claude. Play each one right on the page, no install, then vote gem or slop.',
      lead: 'Every game here was made with an AI tool such as Claude. Play them right on this page with nothing to install, then vote <b class="g">▲ gem</b> if it was worth your time or <b class="s">▼ slop</b> if it wasn\'t.',
      nav: 'AI-made games',
    },
    ko: {
      title: 'AI로 만든 게임 모음: 브라우저에서 바로 해 보기',
      desc: 'Claude 같은 AI 도구로 만든 브라우저 게임 모음. 설치 없이 이 페이지에서 바로 해 보고 보석인지 슬롭인지 판정해 보세요.',
      lead: 'Claude 같은 AI 도구로 만든 게임들이에요. 설치 없이 이 페이지에서 바로 해 보고, 할 만하면 <b class="g">▲ 보석</b>, 아니면 <b class="s">▼ 슬롭</b>으로 판정해 주세요.',
      nav: 'AI 게임 모음',
    },
  },
  {
    key: 'apps', path: { en: 'rate-ai-apps/', ko: 'ko/rate-ai-apps/' },
    pick: (p) => p.kind === 'html' && p.community_slug !== 'game',
    en: {
      title: 'Rate AI-Made Apps: Gem or Slop?',
      desc: 'Small apps and tools built with AI. Try each one right here, then rate it gem or slop. Voting needs no account.',
      lead: 'Small apps, tools and toys built with AI. Try each one right here, then judge it: <b class="g">▲ gem</b> if it\'s useful or fun, <b class="s">▼ slop</b> if it isn\'t. Voting needs no account.',
      nav: 'Rate AI apps',
    },
    ko: {
      title: 'AI로 만든 앱 판정하기: 보석일까, 슬롭일까',
      desc: 'AI로 만든 작은 앱과 도구 모음. 이 페이지에서 바로 써 보고 보석인지 슬롭인지 판정해 보세요. 가입 없이 판정할 수 있어요.',
      lead: 'AI로 만든 작은 앱, 도구, 장난감들이에요. 여기서 바로 써 보고 쓸모 있거나 재밌으면 <b class="g">▲ 보석</b>, 아니면 <b class="s">▼ 슬롭</b>으로 판정해 주세요. 판정은 가입 없이 할 수 있어요.',
      nav: 'AI 앱 판정하기',
    },
  },
];

const T = {
  en: {
    play: '▶ Play here', open: 'Details & comments', gem: '▲ Gem', slop: '▼ Slop', stop: 'Close', full: 'Fullscreen', loading: 'Loading…', fail: 'Could not load it. Open the post instead.',
    none: 'No votes yet: be the first', votes: (pct, n) => `${pct}% gem · ${n} vote${n === 1 ? '' : 's'}`, made: (t) => `made with ${t}`,
    steps: ['<b>Try it.</b> Press Play: it runs right here, safely sandboxed.', '<b>Judge it.</b> ▲ gem or ▼ slop takes you to the post with your vote in.', '<b>Say why.</b> A one-line reason helps the maker and the next visitor.'],
    faqT: 'Questions', updated: (d) => `Updated every 3 hours · last ${d}`, judge: 'Judge one at a time →', best: 'This week\'s top gems', home: 'Go to Slop', other: 'Also see', lang: '한국어', post: 'Post your own AI-made thing',
    faq: [
      ['What is Slop?', 'A community where people try AI-made things (games, apps, images, writing, code) and vote ▲ gem or ▼ slop, with a reason. Makers use the feedback to post better versions.'],
      ['Is it safe to run these here?', 'Yes. Each one runs in a sandboxed frame that can\'t see your account, your cookies or the rest of this page.'],
      ['Do I need an account to vote?', 'No. Votes work as a guest. Sign up only if you want to comment or post your own work.'],
      ['Can I add my own AI-made game or app?', 'Yes. Paste the HTML that your AI tool produced into a new post and it runs right in the page, like everything here.'],
    ],
  },
  ko: {
    play: '▶ 여기서 바로 해 보기', open: '자세히 · 의견', gem: '▲ 보석이다', slop: '▼ 슬롭이다', stop: '닫기', full: '전체화면', loading: '불러오는 중…', fail: '불러오지 못했어요. 글에서 열어 주세요.',
    none: '아직 판정 없음 · 첫 판정을 남겨 보세요', votes: (pct, n) => `${pct}% 보석 판정 · ${n}표`, made: (t) => `${t}로 만듦`,
    steps: ['<b>해 보기.</b> 바로 해 보기를 누르면 이 자리에서 안전하게 실행돼요.', '<b>판정하기.</b> ▲ 보석 / ▼ 슬롭을 누르면 판정이 들어간 채로 글이 열려요.', '<b>이유 남기기.</b> 한 줄 이유가 만든 사람과 다음 사람에게 큰 도움이 돼요.'],
    faqT: '자주 묻는 질문', updated: (d) => `3시간마다 갱신 · 마지막 ${d}`, judge: '하나씩 넘기며 판정하기 →', best: '이번 주 보석', home: 'Slop으로 가기', other: '다른 모음', lang: 'English', post: '내가 AI로 만든 것 올리기',
    faq: [
      ['Slop은 어떤 곳인가요?', 'AI로 만든 게임, 앱, 이미지, 글, 코드를 직접 써 보고 ▲ 보석 / ▼ 슬롭으로 판정하고 이유를 남기는 커뮤니티예요. 만든 사람은 의견을 반영해 다음 버전을 올려요.'],
      ['여기서 실행해도 안전한가요?', '네. 각 실행물은 격리된 창(sandbox)에서 돌아가서 내 계정, 쿠키, 이 페이지의 다른 부분에 접근할 수 없어요.'],
      ['판정하려면 가입해야 하나요?', '아니요. 판정은 가입 없이 할 수 있어요. 의견을 남기거나 직접 올리려면 가입해 주세요.'],
      ['내가 AI로 만든 게임이나 앱도 올릴 수 있나요?', '네. AI 도구가 만들어 준 HTML을 새 글에 붙여 넣으면 여기 있는 것들처럼 페이지 안에서 바로 실행돼요.'],
    ],
  },
};

const rank = (list) => list.slice().sort((a, b) => (b.up_count - b.down_count) - (a.up_count - a.down_count)
  || (b.up_count + b.down_count) - (a.up_count + a.down_count) || Date.parse(b.created_at) - Date.parse(a.created_at));

export function landingPages({ posts, SITE, supabaseUrl, supabaseKey, imageOf, isKorean, commName }) {
  const out = [], stamp = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  for (const c of COLLECTIONS) for (const lang of ['ko', 'en']) {
    const t = T[lang], m = c[lang], url = SITE + c.path[lang], alt = SITE + c.path[lang === 'ko' ? 'en' : 'ko'];
    const list = rank(posts.filter((p) => c.pick(p) && (lang === 'ko') === isKorean(p.title)));
    if (list.length < 3) continue;
    const others = COLLECTIONS.filter((o) => o !== c).map((o) => `<a href="${SITE}${o.path[lang]}">${esc(o[lang].nav)}</a>`).join('');
    const cards = list.map((p) => {
      const tot = p.up_count + p.down_count, pct = tot ? Math.round((p.up_count / tot) * 100) : 0, purl = `${SITE}p/${p.id}/`, img = imageOf(p);
      const meta = [commName(p.community_name, lang), p.tool && t.made(p.tool)].filter(Boolean).join(' · ');
      return `<article class="card" id="p-${p.id}">
<div class="stage" data-id="${p.id}" data-title="${esc(p.title)}">${img ? `<img src="${esc(img)}" alt="" loading="lazy" width="1200" height="630">` : '<div class="ph"></div>'}<button type="button" class="play">${t.play}</button></div>
<div class="body"><p class="meta">${esc(meta)}</p><h2><a href="${purl}">${esc(p.title)}</a></h2>${p.excerpt ? `<p class="ex">${esc(clip(p.excerpt, 110))}</p>` : ''}
<div class="vbar" aria-hidden="true"><i style="width:${pct}%"></i></div><p class="vn"><span class="g">▲ ${p.up_count}</span><span>${tot ? t.votes(pct, tot) : t.none}</span><span class="s">▼ ${p.down_count}</span></p>
<div class="acts"><a class="vb g" href="${purl}?vote=1" rel="nofollow">${t.gem}</a><a class="vb s" href="${purl}?vote=-1" rel="nofollow">${t.slop}</a><a class="more" href="${purl}">${t.open}</a></div></div></article>`;
    }).join('\n');
    const ld = [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: m.title, description: m.desc, url, inLanguage: lang, isPartOf: { '@type': 'WebSite', name: 'Slop', url: SITE },
        mainEntity: { '@type': 'ItemList', numberOfItems: list.length, itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}p/${p.id}/`, name: p.title })) } },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: t.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ];
    const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(m.title)} · Slop</title>
<meta name="description" content="${esc(m.desc)}"><link rel="canonical" href="${url}">
<link rel="alternate" hreflang="${lang}" href="${url}"><link rel="alternate" hreflang="${lang === 'ko' ? 'en' : 'ko'}" href="${alt}"><link rel="alternate" hreflang="x-default" href="${SITE}${c.path.en}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Slop"><meta property="og:locale" content="${lang === 'ko' ? 'ko_KR' : 'en_US'}">
<meta property="og:title" content="${esc(m.title)}"><meta property="og:description" content="${esc(m.desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}${lang === 'ko' ? 'og-ko.png' : 'og.png'}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(m.title)}"><meta name="twitter:description" content="${esc(m.desc)}"><meta name="twitter:image" content="${SITE}${lang === 'ko' ? 'og-ko.png' : 'og.png'}">
<link rel="icon" href="${SITE}icon-192.png"><meta name="theme-color" content="#0D9488">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<style>${CSS}</style></head><body>
<header class="top"><a class="logo" href="${SITE}"><img src="${SITE}icon-192.png" alt="" width="28" height="28"><span>Slop<i>.</i></span></a><nav>${others}<a href="${alt}" hreflang="${lang === 'ko' ? 'en' : 'ko'}">${t.lang}</a></nav></header>
<main>
<section class="hero"><h1>${esc(m.title)}</h1><p class="lead">${m.lead}</p>
<ol class="steps">${t.steps.map((s) => `<li>${s}</li>`).join('')}</ol></section>
<section class="grid">${cards}</section>
<p class="cta"><a class="btn pri" href="${SITE}#/judge">${t.judge}</a><a class="btn" href="${SITE}#/submit">${t.post}</a></p>
<section class="faq"><h2>${t.faqT}</h2>${t.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
</main>
<footer><p>${t.updated(stamp)}</p><p><a href="${SITE}">${t.home}</a> · <a href="${SITE}best/">${t.best}</a> · ${others}</p></footer>
<script>
(function(){var U=${JSON.stringify(supabaseUrl)},K=${JSON.stringify(supabaseKey)},L=${JSON.stringify({ stop: t.stop, full: t.full, loading: t.loading, fail: t.fail })},cur=null;
function restore(){if(!cur)return;cur.el.innerHTML=cur.html;cur.el.classList.remove('live');bind(cur.el);cur=null;}
function bind(st){var b=st.querySelector('.play');if(b)b.onclick=function(){run(st);};}
function run(st){restore();var html=st.innerHTML;cur={el:st,html:html};st.classList.add('live');st.innerHTML='<p class="wait">'+L.loading+'</p>';
fetch(U+'/rest/v1/posts?select=code&id=eq.'+st.dataset.id,{headers:{apikey:K,Authorization:'Bearer '+K}}).then(function(r){return r.json();}).then(function(rows){
if(!cur||cur.el!==st)return;var code=rows&&rows[0]&&rows[0].code;if(!code)throw 0;
var f=document.createElement('iframe');f.setAttribute('sandbox','allow-scripts allow-pointer-lock allow-modals');f.setAttribute('referrerpolicy','no-referrer');f.title=st.dataset.title;f.srcdoc=code;
var bar=document.createElement('div');bar.className='sbar';bar.innerHTML='<button type="button" class="full">'+L.full+'</button><button type="button" class="stop">'+L.stop+'</button>';
st.innerHTML='';st.append(f,bar);bar.querySelector('.stop').onclick=restore;
bar.querySelector('.full').onclick=function(){var q=st.requestFullscreen||st.webkitRequestFullscreen;if(q)q.call(st);f.focus();};
setTimeout(function(){f.focus();},80);}).catch(function(){if(cur&&cur.el===st)st.innerHTML='<p class="wait">'+L.fail+'</p>';});}
document.querySelectorAll('.stage').forEach(bind);})();
</script>
</body></html>`;
    out.push({ path: c.path[lang], html, url, count: list.length });
  }
  return out;
}

const CSS = `:root{--bg:#F7F7F5;--surface:#fff;--sunk:#F0F0EC;--ink:#111316;--muted:#646A73;--line:#E7E6E1;--gem:#0D9488;--gem-soft:#E2F4F1;--slop:#D9672A;--slop-soft:#FBEDE3;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#0A0B0D;--surface:#121418;--sunk:#191C21;--ink:#F1F2F4;--muted:#949AA4;--line:#22252B;--gem:#2DD4BF;--gem-soft:#0E2826;--slop:#FB923C;--slop-soft:#2B1B10;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 "Pretendard Variable",Pretendard,system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;letter-spacing:-.01em}
a{color:inherit}main,header.top,footer{max-width:1120px;margin:0 auto;padding:0 16px}
header.top{display:flex;align-items:center;gap:16px;padding-top:16px;padding-bottom:16px;flex-wrap:wrap}
.logo{display:flex;align-items:center;gap:8px;text-decoration:none;font-weight:800;font-size:20px}.logo img{border-radius:8px}.logo i{color:var(--gem);font-style:normal}
header nav{margin-left:auto;display:flex;gap:14px;flex-wrap:wrap;font-size:14px}header nav a{color:var(--muted);text-decoration:none}header nav a:hover{color:var(--ink)}
.hero{padding:28px 0 8px}h1{font-size:clamp(28px,5vw,44px);line-height:1.15;letter-spacing:-.035em;margin:0 0 14px;font-weight:800}
.lead{font-size:17px;color:var(--muted);max-width:720px;margin:0 0 18px}.g{color:var(--gem)}.s{color:var(--slop)}
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;padding:0;margin:0 0 26px;list-style:none;counter-reset:s}
.steps li{counter-increment:s;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 14px 12px 44px;position:relative;font-size:14px;color:var(--muted)}
.steps li:before{content:counter(s);position:absolute;left:14px;top:12px;width:20px;height:20px;border-radius:6px;background:var(--sunk);color:var(--ink);font-size:12px;font-weight:700;display:grid;place-items:center}.steps b{color:var(--ink)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column}
.stage{position:relative;aspect-ratio:1200/630;background:#0b0c10;overflow:hidden}.stage img,.stage .ph{width:100%;height:100%;object-fit:cover;display:block}
.stage.live{aspect-ratio:4/3}.stage iframe{border:0;width:100%;height:100%;display:block;background:#fff}
.play{position:absolute;right:12px;bottom:12px;border:0;border-radius:999px;padding:10px 18px;font:inherit;font-weight:700;background:#fff;color:#111;box-shadow:0 6px 24px rgb(0 0 0/.35);cursor:pointer}
.play:hover{transform:scale(1.04)}.wait{color:#cfd3d8;display:grid;place-items:center;height:100%;margin:0;padding:16px;text-align:center}
.sbar{position:absolute;right:8px;top:8px;display:flex;gap:6px}.sbar button{border:0;border-radius:999px;padding:5px 11px;font:inherit;font-size:12px;font-weight:600;background:rgb(0 0 0/.6);color:#fff;cursor:pointer}
.stage:fullscreen{aspect-ratio:auto}
.body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:6px;flex:1}.meta{margin:0;font-size:12.5px;color:var(--muted)}
h2{margin:0;font-size:17px;line-height:1.35;letter-spacing:-.02em}h2 a{text-decoration:none}h2 a:hover{text-decoration:underline}.ex{margin:0;font-size:13.5px;color:var(--muted)}
.vbar{height:6px;border-radius:99px;background:var(--slop-soft);overflow:hidden;margin-top:auto}.vbar i{display:block;height:100%;background:var(--gem)}
.vn{display:flex;justify-content:space-between;gap:8px;margin:0;font-size:12.5px;color:var(--muted)}.vn .g,.vn .s{font-weight:700}
.acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}.vb{flex:1;text-align:center;text-decoration:none;font-weight:700;font-size:14px;padding:8px 10px;border-radius:10px;border:1px solid}
.vb.g{background:var(--gem-soft);border-color:var(--gem)}.vb.s{background:var(--slop-soft);border-color:var(--slop)}.more{align-self:center;font-size:13px;color:var(--muted)}
.cta{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:30px 0}.btn{text-decoration:none;font-weight:700;padding:11px 18px;border-radius:12px;border:1px solid var(--line);background:var(--surface)}.btn.pri{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.faq{max-width:760px;margin:0 auto 30px}.faq h2{font-size:22px;margin-bottom:10px}.faq details{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin-bottom:8px}
.faq summary{font-weight:700;cursor:pointer}.faq p{margin:8px 0 0;color:var(--muted)}
footer{border-top:1px solid var(--line);padding-top:16px;padding-bottom:30px;color:var(--muted);font-size:13px}footer p{margin:4px 0}footer a{color:var(--muted)}
@media (max-width:520px){.grid{grid-template-columns:1fr}.lead{font-size:16px}}`;
