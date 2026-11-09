-- Hardening from the Supabase security advisor.
-- Trigger functions never need to be callable over the API (triggers fire
-- regardless of EXECUTE grants), so nobody gets EXECUTE on them.
-- Write RPCs are for signed-in users only. The small helpers used inside RLS
-- policies (is_mod, is_admin, can_write, is_community_mod, post_community)
-- must stay executable by anon/authenticated, because policies run as the caller.

alter function public.text_array(jsonb) set search_path = public;
alter function public.trusted() set search_path = public;

revoke execute on function
  public.handle_new_user(), public.guard_profile(), public.guard_comment(), public.guard_post(), public.guard_community(),
  public.refresh_comment_count(), public.refresh_post_votes(), public.refresh_comment_votes(),
  public.refresh_member_count(), public.refresh_post_count(), public.follow_defaults(),
  public.notify_on_comment(), public.notify_on_gem(), public.report_community()
from public, anon, authenticated;

revoke execute on function
  public.create_post(jsonb), public.save_post_version(uuid, jsonb, uuid[]),
  public.create_community(jsonb), public.set_community_mod(uuid, text, boolean)
from public, anon;
grant execute on function
  public.create_post(jsonb), public.save_post_version(uuid, jsonb, uuid[]),
  public.create_community(jsonb), public.set_community_mod(uuid, text, boolean)
to authenticated;
