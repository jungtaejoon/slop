-- Language editions of one post. Each edition stays its own post (own votes, comments and
-- versions); editions share a lang_group, which is the id of the first post in the group.
alter table public.posts
  add column if not exists lang text not null default 'ko' check (lang in ('ko', 'en')),
  add column if not exists lang_group uuid;

update public.posts set lang = case when title ~ '[가-힣]' then 'ko' else 'en' end;

create index if not exists posts_lang_group_idx on public.posts (lang_group) where lang_group is not null;
create unique index if not exists posts_lang_group_lang_key on public.posts (lang_group, lang) where lang_group is not null;

-- create_post(p): as before, plus p.lang ('ko' | 'en'; guessed from the title when missing) and
-- p.translation_of (a post id): the new post joins that post's language group. Only the author of
-- the source post (or a site mod) may add an edition, it lands in the same community, and a
-- group holds one post per language.
create or replace function public.create_post(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare r public.posts; s public.posts; cid uuid := nullif(p->>'community_id', '')::uuid;
        src uuid := nullif(p->>'translation_of', '')::uuid; grp uuid; lg text;
begin
  if auth.uid() is null or not public.can_post() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not public.is_mod() and (
       (select count(*) from public.posts where author_id = auth.uid() and created_at > now() - interval '1 hour') >= 10
    or (select count(*) from public.posts where author_id = auth.uid() and created_at > now() - interval '1 day') >= 30) then
    raise exception 'too many posts, try again later' using errcode = 'SL429';
  end if;
  lg := case when p->>'lang' in ('ko', 'en') then p->>'lang'
             when btrim(coalesce(p->>'title', '')) ~ '[가-힣]' then 'ko' else 'en' end;
  if src is not null then
    select * into s from public.posts where id = src for update;
    if not found then raise exception 'post not found' using errcode = 'P0002'; end if;
    if s.author_id is distinct from auth.uid() and not public.is_mod() then
      raise exception 'not allowed' using errcode = '42501';
    end if;
    grp := coalesce(s.lang_group, s.id);
    if exists (select 1 from public.posts where (lang_group = grp or id = s.id) and lang = lg) then
      raise exception 'this language edition already exists' using errcode = '23505';
    end if;
    if s.lang_group is null then update public.posts set lang_group = s.id where id = s.id; end if;
    cid := s.community_id;
  end if;
  if cid is null or not exists (select 1 from public.communities where id = cid) then
    raise exception 'community not found' using errcode = '23503';
  end if;
  insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head,
                            tool, prompt, tags, remix_of, remix_of_version, lang, lang_group)
  values (auth.uid(), cid, p->>'kind', btrim(p->>'title'), coalesce(p->>'body', ''), coalesce(p->>'url', ''),
          public.text_array(p->'images'), coalesce(p->>'code', ''), coalesce(p->>'code_lang', ''),
          left(coalesce(p->>'code_head', ''), 600), coalesce(p->>'tool', ''), coalesce(p->>'prompt', ''),
          public.text_array(p->'tags'), nullif(p->>'remix_of', '')::uuid, nullif(p->>'remix_of_version', '')::int, lg, grp)
  returning * into r;
  insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id)
  values (r.id, 1, r.title, r.body, r.url, r.images, r.code, r.prompt,
          left(coalesce(nullif(p->>'note', ''), case when src is not null then '언어판 추가' else '첫 버전' end), 200), auth.uid());
  return r.id;
end $$;

revoke all on function public.create_post(jsonb) from public, anon;
grant execute on function public.create_post(jsonb) to authenticated;
