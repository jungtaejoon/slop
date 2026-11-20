-- Slop Log (the blog at jungtaejoon.github.io/blog) visit counts, kept in the same database.
-- Per day (Korea time), page path and the session's source: views = pages seen,
-- visits = sessions that started on that page. Nothing about the visitor is stored.
create table if not exists public.blog_traffic (
  day    date not null,
  path   text not null check (path ~ '^/[A-Za-z0-9/_.%~-]{0,119}$'),
  source text not null check (source ~ '^[a-z0-9._:-]{1,60}$'),
  views  integer not null default 0,
  visits integer not null default 0,
  primary key (day, path, source)
);
alter table public.blog_traffic enable row level security;
create policy "admins read blog traffic" on public.blog_traffic for select using (public.is_admin());

create or replace function public.track_blog(p_path text, p_source text, p_first boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_path text := left(coalesce(p_path, ''), 120); v_src text := lower(left(coalesce(p_source, ''), 60));
begin
  if v_path !~ '^/[A-Za-z0-9/_.%~-]{0,119}$' or v_src !~ '^[a-z0-9._:-]{1,60}$' then return; end if;
  insert into public.blog_traffic (day, path, source, views, visits)
  values ((now() at time zone 'Asia/Seoul')::date, v_path, v_src, 1, case when p_first then 1 else 0 end)
  on conflict (day, path, source) do update set views = public.blog_traffic.views + 1,
    visits = public.blog_traffic.visits + case when p_first then 1 else 0 end;
end $$;
revoke execute on function public.track_blog(text, text, boolean) from public;
grant execute on function public.track_blog(text, text, boolean) to anon, authenticated;
