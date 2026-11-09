-- Blocking other users (App Store guideline 1.2 for apps with user posts).
-- A block is private: only the person who blocked can see it. Blocked users'
-- posts and comments are hidden in the app, and they stop sending notifications.

create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);
alter table public.blocks enable row level security;
create policy "own blocks" on public.blocks for all to authenticated
  using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));
grant select, insert, delete on public.blocks to authenticated;

-- no notifications from someone you blocked
create or replace function public.skip_blocked_notification() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.actor_id is not null and exists (
    select 1 from public.blocks b where b.blocker_id = new.user_id and b.blocked_id = new.actor_id) then
    return null;
  end if;
  return new;
end $$;
revoke execute on function public.skip_blocked_notification() from public, anon, authenticated;
create trigger notifications_skip_blocked before insert on public.notifications
  for each row execute function public.skip_blocked_notification();
