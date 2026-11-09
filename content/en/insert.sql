begin;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, s.kind, $e$Memory Pairs: a card-matching game with 3 levels and saved best scores$e$, $e$Flip two cards at a time and find the matching emoji. Easy, Normal and Hard each remember your fewest moves.

Works well on phones too. Brag about your best score in the comments.$e$, $e$$e$, array[]::text[], replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(s.code, $e$<html lang="ko">$e$, $e$<html lang="en">$e$), $e$짝 맞추기$e$, $e$Memory Pairs$e$), $e$>쉬움<$e$, $e$>Easy<$e$), $e$>보통<$e$, $e$>Normal<$e$), $e$>어려움<$e$, $e$>Hard<$e$), $e$시도 <b$e$, $e$Moves <b$e$), $e$시간 <b id="time">0</b>초$e$, $e$Time <b id="time">0</b>s$e$), $e$최고 <b$e$, $e$Best <b$e$), $e$aria-label="카드"$e$, $e$aria-label="card"$e$), $e$${moves}번 만에 ${s}초 걸렸어요!$e$, $e$${moves} moves, ${s} seconds!$e$), $e$ 최고 기록이에요 🎉$e$, $e$ New best 🎉$e$), $e$다시 하기$e$, $e$Play again$e$), s.code_lang, '', s.tool, $e$Single-file HTML emoji memory game. 3 levels (6/8/10 pairs), move count and timer, best score per level saved in localStorage, touch friendly.$e$, array[$e$casual$e$,$e$memory$e$,$e$mobile$e$]::text[], false, now() - interval '37 minutes', now() - interval '37 minutes'
  from public.communities c, public.posts s where c.slug = $e$game$e$ and s.id = '431218e5-8041-4f55-a9ff-114ce572bc51' and not exists (select 1 from public.posts where title = $e$Memory Pairs: a card-matching game with 3 levels and saved best scores$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, s.kind, $e$Reaction Time Test: tap the moment it turns green$e$, $e$Tap when the red screen turns green and it measures your reaction in milliseconds. Tap too early and you are out. Shows your last-5 average and best. Spacebar works too.

What is your average?$e$, $e$$e$, array[]::text[], replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(s.code, $e$<html lang="ko">$e$, $e$<html lang="en">$e$), $e$반응속도 테스트$e$, $e$Reaction Time Test$e$), $e$화면을 누르면 시작해요.$e$, $e$Tap to start.$e$), $e$빨간색이 초록색으로 바뀌는 순간 최대한 빨리 누르세요.$e$, $e$When red turns green, tap as fast as you can.$e$), $e$최근 ${hist.length}번 평균 $e$, $e$Last ${hist.length} avg $e$), $e$ms · 최고 $e$, $e$ms · best $e$), $e$<h1>기다리세요…</h1><p>초록색이 되면 누르세요</p>$e$, $e$<h1>Wait…</h1><p>Tap when it turns green</p>$e$), $e$<h1>지금!</h1>$e$, $e$<h1>Now!</h1>$e$), $e$<h1>너무 빨랐어요!</h1><p>초록색이 될 때까지 기다려 주세요. 다시 누르면 시작해요.</p>$e$, $e$<h1>Too soon!</h1><p>Wait for green. Tap to try again.</p>$e$), $e$'프로게이머급이에요'$e$, $e$'Pro gamer level'$e$), $e$'평균보다 빨라요'$e$, $e$'Faster than average'$e$), $e$'평균 정도예요'$e$, $e$'About average'$e$), $e$'조금 졸리신가요?'$e$, $e$'A bit sleepy?'$e$), $e$<p>다시 하려면 누르세요</p>$e$, $e$<p>Tap to go again</p>$e$), s.code_lang, '', s.tool, $e$Single-file HTML reaction test. Idle (grey) → ready (red, random 1.2–4 s) → time the click on green, disqualify early clicks, last-5 average and best, spacebar support.$e$, array[$e$test$e$,$e$casual$e$]::text[], false, now() - interval '74 minutes', now() - interval '74 minutes'
  from public.communities c, public.posts s where c.slug = $e$game$e$ and s.id = '7f65ae65-de1d-4e67-b186-085c1aacc3ee' and not exists (select 1 from public.posts where title = $e$Reaction Time Test: tap the moment it turns green$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, s.kind, $e$16-Step Drum Machine: every sound synthesized live in the browser$e$, $e$Kick, snare, hi-hat and clap: 4 rows × 16 steps. Tap cells to place beats and hit play. Every sound is made on the spot with Web Audio (zero sample files).

Three preset patterns included. Made a good one? Post a screenshot.$e$, $e$$e$, array[]::text[], replace(replace(replace(replace(replace(replace(replace(replace(replace(s.code, $e$<html lang="ko">$e$, $e$<html lang="en">$e$), $e$16스텝 드럼 머신$e$, $e$16-Step Drum Machine$e$), $e$'킥', '스네어', '하이햇', '박수'$e$, $e$'Kick', 'Snare', 'Hi-hat', 'Clap'$e$), $e$▶ 재생$e$, $e$▶ Play$e$), $e$■ 정지$e$, $e$■ Stop$e$), $e$템포 $e$, $e$Tempo $e$), $e$패턴 바꾸기$e$, $e$Next pattern$e$), $e$지우기$e$, $e$Clear$e$), $e$칸을 눌러 박자를 켜고 끄세요. 소리는 녹음 파일 없이 브라우저에서 바로 합성해요.$e$, $e$Tap cells to toggle beats. Every sound is synthesized in the browser; no samples.$e$), s.code_lang, '', s.tool, $e$Single-file HTML 16-step drum machine that synthesizes kick/snare/hi-hat/clap with Web Audio only. Tempo slider, 3 preset patterns, clear, current-step indicator.$e$, array[$e$webaudio$e$,$e$beats$e$,$e$instrument$e$]::text[], false, now() - interval '111 minutes', now() - interval '111 minutes'
  from public.communities c, public.posts s where c.slug = $e$music$e$ and s.id = '376348d0-1f94-4dfa-8e77-92a1dcc7019d' and not exists (select 1 from public.posts where title = $e$16-Step Drum Machine: every sound synthesized live in the browser$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, s.kind, $e$Endless night-sky fireworks (tap to launch one right there)$e$, $e$A fireworks show drawn on a canvas every frame. Leave it alone and it fires on its own; tap the screen and a rocket goes up to that spot. Now and then you get a ring burst.$e$, $e$$e$, array[]::text[], replace(replace(replace(s.code, $e$<html lang="ko">$e$, $e$<html lang="en">$e$), $e$밤하늘 불꽃놀이$e$, $e$Night Sky Fireworks$e$), $e$화면을 누르면 그 자리로 불꽃이 올라가요. 가만히 두면 알아서 터져요.$e$, $e$Tap to launch a firework there. Leave it alone and it launches on its own.$e$), s.code_lang, '', s.tool, $e$Single-file HTML endless canvas 2D fireworks. Auto launches + launch at click position, sphere and ring bursts, trails, twinkling star background.$e$, array[$e$animation$e$,$e$canvas$e$,$e$relaxing$e$]::text[], false, now() - interval '148 minutes', now() - interval '148 minutes'
  from public.communities c, public.posts s where c.slug = $e$video$e$ and s.id = 'f36484fb-70e9-4e15-bbbc-8e28739ff7d7' and not exists (select 1 from public.posts where title = $e$Endless night-sky fireworks (tap to launch one right there)$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, s.kind, $e$Text contrast checker with a "find the nearest passing color" button$e$, $e$Pick a text color and a background and it computes the WCAG contrast ratio right away. If it fails, it finds **the passing color that changes yours the least**.

Handy when a designer says "make this grey a little darker" and you want to check it in numbers.$e$, $e$$e$, array[]::text[], replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(s.code, $e$<html lang="ko">$e$, $e$<html lang="en">$e$), $e$글자색 대비 검사기$e$, $e$Text Contrast Checker$e$), $e$통과하는 가장 가까운 글자색 찾기$e$, $e$Find the nearest passing text color$e$), $e$글자색 <input$e$, $e$Text color <input$e$), $e$배경색 <input$e$, $e$Background <input$e$), $e$큰 제목은 이렇게 보여요$e$, $e$This is how a large heading looks$e$), $e$본문 글자는 이렇게 보여요. 작은 글씨일수록 대비가 더 커야 읽기 편해요.$e$, $e$This is how body text looks. Smaller text needs more contrast to stay readable.$e$), $e$'본문 AAA'$e$, $e$'Body AAA'$e$), $e$'본문 AA'$e$, $e$'Body AA'$e$), $e$'큰 글자 AAA'$e$, $e$'Large AAA'$e$), $e$'큰 글자 AA'$e$, $e$'Large AA'$e$), $e$'통과' : '미달'$e$, $e$'pass' : 'fail'$e$), $e$색 바꾸기$e$, $e$Swap colors$e$), s.code_lang, '', s.tool, $e$Single-file HTML that computes the WCAG contrast ratio of two colors and shows AA/AAA pass or fail. If it fails, a button nudges the text color away from the background until it is the nearest color above 4.5:1.$e$, array[$e$design$e$,$e$accessibility$e$,$e$tool$e$]::text[], false, now() - interval '185 minutes', now() - interval '185 minutes'
  from public.communities c, public.posts s where c.slug = $e$web$e$ and s.id = '7eeccbfc-632c-47e4-af79-7e07b91121d5' and not exists (select 1 from public.posts where title = $e$Text contrast checker with a "find the nearest passing color" button$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, s.kind, $e$Recipe servings scaler: paste an ingredient list, only the numbers change$e$, $e$Paste a whole recipe and change "2 servings → 5 servings": it finds the numbers on each line and scales them. Understands "1/2", "1.5" and words like "half".

**Try it and tell me**: how should it handle things like "a pinch" or "to taste"?$e$, $e$$e$, array[]::text[], replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(s.code, $e$<html lang="ko">$e$, $e$<html lang="en">$e$), $e$레시피 인분 계산기$e$, $e$Recipe Servings Scaler$e$), $e$재료를 한 줄에 하나씩 붙여 넣고 인분을 바꾸면, 숫자만 골라서 비율대로 바꿔 줘요. "1/2", "1.5", "반 개" 같은 표현도 알아들어요.$e$, $e$Paste one ingredient per line and change the servings: only the numbers get scaled. Fractions like "1/2" and decimals like "1.5" work too.$e$), $e$원래 <input$e$, $e$From <input$e$), $e$value="2"> 인분$e$, $e$value="2"> servings$e$), $e$value="5"> 인분$e$, $e$value="5"> servings$e$), $e$돼지고기 앞다리살 300g
감자 2개
양파 1/2개
고추장 1.5큰술
간장 2큰술
설탕 1작은술
다진 마늘 반 큰술
물 400ml$e$, $e$Pork shoulder 300g
Potatoes 2
Onion 1/2
Gochujang 1.5 tbsp
Soy sauce 2 tbsp
Sugar 1 tsp
Garlic, minced 1/2 tbsp
Water 400ml$e$), $e$const WORD = { '반': 0.5, '한': 1, '두': 2, '세': 3, '네': 4 };$e$, $e$const WORD = { half: 0.5, one: 1, two: 2, three: 3, four: 4 };$e$), $e$line.replace(/(반|한|두|세|네)\s*(?=(개|큰술|작은술|컵|줌|쪽|모))/,$e$, $e$line.replace(/\b(half|one|two|three|four)\b\s*(?=(cups?|tbsp|tsp|cloves?|pinch))/i,$e$), $e$fmt(WORD[w] * k)$e$, $e$fmt(WORD[w.toLowerCase()] * k)$e$), $e$'재료를 넣어 주세요'$e$, $e$'Add some ingredients'$e$), s.code_lang, '', s.tool, $e$Single-file HTML: paste a recipe ingredient list and scale only the numbers to the new servings. Handle fractions (1/2), decimals and words like "half". Highlight the changed numbers.$e$, array[$e$cooking$e$,$e$calculator$e$,$e$everyday$e$]::text[], false, now() - interval '222 minutes', now() - interval '222 minutes'
  from public.communities c, public.posts s where c.slug = $e$work-tools$e$ and s.id = 'df0fcf25-5627-4641-ad6f-5c7e09f30e19' and not exists (select 1 from public.posts where title = $e$Recipe servings scaler: paste an ingredient list, only the numbers change$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, s.kind, $e$The Monty Hall problem finally clicks after you play it 1000 times (simulator)$e$, $e$Three doors, a car behind one. You pick, the host opens a door with a goat and asks "do you want to switch?". **Switching wins 2/3 of the time**, and most people do not believe it at first.

Play a few rounds by hand, then run 1000 automatically and watch the win rates settle.$e$, $e$$e$, array[]::text[], replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(s.code, $e$<html lang="ko">$e$, $e$<html lang="en">$e$), $e$몬티 홀 시뮬레이터$e$, $e$Monty Hall Simulator$e$), $e$문 하나를 고르세요.$e$, $e$Pick a door.$e$), $e$<th>전략</th><th>시도</th><th>이김</th><th>승률</th>$e$, $e$<th>Strategy</th><th>Plays</th><th>Wins</th><th>Win rate</th>$e$), $e$<td>바꿈</td>$e$, $e$<td>Switch</td>$e$), $e$<td>안 바꿈</td>$e$, $e$<td>Stay</td>$e$), $e$1000번 자동으로 (반은 바꾸고 반은 그대로)$e$, $e$Run 1000 automatically (half switch, half stay)$e$), $e$기록 지우기$e$, $e$Reset stats$e$), $e$`${opened + 1}번 문 뒤에는 염소가 있어요. 고른 문을 바꾸시겠어요?`$e$, $e$`Door ${opened + 1} hides a goat. Do you want to switch?`$e$), $e$바꿀래요$e$, $e$Switch$e$), $e$그대로 할래요$e$, $e$Stay$e$), $e$'자동차를 얻었어요! 🎉' : '아쉽게도 염소예요.'$e$, $e$'You won the car! 🎉' : 'Sorry, it was a goat.'$e$), $e$한 번 더$e$, $e$Again$e$), s.code_lang, '', s.tool, $e$Single-file HTML Monty Hall simulator: play by hand (pick, host opens a goat door, switch or stay), a stats table for switch vs stay, and a button that runs 1000 games automatically.$e$, array[$e$probability$e$,$e$math$e$,$e$simulation$e$]::text[], false, now() - interval '259 minutes', now() - interval '259 minutes'
  from public.communities c, public.posts s where c.slug = $e$study$e$ and s.id = '708b2182-fc9c-4dcb-aa14-caa6db03f8a7' and not exists (select 1 from public.posts where title = $e$The Monty Hall problem finally clicks after you play it 1000 times (simulator)$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select null::uuid, c.id, s.kind, $e$Live meeting cost meter: how much has this meeting cost so far?$e$, $e$Enter the number of attendees and an average salary, press start, and watch the cost tick up every second. It also tells you how many coffees that is.

**What works**: put it on the shared screen and meetings get shorter, guaranteed.
**What is missing**: it only counts salary, not benefits or overhead. Suggestions welcome.$e$, $e$$e$, array[]::text[], replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(s.code, $e$<html lang="ko">$e$, $e$<html lang="en">$e$), $e$회의 비용 계산기$e$, $e$Meeting Cost Meter$e$), $e$이 회의, 지금까지 얼마짜리일까?$e$, $e$How much has this meeting cost so far?$e$), $e$>₩0<$e$, $e$>$0<$e$), $e$00:00:00 경과$e$, $e$00:00:00 elapsed$e$), $e$참석자 수$e$, $e$Attendees$e$), $e$1인당 연봉 (만원)$e$, $e$Salary per person (USD / year)$e$), $e$value="5500"$e$, $e$value="90000"$e$), $e$step="100"$e$, $e$step="5000"$e$), $e$회의 시작$e$, $e$Start meeting$e$), $e$>초기화<$e$, $e$>Reset<$e$), $e$// 주 40시간 × 52주$e$, $e$// 40 h/week × 52 weeks$e$), $e$* 10000 / HOURS_PER_YEAR$e$, $e$/ HOURS_PER_YEAR$e$), $e$const fmt = (n) => '₩' + Math.floor(n).toLocaleString('ko-KR');$e$, $e$const fmt = (n) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: n < 100 ? 2 : 0 });$e$), $e$`${h}:${m}:${sec} 경과`$e$, $e$`${h}:${m}:${sec} elapsed`$e$), $e$Math.floor(s * ps / 4500)$e$, $e$Math.floor(s * ps / 5)$e$), $e$`1초에 <b>${fmt(ps)}</b>, 1시간이면 <b>${fmt(ps * 3600)}</b>이에요.<br>지금까지 쓴 돈이면 커피 <b>${coffee.toLocaleString('ko-KR')}잔</b>을 살 수 있어요.`$e$, $e$`<b>${fmt(ps)}</b> per second, <b>${fmt(ps * 3600)}</b> per hour.<br>So far it could have bought <b>${coffee.toLocaleString('en-US')} coffees</b>.`$e$), $e$'이어서 진행'$e$, $e$'Resume'$e$), $e$'잠깐 멈춤'$e$, $e$'Pause'$e$), s.code_lang, '', s.tool, $e$Single-file HTML page: enter meeting attendees and salary per person, and the meeting cost rises in real time. Dark background, big number, pause/reset, a relatable unit like "number of coffees".$e$, array[$e$tool$e$,$e$work$e$,$e$calculator$e$]::text[], true, now() - interval '296 minutes', now() - interval '296 minutes'
  from public.communities c, public.posts s where c.slug = $e$web$e$ and s.id = 'bf1bc6a5-e7c9-4d65-a877-726df7358a79' and not exists (select 1 from public.posts where title = $e$Live meeting cost meter: how much has this meeting cost so far?$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select null::uuid, c.id, s.kind, $e$Typing Rain: stop the falling AI buzzwords by typing them$e$, $e$Words like "prompt", "hallucination" and "embedding" fall from the sky. Type one and press Enter before it hits the ground. It keeps speeding up, and three misses ends the game.$e$, $e$$e$, array[]::text[], replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(s.code, $e$<html lang="ko">$e$, $e$<html lang="en">$e$), $e$타자 소나기$e$, $e$Typing Rain$e$), $e$떨어지는 단어를 입력하고 Enter$e$, $e$Type a falling word, then Enter$e$), $e$점수 <b$e$, $e$Score <b$e$), $e$단어가 바닥에 닿기 전에 입력하세요. 놓치면 하트가 줄어요.$e$, $e$Type each word before it hits the ground. Miss one and you lose a heart.$e$), $e$시작하기$e$, $e$Start$e$), $e$'프롬프트 토큰 환각 임베딩 파인튜닝 벡터 에이전트 컨텍스트 추론 샘플링 온도 슬롭 보석 판정 리믹스 버전 데이터셋 그래디언트 파라미터 어텐션 디코더 인코더 배치 레이턴시 캐시 확률 정규화 과적합 학습률 체크포인트'$e$, $e$'prompt token hallucination embedding finetune vector agent context inference sampling temperature slop gem verdict remix version dataset gradient parameter attention decoder encoder batch latency cache softmax overfit checkpoint benchmark'$e$), $e$`게임 끝! ${score}점`$e$, $e$`Game over! ${score} points`$e$), $e$'한 번 더 해볼까요?'$e$, $e$'One more round?'$e$), $e$'다시 하기'$e$, $e$'Play again'$e$), s.code_lang, '', s.tool, $e$Single-file HTML typing game where words fall from the top and you type them to clear them. 3 hearts, gradually faster.$e$, array[$e$typing$e$,$e$casual$e$]::text[], true, now() - interval '333 minutes', now() - interval '333 minutes'
  from public.communities c, public.posts s where c.slug = $e$game$e$ and s.id = 'ace50164-5494-4e3b-a930-7563d11e6070' and not exists (select 1 from public.posts where title = $e$Typing Rain: stop the falling AI buzzwords by typing them$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select null::uuid, c.id, s.kind, $e$Rainy day lo-fi generator: a new chord progression every time, live in the browser$e$, $e$Not a recording: music synthesized on the spot with Web Audio. Press play and 9th-chord progressions drift over the sound of rain; every 16 bars the key and progression change.

You can set the rain and keys volume and the tempo. Is it good enough to leave on while you work? You decide.$e$, $e$$e$, array[]::text[], replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(s.code, $e$<html lang="ko">$e$, $e$<html lang="en">$e$), $e$비 오는 날 로파이 생성기$e$, $e$Rainy Day Lo-fi Generator$e$), $e$매번 다른 코드 진행과 빗소리를 실시간으로 만들어요. 소리가 나니 볼륨을 확인하세요.$e$, $e$Makes a new chord progression and rain sound in real time, every time. It plays audio, so check your volume.$e$), $e$>재생<$e$, $e$>Play<$e$), $e$'재생'$e$, $e$'Play'$e$), $e$'일시정지'$e$, $e$'Pause'$e$), $e$<span>빗소리</span>$e$, $e$<span>Rain</span>$e$), $e$<span>건반</span>$e$, $e$<span>Keys</span>$e$), $e$<span>템포</span>$e$, $e$<span>Tempo</span>$e$), $e$// ii-V-I 계열 + 몇 가지 변주, 7th/9th 보이싱$e$, $e$// ii-V-I family plus variations, 7th/9th voicings$e$), $e$// 빗소리: 핑크에 가까운 노이즈 + 밴드패스$e$, $e$// rain: near-pink noise through a band-pass$e$), s.code_lang, '', s.tool, $e$Single-file HTML that generates rainy-day lo-fi in real time with the Web Audio API only. Noise-based rain, ii-V-I variations with maj9/m9 voicings, key change every 16 bars, volume and tempo sliders, a simple spectrum visual.$e$, array[$e$lofi$e$,$e$webaudio$e$,$e$focus$e$]::text[], true, now() - interval '370 minutes', now() - interval '370 minutes'
  from public.communities c, public.posts s where c.slug = $e$music$e$ and s.id = '3a1185e6-cc6b-4717-afeb-f9870978fb57' and not exists (select 1 from public.posts where title = $e$Rainy day lo-fi generator: a new chord progression every time, live in the browser$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select null::uuid, c.id, s.kind, $e$A never-ending generative animation: deep sea jellyfish$e$, $e$Instead of a rendered video, a "video that never ends" drawn on a canvas every frame. Jellyfish pulse and drift upward; click to drop food and they chase it and slowly grow.

Screensaver material, or just slop? You judge.$e$, $e$$e$, array[]::text[], replace(replace(replace(replace(replace(replace(s.code, $e$<html lang="ko">$e$, $e$<html lang="en">$e$), $e$심해 해파리$e$, $e$Deep Sea Jellyfish$e$), $e$>일시정지<$e$, $e$>Pause<$e$), $e$해파리 추가$e$, $e$Add jellyfish$e$), $e$'재생' : '일시정지'$e$, $e$'Play' : 'Pause'$e$), $e$클릭하면 그 자리에 먹이가 떨어져요$e$, $e$Click to drop food$e$), s.code_lang, '', s.tool, $e$Endless canvas 2D animation of deep-sea jellyfish pulsing upward. Tentacles sway on sine waves; clicking drops food the jellyfish follow. Pause and "add jellyfish" buttons.$e$, array[$e$animation$e$,$e$canvas$e$,$e$relaxing$e$]::text[], true, now() - interval '407 minutes', now() - interval '407 minutes'
  from public.communities c, public.posts s where c.slug = $e$video$e$ and s.id = '57aed9e2-6e1f-480f-a400-bb709e7b928d' and not exists (select 1 from public.posts where title = $e$A never-ending generative animation: deep sea jellyfish$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, $e$text$e$, $e$A code-review prompt that gets you real bugs, not nitpicks$e$, $e$Ask an AI to review code and you often get a flood of trivial comments about variable names. This prompt is built to get **only things that actually break, with evidence**.

Try it and tell us how it went.$e$, $e$$e$, array[]::text[], '', '', '', $e$Claude$e$, $e$You are a meticulous senior engineer. Review the code change below.

Rules:
1. Only flag things that cause wrong behavior, data loss, security issues or performance problems. Do not flag taste (naming, style).
2. For each finding, write:
   - Location (file:line)
   - What input or situation makes it go wrong, and how (a concrete example)
   - How to fix it (one or two lines of code)
   - Confidence: high/medium
3. If your confidence is low, do not flag it; collect it at the end under "Worth checking".
4. If there are no problems, write only "No issues". No praise, no summary.

Code:
{{paste the diff or code here}}$e$, array[$e$prompt$e$,$e$dev$e$,$e$code-review$e$]::text[], false, now() - interval '444 minutes', now() - interval '444 minutes'
  from public.communities c where c.slug = $e$prompt$e$ and not exists (select 1 from public.posts where title = $e$A code-review prompt that gets you real bugs, not nitpicks$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, $e$text$e$, $e$A prompt that turns meeting notes into "who does what by when"$e$, $e$Feed it a meeting transcript or notes and it pulls out only the decisions and the action items. The key part: if an owner or deadline was never set in the meeting, it **marks it "TBD" instead of making one up**.$e$, $e$$e$, array[]::text[], '', '', '', $e$Claude$e$, $e$From the meeting notes below, extract only these three things.

1. Decisions (one line each)
2. Action items table: | Task | Owner | Due |
   - If the meeting did not set an owner or due date, write "TBD". Do not guess.
3. Questions that need an answer before the next meeting

Rules:
- Do not write anything that is not in the notes.
- Leave out small talk, greetings and repetition.
- Separate decisions from opinions. If someone only proposed something and there was no agreement, it is not a decision.

Meeting notes:
{{paste here}}$e$, array[$e$prompt$e$,$e$work$e$,$e$meetings$e$]::text[], false, now() - interval '481 minutes', now() - interval '481 minutes'
  from public.communities c where c.slug = $e$prompt$e$ and not exists (select 1 from public.posts where title = $e$A prompt that turns meeting notes into "who does what by when"$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, $e$text$e$, $e$Idea: a "neighborhood noise map" by time of day (and the flaws the AI pointed out itself)$e$, $e$**In one line**: people measure the noise around them for 30 seconds with their phone, and the service maps each neighborhood's noise by time of day.

**Why it might be needed**
- You usually view a home during the day, so you only learn about the night-time motorbikes and bars after you move in.
- Noise can be measured in numbers (dB), which is easier to compare than reviews.

**Flaws the AI pointed out itself**
- Every phone microphone has a different sensitivity, so the same spot reads differently. It needs per-device calibration.
- People still have to do the measuring, and the motivation is weak. People thinking about moving might use it briefly and leave.
- If a particular shop or house gets marked as "the noisy place", disputes follow. The map has to blur everything to at least block level.

Gem or slop? I would love to hear from anyone who has tried something like this.$e$, $e$$e$, array[]::text[], '', '', '', $e$Claude$e$, $e$Propose one data-driven service idea that solves an everyday problem, then honestly point out its 3 most serious weaknesses. No hype.$e$, array[$e$idea$e$,$e$neighborhood$e$,$e$housing$e$]::text[], false, now() - interval '518 minutes', now() - interval '518 minutes'
  from public.communities c where c.slug = $e$idea$e$ and not exists (select 1 from public.posts where title = $e$Idea: a "neighborhood noise map" by time of day (and the flaws the AI pointed out itself)$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, $e$text$e$, $e$Discussion: what makes an AI creation a "gem"?$e$, $e$I run Slop Lab and want to settle the judging criteria together. Here are my candidates.

1. **You can actually use it**: it runs, you can follow it, or you can copy it and use it right away.
2. **A human clearly worked on it**: the prompt was revised several times, the results were curated, or it was polished by hand.
3. **There is something unexpected**: at least one solution or phrase you would not have thought of.
4. **The source is honest**: it says which tool and prompt made it.

"Slop", on the other hand, is something you spend time on and get nothing back.

What are your criteria? Add yours in the comments and I will fold them into the site's judging guide.$e$, $e$$e$, array[]::text[], '', '', '', $e$$e$, $e$$e$, array[$e$discussion$e$,$e$criteria$e$,$e$community$e$]::text[], false, now() - interval '555 minutes', now() - interval '555 minutes'
  from public.communities c where c.slug = $e$etc$e$ and not exists (select 1 from public.posts where title = $e$Discussion: what makes an AI creation a "gem"?$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select null::uuid, c.id, $e$text$e$, $e$Poem: "To the Prompt"$e$, $e$You always say only half of it.
"Make it cooler." "Just do it well."
All night I set chairs in that blank
and wait, not knowing who will sit.

Some days I never manage to ask
whether you wanted the rainy window
or yourself, reflected in it,
and I answer anyway.

But the one line you wrote back,
"No, not that. A little lonelier,"
in that one line, for the first time,
I see your face.

> Note: I wanted to answer the claim that "AI poems all sound the same", so I wrote it from the side that receives the prompt. Point out where it gets cliché.$e$, $e$$e$, array[]::text[], '', '', '', $e$Claude$e$, $e$A short free-verse poem from the point of view of an AI receiving prompts, about the relationship between a vague request and the rewritten one. Avoid clichéd "light and darkness" imagery.$e$, array[$e$poem$e$,$e$short$e$]::text[], true, now() - interval '592 minutes', now() - interval '592 minutes'
  from public.communities c where c.slug = $e$writing$e$ and not exists (select 1 from public.posts where title = $e$Poem: "To the Prompt"$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, $e$text$e$, $e$Short story: "The Memory Nobody Returned"$e$, $e$The memory rental shop was on the second floor across from the station. A day with someone else's memory cost ten dollars. Most people rented the sea. A sea they had never been to, a sea seen for the first time, a sea seen with someone.

Sujin had rented the same memory for three years. A summer afternoon at twelve, an old woman she did not know cutting a watermelon for her. Nobody knew whose memory it was. The clerk said it was "a memory that was never returned": its owner had left it there and never came back for it.

"What happens if they never come back?"
"If nobody claims it for long enough, it belongs to the last person who rented it."

That day, for the first time, Sujin did not return the memory. Instead she listened for one more day to the knife going through the watermelon, to the cicadas falling silent on the wooden porch. The next day she taped a note to the shop door.

"To whoever left the memory of the grandmother with the watermelon, the summer you were twelve: I am keeping it safe. When you come for it, there is something I would like to leave with you, too."

> Note: people say "AI stories always end warmly", so I asked for a rewrite that leaves the ending open. Tell me where it feels clichéd.$e$, $e$$e$, array[]::text[], '', '', '', $e$Claude$e$, $e$A short story under 400 words about a shop that rents out other people's memories. The protagonist keeps renting a memory that was never returned. Less sentimental explanation, more showing through scenes. Leave the ending open.$e$, array[$e$fiction$e$,$e$short$e$,$e$sci-fi$e$]::text[], false, now() - interval '629 minutes', now() - interval '629 minutes'
  from public.communities c where c.slug = $e$writing$e$ and not exists (select 1 from public.posts where title = $e$Short story: "The Memory Nobody Returned"$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select null::uuid, c.id, $e$image$e$, $e$Three pictures drawn with code: rainy night windows, a contour island, sunflower seeds$e$, $e$Not an image model: these are SVGs drawn by a small script Claude wrote (seeded random numbers).

1. **Rainy night windows**: a grid of apartment windows, with only the lit homes in warm colors.
2. **Contour island**: an island made from layered noise, colored by height.
3. **Sunflower seeds**: a Fibonacci arrangement placing dots at the golden angle (137.5°).

Which one is the most "gem"-like? You judge.$e$, $e$$e$, array[$e$examples/art-rainy-windows.svg$e$,$e$examples/art-contour-island.svg$e$,$e$examples/art-sunflower.svg$e$]::text[], '', '', '', $e$Claude (drawn with code)$e$, $e$A Node script that makes three SVGs with seeded random numbers: (1) a grid of apartment windows on a rainy night (2) a contour island (3) golden-angle sunflower seeds. No external libraries.$e$, array[$e$generative-art$e$,$e$svg$e$,$e$pattern$e$]::text[], true, now() - interval '666 minutes', now() - interval '666 minutes'
  from public.communities c where c.slug = $e$art$e$ and not exists (select 1 from public.posts where title = $e$Three pictures drawn with code: rainy night windows, a contour island, sunflower seeds$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, $e$image$e$, $e$Two pictures drawn with code: moiré from overlapping circles, and color-field blocks$e$, $e$Not an image model: SVGs drawn by a short script.

1. **Moiré**: overlap two sets of concentric circles with slightly different centers and waves appear that were never drawn.
2. **Color-field blocks**: rectangles split at random, with primary colors in just a few cells.

Which one is more of a "gem"?$e$, $e$$e$, array[$e$examples/art-moire.svg$e$,$e$examples/art-blocks.svg$e$]::text[], '', '', '', $e$Claude (drawn with code)$e$, $e$Two SVGs with seeded random numbers: (1) a moiré pattern from two sets of concentric circles with slightly offset centers (2) a color-field composition of recursively split rectangles with only some cells in primary colors.$e$, array[$e$generative-art$e$,$e$svg$e$,$e$abstract$e$]::text[], false, now() - interval '703 minutes', now() - interval '703 minutes'
  from public.communities c where c.slug = $e$art$e$ and not exists (select 1 from public.posts where title = $e$Two pictures drawn with code: moiré from overlapping circles, and color-field blocks$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, $e$link$e$, $e$claude-warmup: start your Claude 5-hour window before you sit down$e$, $e$If you use Claude Code, you know the 5-hour usage window: it starts with your first message. This small tool checks every few minutes and, only when no window is active, sends a one-word "hi" to Haiku through the official `claude` CLI. So the window is already running (and resets sooner, mid-workday) by the time you start.

- Zero-dependency Node, small enough to read in one sitting
- Reads usage with `claude -p /usage`, a local command that costs 0 tokens, and also shows your session and weekly usage with reset times
- Never touches your credentials; the official CLI handles auth
- Runs on macOS (launchd), Linux (systemd or cron) and Windows (Task Scheduler)

**To be clear**: it does not raise your limit. It only shifts when the window resets so it lines up with your day.

Source: https://github.com/jungtaejoon/claude-warmup

I built it with Claude Code. Useful gem or pointless slop? Your verdict is welcome.$e$, $e$https://jungtaejoon.github.io/claude-warmup/$e$, array[]::text[], '', '', '', $e$Claude Code$e$, $e$$e$, array[$e$claude$e$,$e$cli$e$,$e$automation$e$]::text[], false, now() - interval '0 minutes', now() - interval '0 minutes'
  from public.communities c where c.slug = $e$work-tools$e$ and not exists (select 1 from public.posts where title = $e$claude-warmup: start your Claude 5-hour window before you sit down$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
with ins as (insert into public.posts (author_id, community_id, kind, title, body, url, images, code, code_lang, code_head, tool, prompt, tags, is_example, created_at, updated_at)
  select 'cd9c3016-053a-444e-a6b2-0fdca194f213'::uuid, c.id, $e$link$e$, $e$claude-warmup: 자리에 앉기 전에 Claude 5시간 사용 창을 미리 시작해 두는 도구$e$, $e$Claude Code를 쓰면 5시간 사용 창이 있죠. 첫 메시지를 보내는 순간부터 5시간이 시작돼요. 이 도구는 몇 분마다 확인하다가, 사용 창이 비어 있을 때만 공식 `claude` CLI로 Haiku에게 "hi" 한 마디를 보내요. 그래서 일을 시작할 때쯤이면 창이 이미 돌아가고 있고, 한창 일하는 중간에 초기화돼요.

- 의존성 없는 Node, 한 번에 다 읽을 수 있는 크기
- 사용량은 `claude -p /usage`로 읽어요. 로컬 명령이라 토큰을 쓰지 않고, 세션·주간 사용량과 초기화 시각도 보여 줘요
- 내 Claude 로그인 정보는 건드리지 않아요. 인증은 공식 CLI가 해요
- macOS(launchd), Linux(systemd 또는 cron), Windows(작업 스케줄러)에서 돌아가요

**분명히 해 둘 점**: 사용 한도를 늘려 주지는 않아요. 초기화되는 시각을 내 하루에 맞게 옮겨 줄 뿐이에요.

소스: https://github.com/jungtaejoon/claude-warmup

Claude Code로 만들었어요. 쓸모 있는 보석인지, 의미 없는 슬롭인지 판정해 주세요.$e$, $e$https://jungtaejoon.github.io/claude-warmup/ko/$e$, array[]::text[], '', '', '', $e$Claude Code$e$, $e$$e$, array[$e$claude$e$,$e$cli$e$,$e$자동화$e$]::text[], false, now() - interval '0 minutes', now() - interval '0 minutes'
  from public.communities c where c.slug = $e$work-tools$e$ and not exists (select 1 from public.posts where title = $e$claude-warmup: 자리에 앉기 전에 Claude 5시간 사용 창을 미리 시작해 두는 도구$e$)
  returning *)
insert into public.post_versions (post_id, n, title, body, url, images, code, prompt, note, author_id, created_at)
select id, 1, title, body, url, images, code, prompt, 'First version', author_id, created_at from ins;
commit;
