-- Slop Lab schema: profiles, posts with versions, threaded comments, votes,
-- saves, notifications, reports and moderation. Every table has RLS on.
-- Writes that must be atomic or must touch protected columns go through
-- SECURITY DEFINER functions that check the caller themselves.

-- gen_random_uuid() is built into Postgres 13+, no extension needed

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default '' check (char_length(display_name) <= 40),
  bio          text not null default '' check (char_length(bio) <= 300),
  avatar_url   text,
  role         text not null default 'member' check (role in ('member','mod','admin')),
  banned_at    timestamptz,
  ban_reason   text not null default '',
  created_at   timestamptz not null default now()
);

create function public.is_mod() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('mod','admin'));
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- signed in and not banned
create function public.can_write() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and banned_at is null);
$$;

-- new auth user -> profile with a unique username derived from the email
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare base text; uname text;
begin
  base := regexp_replace(lower(split_part(coalesce(new.email, 'user'), '@', 1)), '[^a-z0-9_]', '', 'g');
  if char_length(base) < 3 then base := 'user' || base; end if;
  base := left(base, 14);
  uname := base;
  while exists (select 1 from public.profiles where username = uname) loop
    uname := base || '_' || substr(md5(random()::text), 1, 4);
  end loop;
  insert into public.profiles (id, username, display_name, avatar_url)
  values (new.id, uname,
          left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), 40),
          new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- members edit their own profile text; only mods change ban fields; only admins change roles.
-- SECURITY INVOKER so current_user is the caller: the SQL editor / service role
-- (used to promote the first admin) is not anon/authenticated and passes through.
create function public.guard_profile() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;
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
create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

alter table public.profiles enable row level security;
create policy "profiles are public" on public.profiles for select using (true);
create policy "edit own profile or moderate" on public.profiles for update
  using (id = auth.uid() or public.is_mod());

-- ---------------------------------------------------------------- posts
create table public.posts (
  id               uuid primary key default gen_random_uuid(),
  author_id        uuid references public.profiles(id) on delete set null,
  cat              text not null check (cat in ('web','game','art','writing','music','video','code','prompt','idea','etc')),
  kind             text not null check (kind in ('text','link','image','html','code')),
  title            text not null check (char_length(title) between 1 and 120),
  body             text not null default '' check (char_length(body) <= 40000),
  url              text not null default '' check (url = '' or url ~* '^https?://'),
  images           text[] not null default '{}' check (cardinality(images) <= 8),
  code             text not null default '' check (octet_length(code) <= 204800),
  code_lang        text not null default '' check (char_length(code_lang) <= 20),
  code_head        text not null default '' check (char_length(code_head) <= 600),
  tool             text not null default '' check (char_length(tool) <= 40),
  prompt           text not null default '' check (char_length(prompt) <= 8000),
  tags             text[] not null default '{}' check (cardinality(tags) <= 5),
  version          int  not null default 1,
  remix_of         uuid references public.posts(id) on delete set null,
  remix_of_version int,
  pinned           boolean not null default false,
  hidden           boolean not null default false,
  hidden_reason    text not null default '',
  locked           boolean not null default false,
  is_example       boolean not null default false,
  up_count         int not null default 0,
  down_count       int not null default 0,
  comment_count    int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);
create index posts_cat_created_idx on public.posts (cat, created_at desc);
create index posts_author_idx on public.posts (author_id);

create table public.post_versions (
  post_id    uuid not null references public.posts(id) on delete cascade,
  n          int  not null,
  title      text not null,
  body       text not null default '',
  url        text not null default '',
  images     text[] not null default '{}',
  code       text not null default '',
  prompt     text not null default '',
  note       text not null default '' check (char_length(note) <= 200),
  author_id  uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (post_id, n)
);

alter table public.posts enable row level security;
alter table public.post_versions enable row level security;
create policy "visible posts" on public.posts for select
  using (not hidden or author_id = auth.uid() or public.is_mod());
-- posts are created and edited only through create_post / save_post_version;
-- moderators set pinned / hidden / locked / cat directly
create policy "moderators update posts" on public.posts for update using (public.is_mod());
create policy "authors and moderators delete posts" on public.posts for delete
  using (author_id = auth.uid() or public.is_mod());
create policy "versions of visible posts" on public.post_versions for select
  using (exists (select 1 from public.posts p where p.id = post_id));

create function public.text_array(j jsonb) returns text[]
language sql immutable as $$
  select coalesce(array(select jsonb_array_elements_text(case when jsonb_typeof(j) = 'array' then j else '[]'::jsonb end)), '{}');
$$;

create function public.create_post(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare r public.posts;
begin
  if auth.uid() is null or not public.can_write() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  insert into public.posts (author_id, cat, kind, title, body, url, images, code, code_lang, code_head,
                            tool, prompt, tags, remix_of, remix_of_version)
  values (auth.uid(), p->>'cat', p->>'kind', btrim(p->>'title'), coalesce(p->>'body', ''), coalesce(p->>'url', ''),
          public.text_array(p->'images'), coalesce(p->>'code', ''), coalesce(p->>'code_lang', ''),
          left(coalesce(p->>'code_head', ''), 600), coalesce(p->>'tool', ''), coalesce(p->>'prompt', ''),
          public.text_array(p->'tags'), nullif(p->>'remix_of', '')::uuid, nullif(p->>'remix_of_version', '')::int)
  returning * into r;
  insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id)
  values (r.id, 1, r.title, r.body, r.url, r.images, r.code, r.prompt,
          left(coalesce(nullif(p->>'note', ''), '첫 버전'), 200), auth.uid());
  return r.id;
end $$;

create function public.save_post_version(pid uuid, p jsonb, resolved uuid[] default '{}') returns int
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
    cat = coalesce(p->>'cat', cat), title = btrim(coalesce(p->>'title', title)),
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

-- ---------------------------------------------------------------- comments
create table public.comments (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.posts(id) on delete cascade,
  parent_id     uuid references public.comments(id) on delete cascade,
  author_id     uuid default auth.uid() references public.profiles(id) on delete set null,
  text          text not null check (char_length(text) <= 4000),
  flair         text not null default 'opinion' check (flair in ('opinion','gem','improve','question','info')),
  version       int  not null default 1,
  resolved_in   int,
  hidden        boolean not null default false,
  hidden_reason text not null default '',
  deleted       boolean not null default false,
  up_count      int not null default 0,
  down_count    int not null default 0,
  created_at    timestamptz not null default now(),
  edited_at     timestamptz
);
create index comments_post_idx on public.comments (post_id, created_at);
create index comments_author_idx on public.comments (author_id);

create function public.trusted() returns boolean language sql stable as $$
  select coalesce(current_setting('slop.trusted', true), 'off') = 'on';
$$;

create function public.guard_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare post_author uuid;
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
  new.id := old.id; new.post_id := old.post_id; new.parent_id := old.parent_id; new.author_id := old.author_id;
  new.created_at := old.created_at; new.version := old.version;
  new.up_count := old.up_count; new.down_count := old.down_count;
  if not public.is_mod() then new.hidden := old.hidden; new.hidden_reason := old.hidden_reason; end if;
  if auth.uid() is distinct from old.author_id then
    new.flair := old.flair; new.edited_at := old.edited_at;
    -- moderators may only blank the text while soft-deleting
    if not (public.is_mod() and new.deleted and new.text = '') then new.text := old.text; new.deleted := old.deleted; end if;
  elsif new.text is distinct from old.text and not new.deleted then
    new.edited_at := now();
  end if;
  select author_id into post_author from public.posts where id = old.post_id;
  if auth.uid() is distinct from post_author and not public.is_mod() then new.resolved_in := old.resolved_in; end if;
  return new;
end $$;
create trigger guard_comment before insert or update on public.comments
  for each row execute function public.guard_comment();

alter table public.comments enable row level security;
create policy "comments on visible posts" on public.comments for select
  using (exists (select 1 from public.posts p where p.id = post_id)
         and (not hidden or author_id = auth.uid() or public.is_mod()));
create policy "members comment on open posts" on public.comments for insert
  with check (author_id = auth.uid() and public.can_write()
              and exists (select 1 from public.posts p where p.id = post_id and not p.locked));
create policy "authors, post authors and moderators update comments" on public.comments for update
  using (author_id = auth.uid() or public.is_mod()
         or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));
create policy "authors and moderators delete comments" on public.comments for delete
  using (author_id = auth.uid() or public.is_mod());

create function public.refresh_comment_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts set comment_count =
    (select count(*) from public.comments where post_id = pid and not deleted and not hidden)
  where id = pid;
  return null;
end $$;
create trigger comment_count after insert or delete or update of deleted, hidden on public.comments
  for each row execute function public.refresh_comment_count();

-- ---------------------------------------------------------------- votes
create table public.post_votes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  value      smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table public.comment_votes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  value      smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
alter table public.post_votes enable row level security;
alter table public.comment_votes enable row level security;
-- who voted what stays private; totals live on posts / comments
create policy "own post votes" on public.post_votes for select using (user_id = auth.uid());
create policy "cast post votes" on public.post_votes for insert with check (user_id = auth.uid() and public.can_write());
create policy "change post votes" on public.post_votes for update using (user_id = auth.uid()) with check (user_id = auth.uid() and public.can_write());
create policy "remove post votes" on public.post_votes for delete using (user_id = auth.uid());
create policy "own comment votes" on public.comment_votes for select using (user_id = auth.uid());
create policy "cast comment votes" on public.comment_votes for insert with check (user_id = auth.uid() and public.can_write());
create policy "change comment votes" on public.comment_votes for update using (user_id = auth.uid()) with check (user_id = auth.uid() and public.can_write());
create policy "remove comment votes" on public.comment_votes for delete using (user_id = auth.uid());

create function public.refresh_post_votes() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts set
    up_count   = (select count(*) from public.post_votes where post_id = pid and value = 1),
    down_count = (select count(*) from public.post_votes where post_id = pid and value = -1)
  where id = pid;
  return null;
end $$;
create trigger post_vote_counts after insert or update or delete on public.post_votes
  for each row execute function public.refresh_post_votes();

create function public.refresh_comment_votes() returns trigger
language plpgsql security definer set search_path = public as $$
declare cid uuid := coalesce(new.comment_id, old.comment_id);
begin
  perform set_config('slop.trusted', 'on', true);
  update public.comments set
    up_count   = (select count(*) from public.comment_votes where comment_id = cid and value = 1),
    down_count = (select count(*) from public.comment_votes where comment_id = cid and value = -1)
  where id = cid;
  perform set_config('slop.trusted', 'off', true);
  return null;
end $$;
create trigger comment_vote_counts after insert or update or delete on public.comment_votes
  for each row execute function public.refresh_comment_votes();

-- ---------------------------------------------------------------- saves
create table public.saves (
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.saves enable row level security;
create policy "own saves" on public.saves for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------- notifications
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('reply','comment','resolved','gem')),
  actor_id   uuid references public.profiles(id) on delete set null,
  post_id    uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "mark own notifications" on public.notifications for update using (user_id = auth.uid());
create policy "clear own notifications" on public.notifications for delete using (user_id = auth.uid());

create function public.notify_on_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare target uuid; k text;
begin
  if tg_op = 'INSERT' then
    if new.parent_id is not null then
      select author_id into target from public.comments where id = new.parent_id; k := 'reply';
    else
      select author_id into target from public.posts where id = new.post_id; k := 'comment';
    end if;
    if target is not null and target is distinct from new.author_id then
      insert into public.notifications (user_id, kind, actor_id, post_id, comment_id)
      values (target, k, new.author_id, new.post_id, new.id);
    end if;
  elsif new.resolved_in is not null and old.resolved_in is null
        and new.author_id is not null and new.author_id is distinct from auth.uid() then
    insert into public.notifications (user_id, kind, actor_id, post_id, comment_id)
    values (new.author_id, 'resolved', auth.uid(), new.post_id, new.id);
  end if;
  return null;
end $$;
create trigger notify_on_comment after insert or update of resolved_in on public.comments
  for each row execute function public.notify_on_comment();

-- first time a post becomes a gem, tell its author
create function public.notify_on_gem() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.author_id is not null and new.up_count >= 3 and new.up_count * 4 >= 3 * (new.up_count + new.down_count)
     and not (old.up_count >= 3 and old.up_count * 4 >= 3 * (old.up_count + old.down_count))
     and not exists (select 1 from public.notifications where user_id = new.author_id and kind = 'gem' and post_id = new.id) then
    insert into public.notifications (user_id, kind, post_id) values (new.author_id, 'gem', new.id);
  end if;
  return null;
end $$;
create trigger notify_on_gem after update of up_count, down_count on public.posts
  for each row execute function public.notify_on_gem();

-- ---------------------------------------------------------------- reports & moderation
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment')),
  target_id   uuid not null,
  reason      text not null check (char_length(reason) between 1 and 40),
  note        text not null default '' check (char_length(note) <= 500),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolution  text,
  unique (reporter_id, target_type, target_id)
);
alter table public.reports enable row level security;
create policy "file reports" on public.reports for insert
  with check (reporter_id = auth.uid() and resolved_at is null);
create policy "see own reports, moderators see all" on public.reports for select
  using (reporter_id = auth.uid() or public.is_mod());
create policy "moderators resolve reports" on public.reports for update using (public.is_mod());
create policy "moderators delete reports" on public.reports for delete using (public.is_mod());

create table public.mod_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid default auth.uid() references public.profiles(id) on delete set null,
  action      text not null,
  target_type text not null,
  target_id   uuid,
  label       text not null default '',
  reason      text not null default '',
  created_at  timestamptz not null default now()
);
alter table public.mod_log enable row level security;
create policy "moderators read the log" on public.mod_log for select using (public.is_mod());
create policy "moderators write the log" on public.mod_log for insert with check (public.is_mod() and actor_id = auth.uid());

-- ---------------------------------------------------------------- read models
create view public.post_feed with (security_invoker = true) as
select p.id, p.author_id, p.cat, p.kind, p.title, left(p.body, 400) as excerpt, p.url, p.images,
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
from public.posts p left join public.profiles a on a.id = p.author_id;

create function public.board_stats(board text default null) returns jsonb
language sql stable set search_path = public as $$
  with s as (select * from public.post_feed where (board is null or cat = board) and not hidden)
  select jsonb_build_object(
    'posts', (select count(*) from s),
    'gems',  (select count(*) from s where is_gem),
    'tools', coalesce((select jsonb_agg(t order by t->>'n' desc) from (
               select jsonb_build_object('name', tool, 'n', count(*)) t from s where tool <> '' group by tool order by count(*) desc limit 12) x), '[]'),
    'tags',  coalesce((select jsonb_agg(t) from (
               select jsonb_build_object('name', tag, 'n', count(*)) t from s, unnest(tags) tag group by tag order by count(*) desc limit 14) y), '[]'),
    'boards', coalesce((select jsonb_object_agg(cat, n) from (select cat, count(*) n from public.post_feed where not hidden group by cat) z), '{}')
  );
$$;

create function public.profile_stats(uid uuid) returns jsonb
language sql stable set search_path = public as $$
  select jsonb_build_object(
    'posts',    (select count(*) from public.posts where author_id = uid),
    'comments', (select count(*) from public.comments where author_id = uid and not deleted),
    'karma',    coalesce((select sum(up_count - down_count) from public.posts where author_id = uid), 0)
              + coalesce((select sum(up_count - down_count) from public.comments where author_id = uid), 0),
    'gems',     (select count(*) from public.post_feed where author_id = uid and is_gem)
  );
$$;

-- ---------------------------------------------------------------- storage for images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 10485760, array['image/png','image/jpeg','image/gif','image/webp'])
on conflict (id) do nothing;

create policy "members upload images to their own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text and public.can_write());
create policy "members delete their own images" on storage.objects for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- realtime
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.comments, public.notifications;
  end if;
end $$;
