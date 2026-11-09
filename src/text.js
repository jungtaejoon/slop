// Escaping, markdown-lite (author text is always escaped first), line diff, time.

import { agoText } from './i18n.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const safeUrl = (u) => (/^https?:\/\/[^\s]+$/i.test(u || '') ? u : '');
// Images: https URLs or same-site relative paths (examples/x.svg). Anything with a scheme (javascript:, data:) is dropped.
export const safeImg = (u) => (/^https?:\/\/[^\s"'<>]+$/i.test(u || '') || /^[A-Za-z0-9_][A-Za-z0-9_./-]*$/.test(u || '') ? u : '');
export const safeImgs = (a) => (a || []).map(safeImg).filter(Boolean);
export const domain = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

export function md(src) {
  const blocks = []; let s = String(src || '').replace(/\r/g, '');
  s = s.replace(/```[^\n]*\n([\s\S]*?)```/g, (m, c) => { blocks.push(`<pre class="code">${esc(c.replace(/\n$/, ''))}</pre>`); return `\n\u0000${blocks.length - 1}\u0000\n`; });
  const L = 'target="_blank" rel="noopener noreferrer"';
  const inl = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, `<a href="$2" ${L}>$1</a>`)
    .replace(/(^|[\s(])(https?:\/\/[^\s<]+)/g, `$1<a href="$2" ${L}>$2</a>`);
  const out = []; let para = [], list = null;
  const fp = () => { if (para.length) { out.push('<p>' + para.map(inl).join('<br>') + '</p>'); para = []; } };
  const fl = () => { if (list) { out.push(`<${list.t}>${list.items.map((i) => '<li>' + inl(i) + '</li>').join('')}</${list.t}>`); list = null; } };
  for (const line of s.split('\n')) {
    let m; const tr = line.trim();
    if ((m = tr.match(/^\u0000(\d+)\u0000$/))) { fp(); fl(); out.push(blocks[+m[1]]); continue; }
    if (!tr) { fp(); fl(); continue; }
    if ((m = line.match(/^#{1,3}\s+(.*)/))) { fp(); fl(); out.push(`<h4>${inl(m[1])}</h4>`); continue; }
    if ((m = line.match(/^>\s?(.*)/))) { fp(); fl(); out.push(`<blockquote>${inl(m[1])}</blockquote>`); continue; }
    if ((m = line.match(/^\s*([-*]|\d+\.)\s+(.*)/))) { const t = /\d/.test(m[1]) ? 'ol' : 'ul'; fp(); if (list && list.t !== t) fl(); list ??= { t, items: [] }; list.items.push(m[2]); continue; }
    fl(); para.push(line);
  }
  fp(); fl(); return out.join('');
}

export function lineDiff(a, b) {
  const A = a.split('\n'), B = b.split('\n'); let s = 0; while (s < A.length && s < B.length && A[s] === B[s]) s++;
  let e = 0; while (e < A.length - s && e < B.length - s && A[A.length - 1 - e] === B[B.length - 1 - e]) e++;
  const a2 = A.slice(s, A.length - e), b2 = B.slice(s, B.length - e), N = a2.length, M = b2.length;
  if (N * M > 6e6) return null;
  const dp = []; for (let i = 0; i <= N; i++) dp.push(new Uint32Array(M + 1));
  for (let i = N - 1; i >= 0; i--) for (let j = M - 1; j >= 0; j--) dp[i][j] = a2[i] === b2[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = []; for (let k = 0; k < s; k++) out.push([' ', A[k]]);
  let i = 0, j = 0;
  while (i < N && j < M) { if (a2[i] === b2[j]) { out.push([' ', a2[i]]); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push(['-', a2[i++]]); else out.push(['+', b2[j++]]); }
  while (i < N) out.push(['-', a2[i++]]); while (j < M) out.push(['+', b2[j++]]);
  for (let k = A.length - e; k < A.length; k++) out.push([' ', A[k]]);
  return out;
}

export function diffHtml(a, b) {
  const d = lineDiff(a, b); if (!d) return '<div class="banner">너무 커서 변경점을 계산하지 않았어요.</div>';
  const add = d.filter((x) => x[0] === '+').length, del = d.filter((x) => x[0] === '-').length;
  const show = new Uint8Array(d.length);
  d.forEach((x, i) => { if (x[0] !== ' ') for (let k = Math.max(0, i - 3); k <= Math.min(d.length - 1, i + 3); k++) show[k] = 1; });
  let h = '', skip = 0;
  d.forEach((x, i) => { if (!show[i]) { skip++; return; } if (skip) { h += `<div class="gap">… ${skip}줄 동일 …</div>`; skip = 0; } h += `<div class="${x[0] === '+' ? 'a' : x[0] === '-' ? 'd' : ''}">${x[0]} ${esc(x[1])}</div>`; });
  if (skip) h += `<div class="gap">… ${skip}줄 동일 …</div>`;
  return `<div class="diff"><div class="gap"><span class="ok">+${add}</span> / <span class="warn">−${del}</span></div>${add + del ? h : '<div class="gap">변경 없음</div>'}</div>`;
}

export function ago(ts) {
  if (!ts) return ''; const s = (Date.now() - ts) / 1000;
  const en = agoText(s); if (en) return en;
  if (s < 60) return '방금'; if (s < 3600) return Math.floor(s / 60) + '분 전'; if (s < 86400) return Math.floor(s / 3600) + '시간 전';
  if (s < 86400 * 30) return Math.floor(s / 86400) + '일 전';
  const d = new Date(ts); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}
