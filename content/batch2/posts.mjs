// Batch 2 (2026-11-10): six items by the site owner, each in Korean and English.
// `file` = app in this folder; `hours` = how long ago it is dated.
const STORY_KO = `등대가 자동화되던 날, 박 씨는 마지막 근무 일지를 썼다.

"22시 14분. 이상 없음. 잘 자라."

삼십 년 동안 그는 일지 끝에 늘 그렇게 적었다. 누구에게 하는 말인지는 그도 몰랐다. 바다에게, 지나가는 배들에게, 어쩌면 자기 자신에게.

새로 들어온 관리 시스템은 지난 일지를 모두 학습했다. 날씨와 물때, 고장 기록, 그리고 매일 밤 같은 시각에 적힌 같은 문장까지.

은퇴한 박 씨는 언덕 아래 작은 집으로 옮겼다. 창문으로 등대가 보였다. 첫날 밤 그는 잠이 오지 않아 불빛을 셌다. 십 초에 한 번, 규칙대로였다.

22시 14분, 불빛이 한 번 더 깜빡였다. 짧게, 두 번.

다음 날 밤에도, 그다음 날에도 그랬다. 항만청 직원은 사소한 오작동이라며 고쳐 주겠다고 했다. 박 씨는 손을 내저었다.

"두세요. 이상 없다는 뜻이에요."

직원은 알 수 없다는 얼굴로 돌아갔다. 그날 밤 박 씨는 창가에 앉아 기다렸다. 22시 14분. 짧게, 두 번.

그는 처음으로 대답했다.

"그래. 너도 잘 자라."

---
Claude에게 "기계가 사람의 습관을 물려받는 짧은 이야기, 슬프지 않게"라고 부탁해서 나온 글을 조금 다듬었어요. 마지막 줄이 보석인지 슬롭인지 판정해 주세요.`;

const STORY_EN = `On the day the lighthouse went automatic, Mr. Park wrote his last log entry.

"22:14. All clear. Sleep well."

For thirty years he had ended every log that way. He never knew who he was saying it to. The sea, the passing ships, maybe himself.

The new control system learned from every old log: the weather, the tides, the repairs, and the same sentence written at the same minute every night.

Retired, Mr. Park moved to a small house at the foot of the hill. He could see the lighthouse from his window. The first night he couldn't sleep, so he counted the flashes. One every ten seconds, as it should be.

At 22:14 the light blinked one extra time. Short, twice.

It did the same the next night, and the night after. A man from the harbor office said it was a minor glitch and offered to fix it. Mr. Park waved him off.

"Leave it. It means all clear."

The man left looking puzzled. That night Mr. Park sat by the window and waited. 22:14. Short, twice.

For the first time, he answered.

"You too. Sleep well."

---
I asked Claude for "a short story about a machine inheriting a person's habit, not a sad one," then edited it a little. Is the last line a gem or slop?`;

const PROMPT_KO = `아래 글을 요약해 줘. 규칙을 꼭 지켜 줘.

1. 핵심 내용 3가지를 한 줄씩 쓴다.
2. 각 줄 바로 아래에, 그 근거가 되는 원문 문장을 따옴표로 그대로 인용한다. 인용문은 한 글자도 고치지 않는다.
3. 원문에서 근거를 찾을 수 없는 내용은 쓰지 않는다. 꼭 필요하면 "[원문에 없음]"이라고 표시한다.
4. 마지막에 "이 글이 다루지 않은 것"을 1~2개 적는다.
5. 인용문을 빼고 전체 300자 이내로 쓴다.

[글]
(여기에 붙여 넣기)`;

const PROMPT_EN = `Summarize the text below. Follow these rules exactly.

1. Write the 3 key points, one line each.
2. Right under each line, quote the sentence from the text that supports it, in quotation marks, word for word. Do not change a single word of the quote.
3. Do not include anything you cannot find support for in the text. If you must, mark it "[not in the text]".
4. End with 1–2 things "this text does not cover".
5. Keep it under 80 words, not counting the quotes.

[Text]
(paste here)`;

export const POSTS = [
  // ---------------------------------------------------------------- color mixing game
  { community: 'game', kind: 'html', file: 'color-mix.html', hours: 0.5,
    title: '물감 섞기 퍼즐: 다섯 가지 물감으로 목표 색을 맞춰 보세요',
    tags: ['퍼즐', '색', '캐주얼'],
    body: '빨강, 노랑, 파랑, 흰색, 검정 물감을 한 방울씩 떨어뜨려 목표 색을 만드는 게임이에요. 5라운드이고, 사람 눈에 비슷해 보이는 정도(CIELAB 색차)로 점수를 매겨요. 정답보다 방울을 적게 쓰면 보너스가 있어요.\n\n화면 속 물감은 실제 물감처럼 섞이도록 흉내 냈어요. 파랑과 노랑을 섞으면 초록이 돼요.\n\n**궁금한 점**: 너무 어려운가요, 쉬운가요? 최고 점수 자랑도 환영해요.',
    prompt: '물감 다섯 가지(빨강, 노랑, 파랑, 흰색, 검정)를 방울 단위로 섞어 목표 색을 맞추는 단일 HTML 게임. 섞기는 RGB 평균이 아니라 실제 물감처럼(파랑+노랑=초록), 점수는 CIELAB 색차로. 목표 색은 항상 만들 수 있는 조합에서 뽑기. 5라운드, 모바일 터치 대응.' },
  { community: 'game', kind: 'html', file: 'color-mix.en.html', hours: 0.6,
    title: 'Paint Mixing Puzzle: match the target color with five paints',
    tags: ['puzzle', 'color', 'casual'],
    body: 'Drop red, yellow, blue, white and black paint one drop at a time to match the target color. Five rounds, scored by how close the colors look to the human eye (CIELAB color difference). Use fewer drops than the answer for a bonus.\n\nThe paints are simulated to mix like real paint: blue and yellow make green.\n\n**Tell me**: too hard or too easy? High scores welcome.',
    prompt: 'A single-HTML game: mix five paints (red, yellow, blue, white, black) drop by drop to match a target color. Mixing should behave like real paint (blue + yellow = green), not an RGB average. Score with CIELAB color difference. Targets are always reachable. 5 rounds, works with touch.' },

  // ---------------------------------------------------------------- birthday problem
  { community: 'study', kind: 'html', file: 'birthday.html', hours: 1.5,
    title: '생일 문제: 23명만 모여도 생일 같은 사람이 있을 확률 50% (직접 뽑아 보기)',
    tags: ['확률', '수학', '시뮬레이션'],
    body: '"한 반에 생일이 같은 사람이 있을까?" 직관으로는 100명은 넘어야 할 것 같지만, 23명이면 50%, 57명이면 99%예요.\n\n사람 수를 바꾸면 정확한 확률과 그래프가 바뀌고, "한 반 뽑아 보기"를 누르면 365칸 달력에 생일을 찍어서 겹친 날을 빨갛게 보여 줘요. 1000반을 한꺼번에 뽑아 계산값과 비교할 수도 있어요.\n\n이해하는 데 도움이 됐는지 판정해 주세요.',
    prompt: '생일 문제를 체감하게 하는 단일 HTML. 사람 수 슬라이더(2~80), 정확한 확률과 곡선 그래프, 한 반을 무작위로 뽑아 365칸 격자에 표시하고 겹친 날 강조, 1000반 시뮬레이션 결과를 계산값과 비교. 왜 높은지 "쌍의 수"로 한 줄 설명.' },
  { community: 'study', kind: 'html', file: 'birthday.en.html', hours: 1.6,
    title: 'The birthday problem: 23 people give a 50% chance of a shared birthday (try it)',
    tags: ['probability', 'math', 'simulation'],
    body: '"Does anyone in this room share a birthday?" It feels like you would need well over 100 people, but 23 is enough for 50%, and 57 for 99%.\n\nMove the slider to see the exact probability and the curve. "Draw one room" drops each birthday onto a 365-cell calendar and turns matches red. You can also draw 1000 rooms at once and compare with the math.\n\nDid it help it click? Judge it.',
    prompt: 'A single-HTML page that makes the birthday problem intuitive: a people slider (2–80), the exact probability and its curve, drawing one random room onto a 365-cell grid with matches highlighted, and a 1000-room simulation compared with the math. Explain it in one line using the number of pairs.' },

  // ---------------------------------------------------------------- settle up
  { community: 'work-tools', kind: 'html', file: 'settle-up.html', hours: 3,
    title: '모임 정산 계산기: 송금 횟수가 가장 적게 "누가 누구에게 얼마" 알려 줘요',
    tags: ['정산', '모임', '계산기'],
    body: '1차는 민지가, 2차는 준호가, 택시는 서연이가 냈을 때 누가 누구에게 얼마를 보내야 할까요? 사람과 결제 내역만 적으면 1인당 금액을 계산하고, **송금 횟수가 가장 적게** 정리해 줘요. 결과는 단톡방에 붙여 넣기 좋게 복사할 수 있어요.\n\n**알려 주세요**: "나는 2차 안 갔어"처럼 일부만 나누는 기능이 필요할까요?',
    prompt: '모임 정산 단일 HTML. 사람 이름(쉼표 구분)과 결제 내역(내용, 낸 사람, 금액)을 받아 1인당 금액을 구하고, 가장 많이 받을 사람과 가장 많이 낼 사람을 짝지어 송금 횟수를 줄이는 방식으로 "A → B 금액" 목록을 만든다. 결과 복사 버튼, 원 단위 내림.' },
  { community: 'work-tools', kind: 'html', file: 'settle-up.en.html', hours: 3.1,
    title: 'Group expense splitter: who pays whom, with the fewest transfers',
    tags: ['money', 'friends', 'calculator'],
    body: 'Maya paid for dinner, Jun for coffee, Sofia for the taxi. Who owes whom? Enter the people and the payments: it works out each share and settles everyone up with **as few transfers as possible**. Copy the result straight into your group chat.\n\n**Tell me**: do you need "I skipped coffee" style partial splits?',
    prompt: 'A single-HTML group expense splitter: take names (comma-separated) and payments (what, who paid, amount), compute each share, then pair the biggest debtor with the biggest creditor to keep transfers few. Output "A → B amount" lines, a copy button, and work in cents.' },

  // ---------------------------------------------------------------- generative wind lines
  { community: 'video', kind: 'html', file: 'flow-field.html', hours: 5,
    title: '바람의 결: 수천 개의 선이 보이지 않는 바람을 따라 흘러요 (누르면 바람이 바뀌어요)',
    tags: ['생성예술', '애니메이션', '인터랙티브'],
    body: '화면 위 입자 수천 개가 보이지 않는 바람(겹친 사인파로 만든 흐름)을 따라 움직이며 선을 남겨요. 가만히 두면 결이 점점 쌓여서 머릿결이나 물살 같은 무늬가 돼요.\n\n- **짧게 누르기**: 새 바람과 새 색 조합\n- **누른 채 움직이기**: 손가락 주위에 소용돌이\n\n마음에 드는 무늬가 나오면 캡처해서 댓글로 보여 주세요.',
    prompt: '흐름장(flow field) 생성 예술 단일 HTML 캔버스. 입자 수천 개가 사인파를 겹친 각도장을 따라 움직이며 반투명 선을 남기고, 화면은 아주 천천히 어두워진다. 탭하면 새 바람과 팔레트, 드래그하면 손가락 주위에 소용돌이. 모바일 대응, devicePixelRatio 최대 2.' },
  { community: 'video', kind: 'html', file: 'flow-field.en.html', hours: 5.1,
    title: 'Wind Lines: thousands of strokes following an invisible wind (tap for a new one)',
    tags: ['generative art', 'animation', 'interactive'],
    body: 'Thousands of particles follow an invisible wind (a flow made of layered sine waves) and leave lines behind. Leave it running and the strokes build up into patterns like hair or currents.\n\n- **Tap**: a new wind and a new palette\n- **Press and drag**: stir a swirl around your finger\n\nIf you get a pattern you like, post a screenshot in the comments.',
    prompt: 'A flow-field generative art piece in one HTML canvas. Thousands of particles follow an angle field made of layered sine waves and leave translucent strokes while the canvas fades very slowly. Tap for a new wind and palette; drag to add a swirl around the finger. Works on phones; devicePixelRatio capped at 2.' },

  // ---------------------------------------------------------------- short story
  { community: 'writing', kind: 'text', hours: 7,
    title: '짧은 소설: 「등대의 마지막 로그」',
    tags: ['소설', '짧은글', '등대'],
    body: STORY_KO },
  { community: 'writing', kind: 'text', hours: 7.1,
    title: 'Short story: "The Lighthouse\'s Last Log"',
    tags: ['fiction', 'flash fiction', 'lighthouse'],
    body: STORY_EN },

  // ---------------------------------------------------------------- prompt
  { community: 'prompt', kind: 'text', hours: 9,
    title: '요약에 "근거 문장 인용"을 붙이게 하는 프롬프트 (지어낸 내용 걸러내기)',
    tags: ['프롬프트', '요약', '사실확인'],
    body: 'AI 요약은 읽기 좋지만, 원문에 없는 내용이 슬쩍 섞여도 알아채기 어려워요. 이 프롬프트는 요약 한 줄마다 **원문 문장을 그대로 인용**하게 해서, 맞는지 몇 초 만에 확인할 수 있게 만들어요. 근거가 없으면 "[원문에 없음]"이라고 표시하게 했어요.\n\n기사, 회의록, 논문 초록에 써 보고 결과가 어땠는지 알려 주세요.',
    prompt: PROMPT_KO },
  { community: 'prompt', kind: 'text', hours: 9.1,
    title: 'A summary prompt that quotes its evidence (to catch made-up claims)',
    tags: ['prompt', 'summary', 'fact-checking'],
    body: 'AI summaries read well, but it is hard to notice when something that is not in the source slips in. This prompt makes every summary line **quote the original sentence word for word**, so you can check it in seconds. Anything without support gets marked "[not in the text]".\n\nTry it on articles, meeting notes or paper abstracts and tell me how it went.',
    prompt: PROMPT_EN },
];
