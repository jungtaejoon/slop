-- Where visitors come from: one count per browser session, by day (Korean time),
-- source (normalized site name like "google", "naver", "disquiet.io", or "direct")
-- and the first page they landed on. Nothing about the visitor (no IP, cookie or id).
-- Only admins read it.
create table if not exists public.referrals (
  day     date not null,
  source  text not null check (source ~ '^[a-z0-9._:-]{1,60}$'),
  landing text not null check (char_length(landing) <= 80),
  visits  integer not null default 0,
  primary key (day, source, landing)
);
alter table public.referrals enable row level security;
create policy "admins read referrals" on public.referrals for select using (public.is_admin());

create or replace function public.track_referral(p_source text, p_landing text) returns void
language plpgsql security definer set search_path = public as $$
declare v_src text := lower(left(coalesce(p_source, ''), 60)); v_land text := left(coalesce(p_landing, ''), 80);
begin
  if v_src !~ '^[a-z0-9._:-]{1,60}$' then return; end if;
  if v_land !~ '^(home|popular|gems|judge|communities|shorts|terms|privacy|login|submit|p/[0-9a-f-]{36}|c/[a-z0-9-]{2,30}|u/[a-z0-9_]{3,20}|other)$' then v_land := 'other'; end if;
  insert into public.referrals (day, source, landing, visits) values ((now() at time zone 'Asia/Seoul')::date, v_src, v_land, 1)
  on conflict (day, source, landing) do update set visits = public.referrals.visits + 1;
end $$;
revoke execute on function public.track_referral(text, text) from public;
grant execute on function public.track_referral(text, text) to anon, authenticated;
