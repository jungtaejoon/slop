// Emails the site owner the moment someone else posts or comments on Slop.
// Called by the notify_owner() database trigger with {type: 'posts'|'comments', id}.
// It trusts nothing in the request: it reads the row itself with the service key,
// only mails rows made in the last 15 minutes by someone other than the owner,
// and mails each row at most once (notify_log), so calling it by hand does no harm.
// Secrets (Supabase → Edge Functions → Secrets): GMAIL_USER, GMAIL_APP_PASSWORD, optional NOTIFY_TO.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import nodemailer from 'npm:nodemailer@6.9.16';

const OWNER = 'jungtaejoon';
const SITE = 'https://slop.ai.kr/';
const reply = (status: number, msg: string) => new Response(msg, { status });
const clip = (s: string, n: number) => { const t = (s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, 'POST only');
  let body: { type?: string; id?: string };
  try { body = await req.json(); } catch { return reply(400, 'bad json'); }
  const { type, id } = body || {};
  if (!['posts', 'comments'].includes(type || '') || !/^[0-9a-f-]{36}$/.test(id || '')) return reply(400, 'bad request');

  const user = Deno.env.get('GMAIL_USER'), pass = Deno.env.get('GMAIL_APP_PASSWORD');
  if (!user || !pass) return reply(503, 'mail not configured');
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  const sel = type === 'posts' ? 'id,title,body,kind,created_at,author_id,community_id' : 'id,text,post_id,parent_id,created_at,author_id';
  const { data: row } = await sb.from(type!).select(sel).eq('id', id!).maybeSingle();
  if (!row) return reply(404, 'not found');
  if (Date.now() - Date.parse(row.created_at) > 15 * 60e3) return reply(409, 'too old');
  const { data: author } = await sb.from('profiles').select('username,display_name,is_guest').eq('id', row.author_id).maybeSingle();
  if (author?.username === OWNER) return reply(200, 'owner, skipped');

  // claim it first so two calls can never send twice
  const { error: dup } = await sb.from('notify_log').insert({ kind: type, id });
  if (dup) return reply(200, 'already sent');

  const who = author ? `${author.display_name || author.username} (@${author.username}${author.is_guest ? ', 게스트' : ''})` : '알 수 없는 사용자';
  let subject: string, text: string;
  if (type === 'posts') {
    const { data: c } = row.community_id ? await sb.from('communities').select('name').eq('id', row.community_id).maybeSingle() : { data: null };
    subject = `[Slop] 새 글: ${clip(row.title, 80)}`;
    text = `${who}님이 ${c?.name ? `c/${c.name}에 ` : ''}새 글을 올렸어요.\n\n제목: ${row.title}\n종류: ${row.kind}\n\n${clip(row.body || '', 600)}\n\n바로 보기: ${SITE}#/p/${row.id}`;
  } else {
    const { data: p } = await sb.from('posts').select('id,title,author_id').eq('id', row.post_id).maybeSingle();
    subject = `[Slop] 새 ${row.parent_id ? '답글' : '댓글'}: ${clip(p?.title || '', 70)}`;
    text = `${who}님이 「${p?.title || '글'}」에 ${row.parent_id ? '답글' : '댓글'}을 남겼어요.\n\n${clip(row.text || '', 1000)}\n\n바로 보기: ${SITE}#/p/${row.post_id}`;
  }

  try {
    const mail = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
    await mail.sendMail({ from: `Slop 알림 <${user}>`, to: Deno.env.get('NOTIFY_TO') || user, subject, text });
  } catch (e) {
    await sb.from('notify_log').delete().eq('kind', type).eq('id', id); // let a retry try again
    console.error('mail failed', e);
    return reply(502, 'mail failed');
  }
  return reply(200, 'sent');
});
