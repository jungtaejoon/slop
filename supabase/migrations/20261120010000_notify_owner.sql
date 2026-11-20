-- Email the owner the moment someone else posts or comments.
-- The trigger only pokes the `notify` edge function with {type, id}; the function
-- re-reads the row, checks it, and records it in notify_log so it is mailed once.
create extension if not exists pg_net with schema extensions;

create table if not exists public.notify_log (
  kind    text not null,
  id      uuid not null,
  sent_at timestamptz not null default now(),
  primary key (kind, id)
);
alter table public.notify_log enable row level security; -- no policies: only the service key reads or writes it

create or replace function public.notify_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.profiles where id = new.author_id and username = 'jungtaejoon') then return new; end if;
  perform net.http_post(
    url := 'https://sbeickdtzkxxovlnnumo.supabase.co/functions/v1/notify',
    body := jsonb_build_object('type', tg_table_name, 'id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 10000);
  return new;
exception when others then
  return new; -- never block a post or comment because of mail
end $$;
revoke execute on function public.notify_owner() from public, anon, authenticated;

drop trigger if exists notify_owner_posts on public.posts;
create trigger notify_owner_posts after insert on public.posts for each row execute function public.notify_owner();
drop trigger if exists notify_owner_comments on public.comments;
create trigger notify_owner_comments after insert on public.comments for each row execute function public.notify_owner();
