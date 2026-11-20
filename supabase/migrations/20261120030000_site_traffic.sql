-- Visit counts for the owner's other static sites (first: alltests.ai.kr), kept in the Slop database.
-- Per site, day (Korea time), page key and the session's source: views = pages seen,
-- visits = sessions that started on that page. Nothing about the visitor is stored. Admins read it.
create table if not exists public.site_traffic (
  site   text not null check (site in ('alltests')),
  day    date not null,
  path   text not null check (path ~ '^/[A-Za-z0-9/_.%~#-]{0,119}$'),
  source text not null check (source ~ '^[a-z0-9._:-]{1,60}$'),
  views  integer not null default 0,
  visits integer not null default 0,
  primary key (site, day, path, source)
);
alter table public.site_traffic enable row level security;
create policy "admins read site traffic" on public.site_traffic for select using (public.is_admin());

create or replace function public.track_site(p_site text, p_path text, p_source text, p_first boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_path text := left(coalesce(p_path, ''), 120); v_src text := lower(left(coalesce(p_source, ''), 60));
begin
  if p_site is distinct from 'alltests' then return; end if;
  if v_path !~ '^/[A-Za-z0-9/_.%~#-]{0,119}$' or v_src !~ '^[a-z0-9._:-]{1,60}$' then return; end if;
  insert into public.site_traffic (site, day, path, source, views, visits)
  values (p_site, (now() at time zone 'Asia/Seoul')::date, v_path, v_src, 1, case when p_first then 1 else 0 end)
  on conflict (site, day, path, source) do update set views = public.site_traffic.views + 1,
    visits = public.site_traffic.visits + case when p_first then 1 else 0 end;
end $$;
revoke execute on function public.track_site(text, text, text, boolean) from public;
grant execute on function public.track_site(text, text, text, boolean) to anon, authenticated;
