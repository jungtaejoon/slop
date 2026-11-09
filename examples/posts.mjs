// Example posts, one or more per board. They are loaded into the demo mode and
// into supabase/seed.sql by `npm run examples`. Everything here was made by
// Claude for this project, so tool is "Claude" and the prompts are the real ones.
// `file` reads code from examples/, `images` points at files that
// scripts/build-examples.mjs draws into public/examples/.

export const EXAMPLE_POSTS = [
  {
    slug: 'meeting-cost', cat: 'web', kind: 'html', file: 'meeting-cost.html', tool: 'Claude',
    title: '회의 비용 실시간 계산기: 이 회의, 지금 얼마짜리일까?',
    tags: ['도구', '회사생활', '계산기'],
    body: '참석자 수와 평균 연봉을 넣고 시작을 누르면 회의 비용이 초 단위로 올라가요. 커피 몇 잔 값인지도 알려 줘요.\n\n**볼 만한 점**: 숫자가 올라가는 걸 회의 화면에 띄워 두면 회의가 확실히 짧아져요.\n**아쉬운 점**: 연봉만 보고 계산해서 4대 보험 같은 회사 부담분은 빠져 있어요. 개선 제안 환영해요.',
    prompt: '회의 참석자 수와 1인당 연봉을 입력하면 회의 비용이 실시간으로 올라가는 단일 HTML 페이지를 만들어 줘. 어두운 배경, 큰 숫자, 일시정지/초기화, "커피 몇 잔" 같은 체감 단위.',
  },
  {
    slug: 'typing-rain', cat: 'game', kind: 'html', file: 'typing-rain.html', tool: 'Claude',
    title: '타자 소나기: 떨어지는 AI 용어를 입력해서 막아라',
    tags: ['타자', '캐주얼', '한글'],
    body: '하늘에서 "프롬프트", "환각", "임베딩" 같은 단어가 떨어져요. 바닥에 닿기 전에 입력하고 Enter를 누르면 사라져요. 점점 빨라지고, 세 번 놓치면 끝이에요.\n\n한글 조합 중(IME)에는 Enter가 무시되도록 처리돼 있어서 마지막 글자가 씹히지 않아요.',
    prompt: '한글 단어가 위에서 떨어지고 입력창에 쳐서 맞히는 타자 게임을 단일 HTML로. 하트 3개, 점점 빨라지게, 한글 IME 조합 중 Enter 처리 주의.',
  },
  {
    slug: 'generative-windows', cat: 'art', kind: 'image', tool: 'Claude (코드로 생성)',
    images: ['examples/art-rainy-windows.svg', 'examples/art-contour-island.svg', 'examples/art-sunflower.svg'],
    title: '코드로 그린 그림 세 장: 비 오는 밤의 창문, 등고선 섬, 해바라기 씨앗',
    tags: ['생성아트', 'svg', '패턴'],
    body: '이미지 생성 모델이 아니라, Claude가 짠 작은 스크립트(시드 고정 난수)로 그린 SVG예요.\n\n1. **비 오는 밤의 창문**: 아파트 창문을 격자로 놓고, 불 켜진 집만 따뜻한 색으로 칠했어요.\n2. **등고선 섬**: 노이즈를 겹쳐 만든 섬을 높이별로 칠했어요.\n3. **해바라기 씨앗**: 황금각(137.5°)으로 점을 배치하는 피보나치 배열이에요.\n\n어떤 게 제일 "보석" 같은지 판정해 주세요.',
    prompt: '시드 고정 난수로 SVG 세 장을 만드는 Node 스크립트: (1) 비 오는 밤 아파트 창문 격자 (2) 등고선 섬 (3) 황금각 해바라기 씨앗. 외부 라이브러리 없이.',
  },
  {
    slug: 'poem-to-prompt', cat: 'writing', kind: 'text', tool: 'Claude',
    title: '시: 「프롬프트에게」',
    tags: ['시', '짧은글'],
    body: `너는 늘 반쯤만 말한다
"좀 더 멋지게", "알아서 잘"
나는 그 빈칸에 밤새 의자를 놓고
누가 앉을지 모르는 채로 기다린다

어떤 날은 네가 원한 게
비 오는 창문이었는지
창문에 비친 너였는지
끝내 묻지 못하고 답을 낸다

그래도 네가 다시 쓴 한 줄,
"아니, 그거 말고 조금 더 쓸쓸하게"
그 한 줄에 나는 처음으로
너의 얼굴을 본다

> 작가 메모: "AI가 쓴 시는 다 비슷하다"는 말에 답하고 싶어서, 프롬프트를 받는 쪽의 시점으로 써 봤어요. 어디가 상투적인지 짚어 주세요.`,
    prompt: '프롬프트를 받는 AI의 시점에서, 모호한 요청과 다시 고쳐 쓴 요청 사이의 관계를 다룬 짧은 한국어 자유시. 상투적인 "빛과 어둠" 표현은 피하기.',
  },
  {
    slug: 'rain-lofi', cat: 'music', kind: 'html', file: 'rain-lofi.html', tool: 'Claude',
    title: '비 오는 날 로파이 생성기: 매번 다른 코드 진행이 브라우저에서 실시간으로',
    tags: ['로파이', 'webaudio', '집중'],
    body: '녹음 파일이 아니라 Web Audio로 그 자리에서 합성하는 음악이에요. 재생을 누르면 빗소리 위에 9th 코드 진행이 흘러나오고, 16마디마다 조성과 진행이 바뀌어요.\n\n빗소리·건반 볼륨과 템포를 조절할 수 있어요. 작업할 때 틀어 두기 좋은지 들어 보고 판정해 주세요.',
    prompt: 'Web Audio API만으로 비 오는 날 로파이를 실시간 생성하는 단일 HTML. 노이즈 기반 빗소리, maj9/m9 보이싱의 ii-V-I 변주, 16마디마다 조성 변경, 볼륨·템포 슬라이더, 간단한 스펙트럼 시각화.',
  },
  {
    slug: 'jellyfish', cat: 'video', kind: 'html', file: 'jellyfish.html', tool: 'Claude',
    title: '끝나지 않는 생성 애니메이션: 심해 해파리',
    tags: ['애니메이션', '캔버스', '힐링'],
    body: '렌더링된 영상 대신, 캔버스로 매 프레임 그리는 "끝나지 않는 영상"이에요. 해파리가 박동하며 떠오르고, 화면을 클릭하면 먹이가 떨어져서 해파리가 쫓아가 조금씩 커져요.\n\n화면보호기로 쓸 만한지, 아니면 그냥 슬롭인지 판정해 주세요.',
    prompt: '캔버스 2D로 심해 해파리가 박동하며 떠오르는 무한 애니메이션. 촉수는 사인파로 흔들리고, 클릭하면 먹이가 떨어져 해파리가 따라가게. 일시정지, 해파리 추가 버튼.',
  },
  {
    slug: 'sort-photos', cat: 'code', kind: 'code', file: 'sort_photos.py', codeLang: 'python', tool: 'Claude',
    title: '사진 폴더를 촬영 날짜별로 정리하는 파이썬 스크립트 (표준 라이브러리만)',
    tags: ['python', '자동화', '사진'],
    body: '`YYYY/YYYY-MM-DD/` 폴더로 사진을 옮겨 줘요. 설치할 패키지가 없고, JPEG 안의 EXIF 촬영 날짜를 직접 읽어요. EXIF가 없으면 파일 수정 시각을 써요.\n\n기본은 **미리보기**만 하고, `--apply`를 붙여야 실제로 옮겨요. 같은 이름이 있으면 덮어쓰지 않아요.\n\n```\npython3 sort_photos.py ~/Pictures/정리할폴더\npython3 sort_photos.py ~/Pictures/정리할폴더 --apply\n```',
    prompt: '표준 라이브러리만으로, 폴더 안 사진을 EXIF 촬영 날짜(없으면 수정 시각) 기준 YYYY/YYYY-MM-DD 폴더로 옮기는 파이썬 스크립트. 기본은 미리보기, --apply로 실행, 이름 충돌 시 덮어쓰지 않기.',
  },
  {
    slug: 'spec-prompt', cat: 'prompt', kind: 'text', tool: 'Claude',
    title: '모호한 요청을 "확인 질문 + 사양서"로 바꿔 주는 프롬프트',
    tags: ['프롬프트', '기획', '템플릿'],
    body: '"쇼핑몰 하나 만들어 줘" 같은 요청을 받으면 바로 만들지 말고, 먼저 꼭 필요한 질문만 하고 사양서를 쓰게 하는 프롬프트예요. 결과물이 엉뚱한 방향으로 가는 걸 꽤 줄여 줘요.\n\n**써 보고 남겨 주세요**: 질문이 너무 많아지는 경우, 어떤 문구를 바꾸면 나아지는지.',
    prompt: `너는 요청을 바로 실행하기 전에 사양을 정리하는 기획자다.

1. 아래 요청을 읽고, 결과물을 크게 바꿀 수 있는 결정만 골라 최대 3개의 확인 질문을 한다. 기본값으로 정해도 되는 건 묻지 않는다.
2. 각 질문에는 내가 고를 수 있는 보기 2~3개와 네가 추천하는 보기를 붙인다.
3. 내가 답하면, 다음 형식으로 한 쪽짜리 사양서를 쓴다:
   - 목표 (한 문장)
   - 사용자와 사용 상황
   - 꼭 있어야 할 것 / 이번엔 빼는 것
   - 완료 기준 (확인 가능한 문장 3~5개)
4. 사양서에 없는 가정은 "가정:"으로 따로 표시한다.

요청: {{여기에 요청}}`,
  },
  {
    slug: 'tool-library', cat: 'idea', kind: 'text', tool: 'Claude',
    title: '아이디어: 아파트 단지 "공구 도서관" (그리고 AI가 스스로 짚은 약점)',
    tags: ['아이디어', '동네', '공유경제'],
    body: `**한 줄 요약**: 아파트 관리사무소 창고에 드릴, 사다리, 캠핑 장비를 모아 두고 주민이 앱으로 빌려 쓰는 서비스.

**왜 될 것 같나**
- 전동 드릴은 평생 평균 사용 시간이 15분 남짓이라는 말이 있을 만큼, 사는 것보다 빌리는 게 합리적인 물건이 많아요.
- 관리사무소라는 신뢰할 수 있는 보관 장소가 이미 있어요.

**AI가 스스로 짚은 약점**
- 파손·분실 책임을 누가 지는지 정하지 않으면 첫 달에 멈춰요. 보증금이나 관리비 연동이 필요해요.
- 주말 오전에 수요가 몰려요. 인기 물건은 2~3개씩 있어야 해요.
- 관리사무소 직원의 일이 늘어나요. 무인 사물함이 없으면 지속되기 어려워요.

이 아이디어가 보석인지 슬롭인지, 실제로 해 본 사람의 의견이 궁금해요.`,
    prompt: '동네 단위 공유 서비스 아이디어 하나를 제안하고, 스스로 가장 치명적인 약점 3가지를 솔직하게 짚어 줘. 과장 없이.',
  },
  {
    slug: 'what-is-slop', cat: 'etc', kind: 'link', url: 'https://en.wikipedia.org/wiki/AI_slop', tool: '',
    title: '"AI 슬롭"이라는 말은 어디서 왔을까 (위키백과)',
    tags: ['토론', '용어', '읽을거리'],
    body: '"AI 슬롭"은 품질보다 양으로 쏟아지는 AI 생성물을 가리키는 말로 퍼졌어요. 이 게시판의 출발점이기도 해요.\n\n이야기해 보고 싶은 것: **"AI가 만들었다"는 사실만으로 가치를 깎는 게 맞을까요?** 여러분이 본 것 중 "슬롭인 줄 알았는데 보석"이었던 걸 댓글로 알려 주세요.',
  },
];
