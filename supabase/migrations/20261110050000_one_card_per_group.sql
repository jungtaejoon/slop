-- Lists show one card per language group (posts.lang_group). post_feed gains lang and
-- lang_group, plus alt_ko / alt_en: "another edition of this post exists in Korean /
-- English", which the app filters on when every language is shown.
create or replace view public.post_feed with (security_invoker = true) as
 SELECT p.id, p.author_id, p.community_id, c.slug AS community_slug, c.name AS community_name, p.kind, p.title,
    "left"(p.body, 400) AS excerpt, p.url, p.images, p.code_lang, p.code_head, p.tool, p.tags, p.version, p.remix_of,
    p.remix_of_version, p.pinned, p.hidden, p.hidden_reason, p.locked, p.is_example, p.up_count, p.down_count,
    p.comment_count, p.created_at, p.updated_at, p.up_count - p.down_count AS score, p.up_count + p.down_count AS vote_total,
    sign((p.up_count - p.down_count)::double precision) * log(GREATEST(abs(p.up_count - p.down_count), 1)::numeric)::double precision
      + (EXTRACT(epoch FROM p.created_at) / 45000::numeric)::double precision AS hot,
    CASE WHEN p.up_count > 0 AND p.down_count > 0
         THEN (p.up_count + p.down_count)::numeric * LEAST(p.up_count, p.down_count)::numeric / GREATEST(p.up_count, p.down_count)::numeric
         ELSE 0::numeric END AS contro,
    p.up_count >= 3 AND (p.up_count * 4) >= (3 * (p.up_count + p.down_count)) AS is_gem,
    a.username AS author_username, a.display_name AS author_name, a.avatar_url AS author_avatar,
    p.lang, p.lang_group,
    (p.lang_group IS NOT NULL AND p.lang <> 'ko' AND EXISTS (SELECT 1 FROM posts s
       WHERE s.lang_group = p.lang_group AND s.id <> p.id AND s.lang = 'ko' AND NOT s.hidden)) AS alt_ko,
    (p.lang_group IS NOT NULL AND p.lang <> 'en' AND EXISTS (SELECT 1 FROM posts s
       WHERE s.lang_group = p.lang_group AND s.id <> p.id AND s.lang = 'en' AND NOT s.hidden)) AS alt_en
   FROM posts p
     JOIN communities c ON c.id = p.community_id
     LEFT JOIN profiles a ON a.id = p.author_id;

-- recommend_posts gains p_pref (the viewer's language) to keep one edition per group.
drop function if exists public.recommend_posts(text, uuid, boolean, uuid[], integer, integer, integer);
create or replace function public.recommend_posts(
  p_lang text default 'all', p_community uuid default null, p_follow_only boolean default false,
  p_seen uuid[] default '{}', p_seed integer default 0, p_offset integer default 0, p_limit integer default 30,
  p_pref text default 'ko')
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
    and (me.uid is null or p.author_id is distinct from me.uid)
    -- one card per language group: with every language shown, keep the edition in the
    -- viewer's language when the group has one
    and (p_lang <> 'all' or p.lang_group is null or p.lang = p_pref
         or not exists (select 1 from public.posts s where s.lang_group = p.lang_group and s.id <> p.id and s.lang = p_pref and not s.hidden))),
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
grant execute on function public.recommend_posts(text, uuid, boolean, uuid[], integer, integer, integer, text) to anon, authenticated;
