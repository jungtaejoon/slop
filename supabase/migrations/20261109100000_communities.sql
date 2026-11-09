-- Reddit-style communities: anyone can create one, members follow them,
-- the home feed shows followed communities, creators moderate their own.
-- Additive: posts.cat stays (nullable, unused) so nothing existing is dropped.

-- ---------------------------------------------------------------- tables
create table public.communities (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,29}$'),
  name         text not null check (char_length(btrim(name)) between 1 and 40),
  description  text not null default '' check (char_length(description) <= 300),
  rules        text not null default '' check (char_length(rules) <= 2000),
  default_kind text not null default 'text' check (default_kind in ('text','link','image','html','code')),
  creator_id   uuid references public.profiles(id) on delete set null,
  is_default   boolean not null default false,
  member_count int not null default 0,
  post_count   int not null default 0,
  created_at   timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id      uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  role         text not null default 'member' check (role in ('member','mod')),
  created_at   timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index community_members_user_idx on public.community_members (user_id);

insert into public.communities (slug, name, description, default_kind, is_default) values
  ('web',     '웹·앱',         'AI로 만든 웹페이지, 앱, 도구. 실행물로 올리면 바로 돌려볼 수 있어요.', 'html', true),
  ('game',    '게임',          'AI가 만든 게임과 장난감. 플레이해 보고 판정해 주세요.', 'html', true),
  ('art',     '이미지·아트',    '생성 이미지, 일러스트, 디자인 시안.', 'image', true),
  ('writing', '글·이야기',      '시, 소설, 에세이, 가사 같은 AI 글.', 'text', true),
  ('music',   '음악·오디오',    '생성 음악과 사운드. 링크나 실행물로 공유해요.', 'link', true),
  ('video',   '영상',          '생성 영상과 애니메이션. 링크나 실행물로 공유해요.', 'link', true),
  ('code',    '코드·자동화',    '스크립트, 함수, 자동화 레시피.', 'code', true),
  ('prompt',  '프롬프트·대화',  '쓸 만한 프롬프트와 인상적인 대화 기록.', 'text', true),
  ('idea',    '아이디어·기획',  'AI가 낸 사업·기획·연구 아이디어.', 'text', true),
  ('etc',     '기타',          '어디에도 안 맞는 것들.', 'text', true)
on conflict (slug) do nothing;

-- site moderators count as moderators of every community
create function public.is_community_mod(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_mod() or exists (
    select 1 from public.community_members where community_id = cid and user_id = auth.uid() and role = 'mod');
$$;

-- ---------------------------------------------------------------- posts belong to a community
alter table public.posts add column community_id uuid references public.communities(id) on delete restrict;
update public.posts p set community_id = c.id from public.communities c where c.slug = p.cat and p.community_id is null;
alter table public.posts alter column community_id set not null;
alter table public.posts alter column cat drop not null;
create index posts_community_created_idx on public.posts (community_id, created_at desc);

create function public.post_community(pid uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select community_id from public.posts where id = pid;
$$;

-- community moderators may change only the moderation flags; site moderators anything.
-- SECURITY INVOKER: definer functions (create_post, counters) run as the owner and pass.
create function public.guard_post() returns trigger
language plpgsql set search_path = public as $$
declare r public.posts;
begin
  if current_user not in ('anon', 'authenticated') or public.is_mod() then return new; end if;
  r := old;
  if public.is_community_mod(old.community_id) then
    r.pinned := new.pinned; r.hidden := new.hidden; r.hidden_reason := new.hidden_reason; r.locked := new.locked;
  end if;
  return r;
end $$;
create trigger guard_post before update on public.posts for each row execute function public.guard_post();

drop policy "visible posts" on public.posts;
drop policy "moderators update posts" on public.posts;
drop policy "authors and moderators delete posts" on public.posts;
create policy "visible posts" on public.posts for select
  using (not hidden or author_id = auth.uid() or public.is_community_mod(community_id));
create policy "moderators update posts" on public.posts for update using (public.is_community_mod(community_id));
create policy "authors and moderators delete posts" on public.posts for delete
  using (author_id = auth.uid() or public.is_community_mod(community_id));

create or replace function public.create_post(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare r public.posts; cid uuid := nullif(p->>'community_id', '')::uuid;
begin
  if auth.uid() is null or not public.can_write() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if cid is null or not exists (select 1 from public.communities where id = cid) then
    raise exception 'community not found' using errcode = '23503';
  end if;
  insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head,
                            tool, prompt, tags, remix_of, remix_of_version)
  values (auth.uid(), cid, p->>'kind', btrim(p->>'title'), coalesce(p->>'body', ''), coalesce(p->>'url', ''),
          public.text_array(p->'images'), coalesce(p->>'code', ''), coalesce(p->>'code_lang', ''),
          left(coalesce(p->>'code_head', ''), 600), coalesce(p->>'tool', ''), coalesce(p->>'prompt', ''),
          public.text_array(p->'tags'), nullif(p->>'remix_of', '')::uuid, nullif(p->>'remix_of_version', '')::int)
  returning * into r;
  insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id)
  values (r.id, 1, r.title, r.body, r.url, r.images, r.code, r.prompt,
          left(coalesce(nullif(p->>'note', ''), '첫 버전'), 200), auth.uid());
  return r.id;
end $$;

create or replace function public.save_post_version(pid uuid, p jsonb, resolved uuid[] default '{}') returns int
language plpgsql security definer set search_path = public as $$
declare r public.posts; n int;
begin
  select * into r from public.posts where id = pid for update;
  if not found then raise exception 'post not found' using errcode = 'P0002'; end if;
  if auth.uid() is null or not public.can_write()
     or (r.author_id is distinct from auth.uid() and not public.is_mod()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  n := r.version + 1;
  update public.posts set
    title = btrim(coalesce(p->>'title', title)),
    body = coalesce(p->>'body', ''), url = coalesce(p->>'url', ''), images = public.text_array(p->'images'),
    code = coalesce(p->>'code', ''), code_lang = coalesce(p->>'code_lang', ''), code_head = left(coalesce(p->>'code_head', ''), 600),
    tool = coalesce(p->>'tool', ''), prompt = coalesce(p->>'prompt', ''), tags = public.text_array(p->'tags'),
    version = n, updated_at = now()
  where id = pid returning * into r;
  insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id)
  values (pid, n, r.title, r.body, r.url, r.images, r.code, r.prompt, left(coalesce(nullif(p->>'note', ''), '수정'), 200), auth.uid());
  perform set_config('slop.trusted', 'on', true);
  update public.comments set resolved_in = n
   where post_id = pid and id = any(coalesce(resolved, '{}')) and resolved_in is null;
  perform set_config('slop.trusted', 'off', true);
  return n;
end $$;

-- ---------------------------------------------------------------- comments: community mods moderate too
create or replace function public.guard_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare post_author uuid; cmod boolean;
begin
  if tg_op = 'INSERT' then
    new.hidden := false; new.hidden_reason := ''; new.deleted := false; new.resolved_in := null;
    new.up_count := 0; new.down_count := 0; new.edited_at := null; new.created_at := now();
    if new.parent_id is not null and not exists
       (select 1 from public.comments c where c.id = new.parent_id and c.post_id = new.post_id) then
      raise exception 'parent comment is on another post' using errcode = '23514';
    end if;
    return new;
  end if;
  if public.trusted() then return new; end if;
  cmod := public.is_community_mod(public.post_community(old.post_id));
  new.id := old.id; new.post_id := old.post_id; new.parent_id := old.parent_id; new.author_id := old.author_id;
  new.created_at := old.created_at; new.version := old.version;
  new.up_count := old.up_count; new.down_count := old.down_count;
  if not cmod then new.hidden := old.hidden; new.hidden_reason := old.hidden_reason; end if;
  if auth.uid() is distinct from old.author_id then
    new.flair := old.flair; new.edited_at := old.edited_at;
    if not (cmod and new.deleted and new.text = '') then new.text := old.text; new.deleted := old.deleted; end if;
  elsif new.text is distinct from old.text and not new.deleted then
    new.edited_at := now();
  end if;
  select author_id into post_author from public.posts where id = old.post_id;
  if auth.uid() is distinct from post_author and not cmod then new.resolved_in := old.resolved_in; end if;
  return new;
end $$;

drop policy "comments on visible posts" on public.comments;
drop policy "authors, post authors and moderators update comments" on public.comments;
drop policy "authors and moderators delete comments" on public.comments;
create policy "comments on visible posts" on public.comments for select
  using (exists (select 1 from public.posts p where p.id = post_id)
         and (not hidden or author_id = auth.uid() or public.is_community_mod(public.post_community(post_id))));
create policy "authors, post authors and moderators update comments" on public.comments for update
  using (author_id = auth.uid() or public.is_community_mod(public.post_community(post_id))
         or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));
create policy "authors and moderators delete comments" on public.comments for delete
  using (author_id = auth.uid() or public.is_community_mod(public.post_community(post_id)));

-- ---------------------------------------------------------------- reports & log scoped to a community
alter table public.reports add column community_id uuid references public.communities(id) on delete cascade;
create function public.report_community() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.community_id := case when new.target_type = 'post' then public.post_community(new.target_id)
                           else (select public.post_community(post_id) from public.comments where id = new.target_id) end;
  return new;
end $$;
create trigger report_community before insert on public.reports for each row execute function public.report_community();
update public.reports r set community_id = case when r.target_type = 'post' then public.post_community(r.target_id)
  else (select public.post_community(post_id) from public.comments where id = r.target_id) end where community_id is null;

drop policy "see own reports, moderators see all" on public.reports;
drop policy "moderators resolve reports" on public.reports;
drop policy "moderators delete reports" on public.reports;
create policy "see own reports, moderators see theirs" on public.reports for select
  using (reporter_id = auth.uid() or public.is_community_mod(community_id));
create policy "moderators resolve reports" on public.reports for update using (public.is_community_mod(community_id));
create policy "moderators delete reports" on public.reports for delete using (public.is_community_mod(community_id));

alter table public.mod_log add column community_id uuid references public.communities(id) on delete set null;
drop policy "moderators read the log" on public.mod_log;
drop policy "moderators write the log" on public.mod_log;
create policy "moderators read the log" on public.mod_log for select using (public.is_community_mod(community_id));
create policy "moderators write the log" on public.mod_log for insert
  with check (actor_id = auth.uid() and public.is_community_mod(community_id));

-- ---------------------------------------------------------------- communities: access rules
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
create policy "communities are public" on public.communities for select using (true);
create policy "community mods edit their community" on public.communities for update using (public.is_community_mod(id));
create policy "admins delete communities" on public.communities for delete using (public.is_admin());

create function public.guard_community() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('anon', 'authenticated') or public.is_mod() then return new; end if;
  new.id := old.id; new.slug := old.slug; new.creator_id := old.creator_id; new.is_default := old.is_default;
  new.member_count := old.member_count; new.post_count := old.post_count; new.created_at := old.created_at;
  return new;
end $$;
create trigger guard_community before update on public.communities for each row execute function public.guard_community();

-- who follows what stays private; moderator lists are public
create policy "see mods and own memberships" on public.community_members for select
  using (role = 'mod' or user_id = auth.uid() or public.is_community_mod(community_id));
create policy "follow communities" on public.community_members for insert
  with check (user_id = auth.uid() and role = 'member' and auth.uid() is not null);
create policy "unfollow communities" on public.community_members for delete using (user_id = auth.uid());

create function public.create_community(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid; s text := lower(btrim(coalesce(p->>'slug', '')));
begin
  if auth.uid() is null or not public.can_write() then raise exception 'not allowed' using errcode = '42501'; end if;
  if s = any (array['all','popular','home','gems','saved','new','mod','admin','submit','settings','login','inbox','communities','edit','remix','api','help','about']) then
    raise exception 'reserved name' using errcode = '23505';
  end if;
  if not public.is_mod() and (select count(*) from public.communities where creator_id = auth.uid() and created_at > now() - interval '1 day') >= 2 then
    raise exception 'daily community limit' using errcode = '54000';
  end if;
  insert into public.communities (slug, name, description, rules, default_kind, creator_id)
  values (s, btrim(p->>'name'), coalesce(p->>'description', ''), coalesce(p->>'rules', ''),
          coalesce(nullif(p->>'default_kind', ''), 'text'), auth.uid())
  returning id into cid;
  insert into public.community_members (community_id, user_id, role) values (cid, auth.uid(), 'mod');
  return cid;
end $$;

-- a community moderator adds or removes another moderator by username
create function public.set_community_mod(cid uuid, uname text, make_mod boolean) returns void
language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  if not public.is_community_mod(cid) then raise exception 'not allowed' using errcode = '42501'; end if;
  select id into target from public.profiles where username = lower(btrim(uname));
  if target is null then raise exception 'user not found' using errcode = 'P0002'; end if;
  if make_mod then
    insert into public.community_members (community_id, user_id, role) values (cid, target, 'mod')
    on conflict (community_id, user_id) do update set role = 'mod';
  else
    if (select count(*) from public.community_members where community_id = cid and role = 'mod') <= 1 then
      raise exception 'a community needs at least one moderator' using errcode = '23514';
    end if;
    update public.community_members set role = 'member' where community_id = cid and user_id = target;
  end if;
end $$;

-- counters
create function public.refresh_member_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare cid uuid := coalesce(new.community_id, old.community_id);
begin
  update public.communities set member_count = (select count(*) from public.community_members where community_id = cid) where id = cid;
  return null;
end $$;
create trigger member_count after insert or delete on public.community_members for each row execute function public.refresh_member_count();

create function public.refresh_post_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op <> 'INSERT' then update public.communities set post_count = (select count(*) from public.posts where community_id = old.community_id) where id = old.community_id; end if;
  if tg_op <> 'DELETE' then update public.communities set post_count = (select count(*) from public.posts where community_id = new.community_id) where id = new.community_id; end if;
  return null;
end $$;
create trigger post_count after insert or delete or update of community_id on public.posts for each row execute function public.refresh_post_count();
update public.communities c set post_count = (select count(*) from public.posts p where p.community_id = c.id);

-- new members follow the default communities; existing members too
create function public.follow_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.community_members (community_id, user_id)
  select id, new.id from public.communities where is_default on conflict do nothing;
  return null;
end $$;
create trigger follow_defaults after insert on public.profiles for each row execute function public.follow_defaults();
insert into public.community_members (community_id, user_id)
select c.id, p.id from public.communities c cross join public.profiles p where c.is_default on conflict do nothing;

-- ---------------------------------------------------------------- read models
drop view public.post_feed;
create view public.post_feed with (security_invoker = true) as
select p.id, p.author_id, p.community_id, c.slug as community_slug, c.name as community_name,
       p.kind, p.title, left(p.body, 400) as excerpt, p.url, p.images,
       p.code_lang, p.code_head, p.tool, p.tags, p.version, p.remix_of, p.remix_of_version,
       p.pinned, p.hidden, p.hidden_reason, p.locked, p.is_example,
       p.up_count, p.down_count, p.comment_count, p.created_at, p.updated_at,
       p.up_count - p.down_count as score,
       p.up_count + p.down_count as vote_total,
       sign(p.up_count - p.down_count) * log(greatest(abs(p.up_count - p.down_count), 1)::numeric)
         + extract(epoch from p.created_at)::numeric / 45000 as hot,
       case when p.up_count > 0 and p.down_count > 0
            then (p.up_count + p.down_count)::numeric * least(p.up_count, p.down_count) / greatest(p.up_count, p.down_count)
            else 0 end as contro,
       (p.up_count >= 3 and p.up_count * 4 >= 3 * (p.up_count + p.down_count)) as is_gem,
       a.username as author_username, a.display_name as author_name, a.avatar_url as author_avatar
from public.posts p
join public.communities c on c.id = p.community_id
left join public.profiles a on a.id = p.author_id;

drop function public.board_stats(text);
create function public.board_stats(cid uuid default null) returns jsonb
language sql stable set search_path = public as $$
  with s as (select * from public.post_feed where (cid is null or community_id = cid) and not hidden)
  select jsonb_build_object(
    'posts', (select count(*) from s),
    'gems',  (select count(*) from s where is_gem),
    'tools', coalesce((select jsonb_agg(t) from (
               select jsonb_build_object('name', tool, 'n', count(*)) t from s where tool <> '' group by tool order by count(*) desc limit 12) x), '[]'),
    'tags',  coalesce((select jsonb_agg(t) from (
               select jsonb_build_object('name', tag, 'n', count(*)) t from s, unnest(tags) tag group by tag order by count(*) desc limit 14) y), '[]')
  );
$$;

create or replace function public.profile_stats(uid uuid) returns jsonb
language sql stable set search_path = public as $$
  select jsonb_build_object(
    'posts',    (select count(*) from public.posts where author_id = uid),
    'comments', (select count(*) from public.comments where author_id = uid and not deleted),
    'karma',    coalesce((select sum(up_count - down_count) from public.posts where author_id = uid), 0)
              + coalesce((select sum(up_count - down_count) from public.comments where author_id = uid), 0),
    'gems',     (select count(*) from public.post_feed where author_id = uid and is_gem)
  );
$$;
