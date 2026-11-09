// Writes content/batch2/insert.sql for the live DB.
// Usage (from repo root): node content/batch2/build.mjs <owner uuid>
import { readFileSync, writeFileSync } from 'node:fs';
import { POSTS } from './posts.mjs';

const OWNER = process.argv[2];
if (!/^[0-9a-f-]{36}$/.test(OWNER || '')) throw new Error('owner uuid required');
const dir = 'content/batch2/', TAG = '$b2$';
const q = (s) => { if (String(s).includes(TAG)) throw new Error('quote clash'); return TAG + s + TAG; };
const arr = (a) => `array[${a.map(q).join(',')}]::text[]`;
let sql = `-- batch 2: ${POSTS.length} posts by the site owner\nbegin;\n`;
for (const p of POSTS) {
  const code = p.file ? readFileSync(dir + p.file, 'utf8') : '';
  const ts = `now() - interval '${Math.round(p.hours * 60)} minutes'`;
  const note = /[가-힣]/.test(p.title) ? '첫 버전' : 'First version';
  sql += `with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, created_at, updated_at)
  select '${OWNER}', id, ${q(p.kind)}, ${q(p.title)}, ${q(p.body)}, '', array[]::text[], ${q(code)}, '', '', 'Claude', ${q(p.prompt || '')}, ${arr(p.tags)}, ${ts}, ${ts}
  from public.communities where slug = ${q(p.community)}
  and not exists (select 1 from public.posts where author_id = '${OWNER}' and title = ${q(p.title)})
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, ${q(note)}, author_id, created_at from ins;\n`;
}
sql += 'commit;\n';
writeFileSync(dir + 'insert.sql', sql);
console.log(`insert.sql: ${POSTS.length} posts, ${sql.length} chars`);
