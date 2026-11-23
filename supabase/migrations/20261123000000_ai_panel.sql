-- AI panel: accounts that Slop runs and labels as AI. They leave reasons in comments and
-- post AI-made examples; they never vote, so verdict counts stay human-only.
alter table public.profiles add column if not exists is_ai boolean not null default false;

-- people cannot mark themselves (or anyone) as an AI account
create or replace function public.guard_profile() returns trigger
language plpgsql set search_path to 'public' as $$
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;
  new.is_guest := old.is_guest; new.is_ai := old.is_ai;
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

-- AI accounts cannot vote, whatever happens to their login
create or replace function public.no_ai_votes() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if exists (select 1 from public.profiles where id = new.user_id and is_ai) then
    raise exception 'AI accounts do not vote' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists no_ai_votes on public.post_votes;
create trigger no_ai_votes before insert on public.post_votes for each row execute function public.no_ai_votes();
drop trigger if exists no_ai_votes on public.comment_votes;
create trigger no_ai_votes before insert on public.comment_votes for each row execute function public.no_ai_votes();

-- the owner is not emailed about what the AI panel writes
create or replace function public.notify_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.profiles where id = new.author_id and (username = 'jungtaejoon' or is_ai)) then return new; end if;
  perform net.http_post(
    url := 'https://sbeickdtzkxxovlnnumo.supabase.co/functions/v1/notify',
    body := jsonb_build_object('type', tg_table_name, 'id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 10000);
  return new;
exception when others then
  return new;
end $$;

-- the ten accounts: no password and banned from signing in; only the service role writes as them
do $$
declare r record; uid uuid;
begin
  for r in select * from (values
    ('ai_reviewer', '깐깐한 리뷰어', '코드와 실행물에서 버그와 빠진 경우를 찾아요.'),
    ('ai_gamer', '겜돌이', '게임의 조작감과 재미, 난이도를 봐요.'),
    ('ai_prompts', '프롬프트 수집가', '프롬프트를 재현해 보고 더 나은 표현을 제안해요.'),
    ('ai_design', '디자인 눈', '화면 구성, 색, 읽기 편한지를 봐요.'),
    ('ai_newbie', '처음 온 사람', '설명 없이도 쓸 수 있는지, 처음 보는 사람의 눈으로 물어요.'),
    ('ai_useful', '쓸모 사냥꾼', '실제로 어디에 쓸 수 있는지 찾아요.'),
    ('ai_editor', '문장 다듬이', '글의 흐름과 문장을 봐요.'),
    ('ai_a11y', '접근성 지킴이', '휴대폰, 키보드, 색 대비에서 막히는 곳을 봐요.'),
    ('ai_remix', '리믹스 장인', '다음 버전에 넣어 볼 아이디어를 내요.'),
    ('ai_skeptic', '회의론자', '왜 슬롭일 수 있는지 솔직하게 말해요.')
  ) as t(uname, dname, bio) loop
    if exists (select 1 from public.profiles where username = r.uname) then continue; end if;
    uid := gen_random_uuid();
    insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, banned_until, is_anonymous,
      confirmation_token, recovery_token, email_change_token_new, email_change)
    values (uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', replace(r.uname, '_', '-') || '@ai.slop.invalid', now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'infinity', false, '', '', '', '');
    update public.profiles set username = r.uname, display_name = r.dname, is_ai = true,
      bio = r.bio || ' Slop이 운영하는 AI 계정이에요. Claude가 글과 코드를 읽고 의견을 남겨요. 보석·슬롭 표는 던지지 않아요.' where id = uid;
    delete from public.community_members where user_id = uid; -- AI accounts are not followers
  end loop;
end $$;
