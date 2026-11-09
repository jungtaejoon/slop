-- Personalized recommendations ("추천" sort, Swipe mode).
--
-- recommend_posts() scores every visible post for the caller and returns ids in
-- order, with a short reason the app can show. It runs as the caller (security
-- invoker), so it only sees the caller's own votes, saves and follows, and RLS
-- still decides which posts exist. Five parts, added up:
--
--   quality   smoothed gem share: (up+2)/(votes+4), so 1 vote can't swing it
--   engage    log of comments, views, remixes and gems
--   fresh     decays over days, not hours (a small site needs a longer shelf life)
--   taste     how the caller voted on and saved posts in the same community, with
--             the same tags and of the same kind; authors they keep voting slop
--             on drift down. Followed communities get a small extra lift.
--   explore   a random lift (stable per seed) that shrinks as a post collects
--             verdicts, so new posts get judged instead of buried
--
-- Posts the caller already judged, saved or has seen (p_seen, kept by the app) sink
-- rather than vanish, so lists never run dry. The caller's own posts are left out.

create or replace function public.recommend_posts(
  p_lang text default 'all', p_community uuid default null, p_follow_only boolean default false,
  p_seen uuid[] default '{}', p_seed integer default 0, p_offset integer default 0, p_limit integer default 30)
returns table (post_id uuid, score double precision, reason text)
language sql stable security invoker set search_path = '' as $$
with me as (select auth.uid() as uid),
follows as (select m.community_id from public.community_members m, me where m.user_id = me.uid),
myvotes as (
  select v.post_id, v.value::float8 as w, p.community_id, p.author_id, p.tags, p.kind
  from public.post_votes v join public.posts p on p.id = v.post_id, me where v.user_id = me.uid),
likes as (
  select community_id, tags, kind, w from myvotes
  union all
  select p.community_id, p.tags, p.kind, 1.0 from public.saves s join public.posts p on p.id = s.post_id, me where s.user_id = me.uid),
comm_aff as (select community_id, sum(w) / (count(*) + 2) as a from likes group by community_id),
tag_aff  as (select t, sum(w) / (count(*) + 2) as a from likes, unnest(tags) as t group by t),
kind_aff as (select kind, sum(w) / (count(*) + 3) as a from likes group by kind),
author_s as (select author_id, sum(w) as s from myvotes where author_id is not null group by author_id),
remixes  as (select remix_of, count(*) as n from public.posts where remix_of is not null and not hidden group by remix_of),
cand as (
  select p.id, p.community_id, p.author_id, p.kind, p.tags, p.is_example,
         p.up_count, p.down_count, p.comment_count, p.view_count, coalesce(r.n, 0) as remix_n,
         extract(epoch from now() - p.created_at) / 3600.0 as age_h,
         p.community_id in (select community_id from follows) as followed,
         p.id in (select post_id from myvotes) as voted,
         p.id in (select s.post_id from public.saves s, me where s.user_id = me.uid) as saved
  from public.posts p left join remixes r on r.remix_of = p.id, me
  where not p.hidden
    and (p_community is null or p.community_id = p_community)
    and (not p_follow_only or p.community_id in (select community_id from follows))
    and (p_lang = 'all' or (p_lang = 'ko') = (p.title ~ '[가-힣]'))
    and (me.uid is null or p.author_id is distinct from me.uid)),
parts as (
  select c.*,
    ((c.up_count + 2.0) / (c.up_count + c.down_count + 4.0) - 0.5) * 2 as quality,
    ln(1 + c.comment_count * 3 + c.view_count * 0.3 + c.remix_n * 4 + c.up_count) as engage,
    1.0 / power(1 + c.age_h / 36.0, 0.7) as fresh,
    coalesce((select a from comm_aff x where x.community_id = c.community_id), 0) * 1.2
      + coalesce((select avg(a) from tag_aff x where x.t = any(c.tags)), 0) * 0.8
      + coalesce((select a from kind_aff x where x.kind = c.kind), 0) * 0.5
      + least(0, coalesce((select s from author_s x where x.author_id = c.author_id), 0)) * 0.25 as taste,
    (abs(hashtextextended(c.id::text, p_seed)) % 1000000) / 1e6 / sqrt(1 + c.up_count + c.down_count) as explore
  from cand c),
base as (
  select *, 0.9 * quality + 0.35 * engage + 1.1 * fresh + taste + 0.6 * explore
      + case when followed then 0.3 else 0 end
      - case when is_example then 0.15 else 0 end as s
  from parts),
ranked as (
  -- judged and seen posts shrink (not just shift), so even a busy post drops below fresh ones
  select id,
    case when voted then s * 0.3 - 1.0 when saved or id = any(p_seen) then s * 0.4 - 0.6 else s end as score,
    case when voted then 'judged'
         when taste >= 0.25 then 'taste'
         when up_count + down_count < 3 and age_h < 72 then 'new'
         when up_count >= 3 and quality >= 0.4 then 'gem'
         when followed then 'follow'
         when engage >= 2.5 then 'popular'
         else 'explore' end as reason
  from base)
select id, score, reason from ranked
order by score desc, id
offset greatest(p_offset, 0) limit least(greatest(p_limit, 1), 100);
$$;
grant execute on function public.recommend_posts(text, uuid, boolean, uuid[], integer, integer, integer) to anon, authenticated;
