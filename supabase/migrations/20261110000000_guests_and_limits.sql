-- Guests, rate limits and stricter image URLs (before the Product Hunt launch).
--
-- 1. Guests: visitors can judge (vote) without an account through Supabase
--    anonymous sign-in. A guest gets a profile flagged is_guest so their votes
--    have a row to point at. Guests can't post, edit, comment, report, follow,
--    upload or create communities (can_post), and they don't auto-follow the
--    default communities, so member counts stay honest. If a guest later links
--    an email or OAuth identity, the flag clears and they follow the defaults.
-- 2. Per-account rate limits on posts, edits, comments, votes, reports and
--    uploads. Inserts run by the owner through SQL (no JWT, so auth.uid() is
--    null) are not limited. Limit errors use SQLSTATE 'SL429'.
-- 3. Image URLs must be https or a same-site relative path (examples/x.svg),
--    enforced on the tables, so no code path can store javascript: links.
-- 4. board_stats can count one content language (title with Hangul = Korean),
--    so the sidebar matches the English/Korean post filter.

-- ---------------------------------------------------------------- 1. guests
alter table public.profiles add column if not exists is_guest boolean not null default false;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare base text; uname text; guest boolean := coalesce(new.is_anonymous, false);
begin
  if guest then
    base := 'guest';
    uname := base || '_' || substr(md5(random()::text), 1, 6);
  else
    base := regexp_replace(lower(split_part(coalesce(new.email, 'user'), '@', 1)), '[^a-z0-9_]', '', 'g');
    if char_length(base) < 3 then base := 'user' || base; end if;
    base := left(base, 14);
    uname := base;
  end if;
  while exists (select 1 from public.profiles where username = uname) loop
    uname := base || '_' || substr(md5(random()::text), 1, 4);
  end loop;
  insert into public.profiles (id, username, display_name, avatar_url, is_guest)
  values (new.id, uname,
          left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), 40),
          new.raw_user_meta_data->>'avatar_url', guest);
  return new;
end $$;

-- a guest who links a real identity becomes a member
create or replace function public.handle_user_upgraded() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(old.is_anonymous, false) and not coalesce(new.is_anonymous, false) then
    update public.profiles set is_guest = false where id = new.id;
    insert into public.community_members (community_id, user_id)
    select id, new.id from public.communities where is_default on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_upgraded on auth.users;
create trigger on_auth_user_upgraded after update of is_anonymous on auth.users
  for each row execute function public.handle_user_upgraded();

-- guests don't follow the default communities
create or replace function public.follow_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.is_guest then return null; end if;
  insert into public.community_members (community_id, user_id)
  select id, new.id from public.communities where is_default on conflict do nothing;
  return null;
end $$;

-- same rules as before, plus: nobody can flip their own is_guest flag
create or replace function public.guard_profile() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;
  new.is_guest := old.is_guest;
  if not public.is_mod() then
    new.role := old.role; new.banned_at := old.banned_at; new.ban_reason := old.ban_reason;
  elsif not public.is_admin() then
    new.role := old.role;
    if old.role in ('mod','admin') then new.banned_at := old.banned_at; new.ban_reason := old.ban_reason; end if;
  end if;
  if new.id is distinct from auth.uid() then
    new.username := old.username; new.display_name := old.display_name; new.bio := old.bio; new.avatar_url := old.avatar_url;
  end if;
  new.id := old.id; new.created_at := old.created_at;
  return new;
end $$;

-- signed in, not banned, and a real account (not a guest).
-- can_write() (signed in, not banned) still gates votes, so guests can judge.
create or replace function public.can_post() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and banned_at is null and not is_guest);
$$;

drop policy "members comment on open posts" on public.comments;
create policy "members comment on open posts" on public.comments for insert
  with check (author_id = auth.uid() and public.can_post()
              and exists (select 1 from public.posts p where p.id = post_id and not p.locked));

drop policy "file reports" on public.reports;
create policy "file reports" on public.reports for insert
  with check (reporter_id = auth.uid() and resolved_at is null and public.can_post());

drop policy "follow communities" on public.community_members;
create policy "follow communities" on public.community_members for insert
  with check (user_id = auth.uid() and role = 'member' and public.can_post());

-- ---------------------------------------------------------------- 2. rate limits
create or replace function public.create_post(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare r public.posts; cid uuid := nullif(p->>'community_id', '')::uuid;
begin
  if auth.uid() is null or not public.can_post() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not public.is_mod() and (
       (select count(*) from public.posts where author_id = auth.uid() and created_at > now() - interval '1 hour') >= 10
    or (select count(*) from public.posts where author_id = auth.uid() and created_at > now() - interval '1 day') >= 30) then
    raise exception 'too many posts, try again later' using errcode = 'SL429';
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
  if auth.uid() is null or not public.can_post()
     or (r.author_id is distinct from auth.uid() and not public.is_mod()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not public.is_mod() and
     (select count(*) from public.post_versions where author_id = auth.uid() and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'too many edits, try again later' using errcode = 'SL429';
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

create or replace function public.create_community(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid; s text := lower(btrim(coalesce(p->>'slug', '')));
begin
  if auth.uid() is null or not public.can_post() then raise exception 'not allowed' using errcode = '42501'; end if;
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

-- comments: 20 per 10 minutes, 200 per day
create or replace function public.limit_comments() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_mod() then return new; end if;
  if (select count(*) from public.comments where author_id = auth.uid() and created_at > now() - interval '10 minutes') >= 20
     or (select count(*) from public.comments where author_id = auth.uid() and created_at > now() - interval '1 day') >= 200 then
    raise exception 'too many comments, try again later' using errcode = 'SL429';
  end if;
  return new;
end $$;
drop trigger if exists limit_comments on public.comments;
create trigger limit_comments before insert on public.comments for each row execute function public.limit_comments();

-- votes: 300 new votes per hour per table (changing an existing vote is free)
create or replace function public.limit_votes() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then return new; end if;
  if tg_table_name = 'post_votes' then
    select count(*) into n from public.post_votes where user_id = auth.uid() and created_at > now() - interval '1 hour';
  else
    select count(*) into n from public.comment_votes where user_id = auth.uid() and created_at > now() - interval '1 hour';
  end if;
  if n >= 300 then raise exception 'too many votes, try again later' using errcode = 'SL429'; end if;
  return new;
end $$;
drop trigger if exists limit_post_votes on public.post_votes;
create trigger limit_post_votes before insert on public.post_votes for each row execute function public.limit_votes();
drop trigger if exists limit_comment_votes on public.comment_votes;
create trigger limit_comment_votes before insert on public.comment_votes for each row execute function public.limit_votes();

-- reports: 30 per day
create or replace function public.limit_reports() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_mod() then return new; end if;
  if (select count(*) from public.reports where reporter_id = auth.uid() and created_at > now() - interval '1 day') >= 30 then
    raise exception 'too many reports, try again later' using errcode = 'SL429';
  end if;
  return new;
end $$;
drop trigger if exists limit_reports on public.reports;
create trigger limit_reports before insert on public.reports for each row execute function public.limit_reports();

-- uploads: 40 images per hour, only real (non-guest, non-banned) members
create or replace function public.recent_uploads() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from storage.objects
  where bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text
    and created_at > now() - interval '1 hour';
$$;
drop policy "members upload images to their own folder" on storage.objects;
create policy "members upload images to their own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text
              and public.can_post() and public.recent_uploads() < 40);

-- ---------------------------------------------------------------- 3. image URLs
create or replace function public.valid_image_urls(a text[]) returns boolean
language sql immutable set search_path = public as $$
  select coalesce(bool_and(char_length(u) <= 600
                           and (u ~* '^https?://[^\s"''<>]+$' or u ~ '^[A-Za-z0-9_][A-Za-z0-9_./-]*$')), true)
  from unnest(a) u;
$$;
alter table public.posts add constraint posts_images_valid check (public.valid_image_urls(images));
alter table public.post_versions add constraint post_versions_images_valid check (public.valid_image_urls(images));

-- ---------------------------------------------------------------- 4. sidebar stats per language
drop function if exists public.board_stats(uuid);
create function public.board_stats(cid uuid default null, clang text default 'all') returns jsonb
language sql stable set search_path = public as $$
  with s as (select * from public.post_feed
             where (cid is null or community_id = cid) and not hidden
               and (clang is null or clang = 'all' or (clang = 'ko') = (title ~ '[가-힣]')))
  select jsonb_build_object(
    'posts', (select count(*) from s),
    'gems',  (select count(*) from s where is_gem),
    'tools', coalesce((select jsonb_agg(t) from (
               select jsonb_build_object('name', tool, 'n', count(*)) t from s where tool <> '' group by tool order by count(*) desc limit 12) x), '[]'),
    'tags',  coalesce((select jsonb_agg(t) from (
               select jsonb_build_object('name', tag, 'n', count(*)) t from s, unnest(tags) tag group by tag order by count(*) desc limit 14) y), '[]')
  );
$$;

-- ---------------------------------------------------------------- grants (same pattern as 20261109110000)
revoke execute on function
  public.handle_user_upgraded(), public.limit_comments(), public.limit_votes(), public.limit_reports()
from public, anon, authenticated;
grant execute on function public.can_post(), public.recent_uploads(), public.valid_image_urls(text[]) to anon, authenticated;
grant execute on function public.board_stats(uuid, text) to anon, authenticated;
