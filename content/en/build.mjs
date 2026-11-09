// Writes content/en/insert.sql. Usage: node content/en/build.mjs <owner uuid>
// App posts copy the Korean post's code inside the DB and apply the text swaps
// from ../en-pairs.mjs with nested replace(), so the HTML is not re-sent.
import { writeFileSync } from 'node:fs';
import { POSTS } from './posts.mjs';
import { PAIRS } from '../en-pairs.mjs';
const OWNER = process.argv[2];
if (!/^[0-9a-f-]{36}$/.test(OWNER || '')) throw new Error('owner uuid required');
const TAG = '$e$';
const q = (s) => { if (String(s).includes(TAG)) throw new Error('quote clash'); return TAG + s + TAG; };
const arr = (a) => `array[${a.map(q).join(',')}]::text[]`;
let sql = 'begin;\n';
for (const p of POSTS) {
  const author = p.example ? 'null::uuid' : `'${OWNER}'::uuid`;
  const ts = `now() - interval '${p.hours * 37} minutes'`;
  let code = "''", kind = q(p.kind), lang = "''", tool = q(p.tool ?? 'Claude');
  let from = `from public.communities c where c.slug = ${q(p.community)}`;
  if (p.pairs) {
    code = PAIRS[p.pairs].reduce((e, [a, b]) => `replace(${e}, ${q(a)}, ${q(b)})`, 's.code');
    kind = 's.kind'; lang = 's.code_lang'; tool = 's.tool';
    from = `from public.communities c, public.posts s where c.slug = ${q(p.community)} and s.id = '${p.src}'`;
  }
  sql += `with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select ${author}, c.id, ${kind}, ${q(p.title)}, ${q(p.body)}, ${q(p.url || '')}, ${arr(p.images || [])}, ${code}, ${lang}, '', ${tool}, ${q(p.prompt || '')}, ${arr(p.tags)}, ${!!p.example}, ${ts}, ${ts}
  ${from} and not exists (select 1 from public.posts where title = ${q(p.title)})
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;\n`;
}
sql += 'commit;\n';
writeFileSync('content/en/insert.sql', sql);
console.log(POSTS.length, 'posts,', sql.length, 'chars');
