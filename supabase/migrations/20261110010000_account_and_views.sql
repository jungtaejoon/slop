-- Account deletion and privacy-friendly visit counts.
--
-- 1. delete_my_account(delete_content): a member deletes their own account.
--    Profile, votes, saves, notifications, reports and follows go with it
--    (existing foreign keys). With delete_content, their posts and comments are
--    deleted too (comments that have replies are emptied instead, so threads
--    stay readable); without it they stay, shown as "Deleted user".
--    The last admin can't delete themselves (SQLSTATE 'SL409').
-- 2. page_views: views per page per day, nothing about the visitor (no IP, no
--    cookie, no id). track_view() also bumps posts.view_count. Only admins read
--    page_views; view_count is public like the other post counters.

-- ---------------------------------------------------------------- 1. account deletion
create or replace function public.delete_my_account(delete_content boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if exists (select 1 from public.profiles where id = uid and role = 'admin')
     and not exists (select 1 from public.profiles where role = 'admin' and id <> uid) then
    raise exception 'the last admin cannot delete their account' using errcode = 'SL409';
  end if;
  if delete_content then
    perform set_config('slop.trusted', 'on', true);
    update public.comments c set deleted = true, text = ''
     where c.author_id = uid and exists (select 1 from public.comments r where r.parent_id = c.id);
    delete from public.comments c
     where c.author_id = uid and not exists (select 1 from public.comments r where r.parent_id = c.id);
    delete from public.posts where author_id = uid;
    perform set_config('slop.trusted', 'off', true);
  end if;
  delete from auth.users where id = uid;
end $$;
revoke execute on function public.delete_my_account(boolean) from public, anon;
grant execute on function public.delete_my_account(boolean) to authenticated;

-- ---------------------------------------------------------------- 2. visit counts
create table if not exists public.page_views (
  day   date not null,
  path  text not null check (char_length(path) <= 80),
  views integer not null default 0,
  primary key (day, path)
);
alter table public.page_views enable row level security;
create policy "admins read page views" on public.page_views for select using (public.is_admin());

alter table public.posts add column if not exists view_count integer not null default 0;

-- counts one view of a known page; anything else is ignored. Days follow Korean time.
create or replace function public.track_view(p_path text) returns void
language plpgsql security definer set search_path = public as $$
declare v_path text := left(coalesce(p_path, ''), 80);
begin
  if v_path !~ '^(home|popular|gems|judge|communities|terms|privacy|p/[0-9a-f-]{36}|c/[a-z0-9-]{2,30}|u/[a-z0-9_]{3,20})$' then return; end if;
  insert into public.page_views (day, path, views) values ((now() at time zone 'Asia/Seoul')::date, v_path, 1)
  on conflict (day, path) do update set views = public.page_views.views + 1;
  if v_path like 'p/%' then
    update public.posts set view_count = view_count + 1 where id = substr(v_path, 3)::uuid;
  end if;
end $$;
revoke execute on function public.track_view(text) from public;
grant execute on function public.track_view(text) to anon, authenticated;
