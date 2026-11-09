// Interface language. The app's templates are written in Korean; when the
// interface language is English, a MutationObserver translates rendered UI text
// nodes and attributes through the dictionary below. User-written content
// (titles, bodies, comments, code) sits inside SKIP containers and is never touched.

const KEY = 'slop-lang';
export const LANGS = { en: 'English', ko: '한국어' };
export function detectLang() {
  try { const saved = localStorage.getItem(KEY); if (saved && LANGS[saved]) return saved; } catch { /* */ }
  return /^ko\b/i.test(navigator.language || '') ? 'ko' : 'en';
}
export let lang = detectLang();
export function setLang(l) { try { localStorage.setItem(KEY, l); } catch { /* */ } location.reload(); }

/* exact text-node translations (Korean → English) */
const D = {
  // header, nav, footer
  'AI가 만든 것들 속에서 보석을 캐는 곳': 'Find the gems in AI-made stuff',
  '제목·내용·도구 검색 ( / )': 'Search titles, text, tools ( / )', '검색': 'Search', '글쓰기': 'Post', '게시판': 'Boards',
  'Slop · AI가 만든 것을 그냥 넘기지 말고, 써 보고, 판정하고, 이유를 남기는 곳': "Slop · Don't just scroll past AI-made work. Try it, judge it, say why.",
  '홈': 'Home', '인기': 'Popular', '판정하기': 'Judge', '보석함': 'Gems', '커뮤니티 찾기': 'Communities', '저장함': 'Saved', '운영': 'Moderation',
  '데모 시작': 'Try demo', '로그인': 'Log in', '알림': 'Notifications', '관리자': 'admin', '운영자': 'moderator',
  '내 프로필': 'My profile', '프로필 설정': 'Profile settings', '커뮤니티 만들기': 'Create community', '로그아웃': 'Log out', '로그아웃했어요': 'Logged out',
  '. 읽기는 계속할 수 있어요.': '. You can still read.',
  '데모 모드': 'Demo mode', '서버 없이 이 브라우저에만 저장돼요. 데모 계정은 운영자 권한이 있어서 운영 기능도 써 볼 수 있어요.': 'Everything is saved only in this browser. The demo account is a moderator, so you can try moderation too.',
  '데모 초기화': 'Reset demo', '데모 데이터를 처음 상태로 되돌렸어요': 'Demo data reset',
  // kinds, flairs, report reasons
  '글': 'Text', '본문 중심': 'Mostly text', '링크': 'Link', '외부 주소': 'External URL', '이미지': 'Image', '사진 업로드': 'Upload images',
  '실행물': 'App', 'HTML 바로 실행': 'Runs HTML here', '코드': 'Code', '복사해서 쓰기': 'Copy and use',
  '의견': 'Comment', '가치 발견': 'Found value', '개선 제안': 'Suggestion', '질문': 'Question', '출처·정보': 'Source / info',
  '스팸·광고': 'Spam / ads', '악성 코드·위험한 실행물': 'Malicious code / unsafe app', '혐오·괴롭힘': 'Hate / harassment', '개인정보 노출': 'Personal info exposed',
  '저작권 침해': 'Copyright', '잘못된 게시판': 'Wrong community', '기타': 'Other', '반복적인 규칙 위반': 'Repeated rule breaking', '악성 코드 유포': 'Spreading malicious code',
  // default communities
  '웹·앱': 'Web & apps', '게임': 'Games', '이미지·아트': 'Images & art', '글·이야기': 'Writing & stories', '음악·오디오': 'Music & audio', '영상': 'Video',
  '코드·자동화': 'Code & automation', '프롬프트·대화': 'Prompts & chats', '아이디어·기획': 'Ideas', '공부·학습': 'Learning', '업무·생활 도구': 'Everyday tools',
  'AI로 만든 웹페이지, 앱, 도구. 실행물로 올리면 바로 돌려볼 수 있어요.': 'AI-made web pages, apps and tools. Post them as apps and they run right here.',
  'AI가 만든 게임과 장난감. 플레이해 보고 판정해 주세요.': 'AI-made games and toys. Play them, then judge.',
  '생성 이미지, 일러스트, 디자인 시안.': 'Generated images, illustrations, design drafts.',
  '시, 소설, 에세이, 가사 같은 AI 글.': 'AI writing: poems, fiction, essays, lyrics.',
  '생성 음악과 사운드. 링크나 실행물로 공유해요.': 'Generated music and sound, shared as links or apps.',
  '생성 영상과 애니메이션. 링크나 실행물로 공유해요.': 'Generated video and animation, shared as links or apps.',
  '스크립트, 함수, 자동화 레시피.': 'Scripts, functions, automation recipes.',
  '쓸 만한 프롬프트와 인상적인 대화 기록.': 'Useful prompts and memorable chat logs.',
  'AI가 낸 사업·기획·연구 아이디어.': 'Business, product and research ideas from AI.',
  '어디에도 안 맞는 것들.': "Things that don't fit anywhere else.",
  'AI로 만든 학습 자료, 퀴즈, 요약, 설명. 진짜 이해에 도움이 됐는지 판정해요.': 'AI-made study material, quizzes, summaries and explainers. Judge whether they actually help you understand.',
  '회사와 일상에서 바로 쓸 수 있는 AI 도구와 자동화. 매일 쓸 만한지가 기준이에요.': 'AI tools and automations for work and daily life. The bar: would you use it every day?',
  // generic
  '알 수 없는 커뮤니티': 'Unknown community', '팔로우하려면 로그인해 주세요': 'Log in to follow', '운영 중인 커뮤니티는 팔로우를 끊을 수 없어요': "You can't unfollow a community you moderate",
  '팔로우 중': 'Following', '팔로우': 'Follow', '커뮤니티': 'Community', '팔로우를 끊었어요': 'Unfollowed',
  '저장하지 못했어요. 다시 시도해 주세요.': "Couldn't save. Please try again.", '작성이 제한된 계정이에요.': 'This account is restricted from posting.', '작성이 제한된 계정이에요': 'This account is restricted from posting',
  '권한이 없어요.': "You don't have permission.", '이미 쓰이고 있는 값이에요.': 'That is already taken.', '커뮤니티는 하루에 두 개까지 만들 수 있어요.': 'You can create up to two communities a day.',
  '로그인이 필요해요': 'Please log in', 'Slop 예시': 'Slop example', '탈퇴한 사용자': 'Deleted user', '(나)': '(you)', '자세한 내용 (선택)': 'Details (optional)', '취소': 'Cancel',
  '보석: 가치 있음': 'Gem: worth it', '슬롭: 가치 없음': 'Slop: not worth it', '보석': 'Gem', '슬롭': 'Slop', '아직 판정 없음': 'No verdicts yet',
  '▲ 보석이다': '▲ Gem', '▼ 슬롭이다': '▼ Slop', '판정하려면 로그인해 주세요': 'Log in to judge', '판정을 저장하지 못했어요': "Couldn't save your verdict",
  '저장하려면 로그인해 주세요': 'Log in to save', '저장됨': 'Saved', '저장': 'Save', '저장함에 넣었어요': 'Saved', '저장함에서 뺐어요': 'Removed from saved',
  '신고하려면 로그인해 주세요': 'Log in to report', '이미 신고했어요. 운영자가 확인할 거예요': 'Already reported. A moderator will review it.',
  '글 신고': 'Report post', '댓글 신고': 'Report comment',
  '신고 내용은 운영자만 볼 수 있어요. 그냥 별로라면 신고 대신 ▼슬롭으로 판정해 주세요.': "Only moderators see reports. If you just didn't like it, vote ▼ Slop instead.",
  '차단': 'Block', '작성자 차단': 'Block author', '차단하기': 'Block', '차단 풀기': 'Unblock', '차단했어요': 'Blocked', '차단을 풀었어요': 'Unblocked',
  '차단한 사용자': 'Blocked users', '[차단한 사용자의 댓글]': '[Comment from someone you blocked]', '차단하려면 로그인해 주세요': 'Log in to block people',
  '이 사람의 글과 댓글이 보이지 않고, 이 사람의 반응은 알림으로 오지 않아요. 상대에게는 알리지 않아요. 설정에서 언제든 풀 수 있어요. 규칙을 어긴 글이라면 신고도 함께 해 주세요.': "You won't see their posts or comments, and you won't get notifications from them. They aren't told. You can unblock anytime in settings. If they broke the rules, please report them too.",
  '차단한 사용자의 글이라 보이지 않아요.': "This post is from someone you blocked.", '차단한 사용자라 글을 보여 주지 않아요.': "You blocked this person, so their posts are hidden.",
  '차단한 사용자가 없어요. 글이나 댓글, 프로필의 "차단" 버튼으로 차단할 수 있어요.': "You haven't blocked anyone. Use the Block button on a post, comment or profile.",
  '자기 자신은 차단할 수 없어요': "You can't block yourself",
  '신고하기': 'Report', '신고함': 'Reported', '신고했어요. 운영자가 확인할 거예요': 'Reported. A moderator will review it.',
  '공유하기': 'Share', '공유 주소': 'Share link', '복사': 'Copy', '닫기': 'Close', '링크를 복사했어요': 'Link copied', '선택해 두었어요. ⌘C로 복사해 주세요': 'Selected. Press ⌘C / Ctrl+C to copy.',
  '카카오톡·슬랙·디스코드에는 주소를 복사해 붙여 넣으면 제목과 그림이 미리보기로 나와요. 새 글은 미리보기가 나오기까지 최대 3시간쯤 걸릴 수 있어요.': 'Paste the link into Slack, Discord or any chat and it shows a preview with title and image. New posts can take up to ~3 hours to get a preview.',
  '이번 주 보석 TOP 10': 'Top 10 gems this week', '이번 주 가장 많이 보석 판정을 받은 글 모음이에요. 링크를 붙이면 순위가 미리보기로 나와요.': 'The posts that got the most gem votes this week. The link previews the ranking.',
  '이 커뮤니티에 친구를 초대해 보세요. 링크를 붙이면 커뮤니티 소개가 미리보기로 나와요.': 'Invite friends to this community. The link previews its description.',
  '너무 커서 변경점을 계산하지 않았어요.': 'Too large to compute a diff.', '변경 없음': 'No changes', '방금': 'just now',
  // communities directory & form
  '관심 있는 주제를 팔로우하면 홈에 그 글들이 모여요. 원하는 주제가 없으면 직접 만들어요.': "Follow topics you care about and their posts gather on Home. Can't find one? Create it.",
  '커뮤니티 이름이나 주제로 검색': 'Search by name or topic', '정렬': 'Sort', '팔로워 많은 순': 'Most followed', '새로 생긴 순': 'Newest',
  '커뮤니티는 이렇게 돌아가요': 'How communities work', '누구나 커뮤니티를 만들 수 있어요(하루 2개까지).': 'Anyone can create a community (up to 2 a day).',
  '만든 사람이 운영자가 돼서 규칙을 정하고, 글을 고정하거나 숨길 수 있어요.': 'The creator becomes its moderator: sets rules, pins and hides posts.',
  '팔로우한 커뮤니티의 글이 홈에 모여요.': 'Posts from communities you follow appear on Home.', '에서는 모든 커뮤니티 글을 볼 수 있어요.': 'shows posts from every community.',
  '명 팔로우': 'followers', '기본 커뮤니티': 'Default community', '운영 중': 'You moderate', '에 맞는 커뮤니티가 없어요': ': no matching communities',
  '아직 커뮤니티가 없어요': 'No communities yet', '첫 번째로 만들어 보세요.': 'Be the first to create one.', '커뮤니티를 만들려면 로그인해 주세요': 'Log in to create a community',
  '커뮤니티를 찾을 수 없어요.': 'Community not found.', '이 커뮤니티의 운영자만 설정을 바꿀 수 있어요.': 'Only moderators of this community can change its settings.',
  '돌아가기': 'Back', '← 돌아가기': '← Back', '설정': 'settings', '이름': 'Name', '예: AI 보드게임 연구소': 'e.g. AI Board Game Lab', '주소': 'Address',
  '주소는 만든 뒤에는 바꿀 수 없어요.': "The address can't be changed later.", '영문 소문자, 숫자, 하이픈(-)으로 2~30자. 만든 뒤에는 바꿀 수 없어요.': "2–30 lowercase letters, digits or hyphens. Can't be changed later.",
  '한 줄 소개': 'One-line description', '어떤 AI 결과물을 모으는 곳인가요?': 'What kind of AI-made work belongs here?', '규칙 (선택)': 'Rules (optional)',
  '목록(- )과 **굵게**를 쓸 수 있어요. 커뮤니티 옆에 항상 보여요.': 'Lists (- ) and **bold** work. Shown next to the community.',
  '글쓰기 기본 형식': 'Default post format', '만들기': 'Create', '만들기 전에': 'Before you create', '비슷한 커뮤니티가 이미 있는지': 'Check whether a similar community', '찾아보세요': 'already exists',
  '만든 사람이 운영자가 되고, 나중에 다른 운영자를 추가할 수 있어요.': 'You become its moderator and can add more moderators later.', '하루에 두 개까지 만들 수 있어요.': 'You can create up to two a day.',
  '이름을 적어 주세요.': 'Please enter a name.', '주소는 영문 소문자, 숫자, 하이픈으로 2~30자여야 해요.': 'The address must be 2–30 lowercase letters, digits or hyphens.',
  '저장 중…': 'Saving…', '저장했어요': 'Saved', '커뮤니티를 만들었어요': 'Community created', '이미 쓰이는 주소예요. 다른 주소를 골라 주세요.': 'That address is taken. Please pick another.',
  '해제': 'Remove', '아이디로 운영자 추가': 'Add moderator by username', '운영자로 추가할 아이디': 'Username to add as moderator', '추가': 'Add',
  '운영자는 이 커뮤니티의 글을 고정·숨기기·잠그고, 신고를 처리하고, 설정을 바꿀 수 있어요.': 'Moderators can pin, hide and lock posts here, handle reports and change settings.',
  '그런 아이디가 없어요': 'No such username', '운영자에서 해제했어요': 'Moderator removed', '운영자가 최소 한 명은 있어야 해요': 'A community needs at least one moderator',
  // compose
  '← 게시판으로': '← Back to boards', '글을 쓰려면 먼저': 'To post, please', '해 주세요.': 'first.', '원본 글을 찾을 수 없어요.': 'Original post not found.',
  '작성자만 수정판을 올릴 수 있어요. 대신': 'Only the author can post a new version. Instead, try a', '리믹스': 'Remix', '해 보세요.': '.', '(리믹스)': '(remix)',
  '새 글': 'New post', '작성하던 초안을 불러왔어요.': 'Restored your draft.', '비우기': 'Clear', '커뮤니티를 고르세요': 'Choose a community', '다른 커뮤니티': 'Other communities',
  '맞는 곳이 없으면': "Can't find a fit?", '새로 만들 수 있어요': 'Create a new one', '만든 도구': 'Made with', '예: Claude, Midjourney, Suno': 'e.g. Claude, Midjourney, Suno',
  '형식': 'Format', '제목': 'Title', '무엇을 만들었고, 어디가 볼 만한가요?': 'What did you make, and what makes it worth a look?', '링크 주소': 'Link URL',
  '여기로 끌어 놓거나, 붙여 넣거나, 눌러서 고르세요 (최대 8장, 장당 10MB)': 'Drop, paste or click to choose (up to 8 images, 10MB each)',
  '언어 (예: python)': 'Language (e.g. python)', '미리 실행': 'Run preview', '본문': 'Body', '**굵게**, `코드`, - 목록, &gt; 인용, 링크는 자동 연결돼요': '**bold**, `code`, - lists, > quotes; links are linked automatically',
  '미리보기': 'Preview', '사용한 프롬프트 (선택, 강력 추천)': 'Prompt you used (optional, highly recommended)',
  '어떤 프롬프트로 만들었나요? 다른 사람이 재현하고 개선하는 데 도움이 돼요.': 'Which prompt did you use? It helps others reproduce and improve it.',
  '태그': 'Tags', '쉼표로 구분, 최대 5개': 'Comma-separated, up to 5', '무엇이 바뀌었나요?': 'What changed?', '예: 댓글 의견대로 색 대비를 높였어요': 'e.g. Raised the color contrast as suggested',
  '아래 개선 제안·질문 중 이번에 반영한 것을 고르면': 'Pick the suggestions and questions this version addresses; they get marked', '으로 표시되고, 쓴 사람에게 알림이 가요.': 'and their authors are notified.',
  '수정판 올리기': 'Post new version', '올리기': 'Post', '좋은 글의 조건': 'What makes a good post', '어떤 도구로, 어떤 프롬프트로 만들었는지 적어요.': 'Say which tool and which prompt you used.',
  '어디가 볼 만한지 한두 줄로 설명해요.': 'Explain in a line or two what makes it worth a look.', '맞는 게시판과 형식을 골라요. 웹·게임은 실행물로 올리면 바로 돌려볼 수 있어요.': 'Pick the right community and format. Post web pages and games as apps so they run here.',
  '실행물은 격리된 샌드박스에서 돌아가요. 외부 주소로 데이터를 보내는 코드는 신고 대상이에요.': 'Apps run in an isolated sandbox. Code that sends data to outside addresses will be removed.',
  'Claude 도우미': 'Claude helper', '내용을 보고 게시판, 형식, 제목, 태그를 추천해 줘요. 이미 쓴 칸은 건드리지 않아요.': "Suggests a community, format, title and tags from your content. It won't touch fields you filled in.",
  '분류·제목 추천받기': 'Suggest community & title', 'HTML 코드 (한 파일)': 'HTML code (single file)', '… AI가 만들어 준 HTML 파일 전체를 붙여 넣으세요': '… paste the whole HTML file the AI made',
  '코드를 붙여 넣으세요': 'Paste your code', '설명 (선택)': 'Description (optional)', '미리보기 닫기': 'Close preview', '내용이 없어요': 'Nothing yet', '이미지 빼기': 'Remove image',
  '이미지는 8장까지예요': 'Up to 8 images', '10MB보다 큰 이미지는 올릴 수 없어요': 'Images must be under 10MB', '올리는 중…': 'Uploading…', '이미지를 올리지 못했어요': "Couldn't upload the image",
  '먼저 내용을 조금 넣어 주세요.': 'Add some content first.', '보는 중…': 'Looking…', '추천을 넣었어요. 이미 쓴 칸은 건드리지 않았어요.': "Filled in suggestions; fields you'd already filled are unchanged.",
  '이 사이트에는 아직 Claude 연결이 설정되지 않았어요.': "Claude isn't connected on this site yet.", '요청이 많아요. 잠시 후 다시 시도해 주세요.': 'Too many requests. Please try again shortly.',
  '추천을 받지 못했어요.': "Couldn't get suggestions.", '올릴 커뮤니티를 골라 주세요.': 'Please choose a community.', '제목을 적어 주세요.': 'Please add a title.',
  '이미지를 한 장 이상 올려 주세요.': 'Please add at least one image.', '코드를 넣어 주세요.': 'Please add code.', '코드가 200KB를 넘어요.': 'Code is over 200KB.', '본문을 적어 주세요.': 'Please write something.',
  '올렸어요': 'Posted', '올리지 못했어요. 다시 시도해 주세요.': "Couldn't post. Please try again.",
  // feed
  '커뮤니티가 없어요': 'community does not exist', '주소를 확인하거나, 직접 만들어 보세요.': 'Check the address, or create it yourself.', '인기 글': 'Popular posts',
  '아직 팔로우한 커뮤니티가 없어서 전체 인기 글을 보여 드려요. 마음에 드는 커뮤니티를 팔로우해 보세요.': "You don't follow any communities yet, so here are popular posts. Follow a few you like.",
  '로그인하고 커뮤니티를 팔로우하면 여기에 내 피드가 모여요.': 'Log in and follow communities to build your feed here.', '내가 팔로우한 커뮤니티의 글이에요.': 'Posts from communities you follow.',
  '모든 커뮤니티의 글이에요. 새 커뮤니티를 발견하는 곳이에요.': 'Posts from every community. A good place to discover new ones.',
  '커뮤니티가 보석으로 판정한 글이에요. 보석 3표 이상, 보석 비율 75% 이상이면 여기에 모여요.': 'Posts the community judged as gems: at least 3 gem votes and 75% gem ratio.',
  '내가 저장한 글이에요. 나에게만 보여요.': 'Posts you saved. Only you can see this.', '최신': 'New', '최고': 'Top', '논쟁 중': 'Controversial', '판정 대기': 'Needs votes',
  'AI가 만든 것, 그냥 넘기지 마세요': "Don't just scroll past AI-made stuff", '사람들은 AI 결과물을 쉽게': 'People are quick to call AI output',
  '이라고 부르지만, 그 안에도 쓸모 있고 재미있는 게 숨어 있어요. 여기서 같이 캐내요.': ', but useful and fun things hide in there too. Dig them up with us.',
  '둘러보고 써 봐요.': 'Browse and try things.', '실행물은 그 자리에서 바로 돌아가요.': 'Apps run right on the page.', '▲보석 / ▼슬롭으로 판정해요.': 'Vote ▲ Gem / ▼ Slop.',
  '이유를 댓글로 남기면 더 좋아요.': 'Even better, say why in a comment.', '내가 만든 것도 올려요.': 'Post what you made.', '판정과 의견을 받아 다음 버전으로 키워요.': 'Use the verdicts and feedback to make the next version.',
  '지금 하나 판정해 보기': 'Judge one now', '가입하기': 'Sign up', '커뮤니티 둘러보기': 'Browse communities', '이번 주 보석 공유': "Share this week's gems",
  '기간': 'Period', '오늘': 'Today', '이번 주': 'This week', '이번 달': 'This month', '전체 기간': 'All time', '보기': 'View', '카드': 'Cards', '목록': 'List',
  '글을 불러오지 못했어요. 잠시 후 새로고침해 주세요.': "Couldn't load posts. Please refresh in a moment.", '조건에 맞는 글이 없어요.': 'No posts match.',
  '아직 보석으로 판정된 글이 없어요': 'No gems yet', '탭에서 아직 아무도 판정하지 않은 글을 골라 ▲/▼를 눌러 주세요.': 'tab and vote ▲/▼ on posts nobody has judged yet.',
  '판정하러 가기': 'Go judge', '저장한 글이 없어요. 글 아래의': 'Nothing saved yet. Tap', '을 누르면 여기에 모여요.': 'under a post to keep it here.',
  '의견이 갈리는 글이 아직 없어요.': 'No controversial posts yet.', '판정을 기다리는 글이 없어요. 모두 5표 이상 받았어요.': 'Nothing is waiting: every post has 5+ votes.',
  '팔로우한 커뮤니티에 아직 글이 없어요': 'No posts in your communities yet', '다른 커뮤니티도 둘러보세요.': 'Explore other communities too.', '인기 글 보기': 'See popular posts',
  '아직 글이 없어요': 'No posts yet', '첫 글을 올려 보세요. 사용한 도구와 프롬프트를 함께 적으면 다른 사람이 재현하고 판정하기 쉬워요.': 'Be the first to post. Include the tool and prompt so others can reproduce and judge it.',
  '첫 글 올리기': 'Write the first post', '더 보기': 'Load more', '불러오는 중…': 'Loading…', '고정': 'Pinned', '숨김': 'Hidden', '잠김': 'Locked', '예시': 'Example',
  '공유': 'Share', '미리보기 준비 중…': 'Preparing preview…', '눌러서 실행': 'Tap to run', '▶ 눌러서 실행': '▶ Tap to run', '실행': 'Run', '미리보기를 불러오지 못했어요': "Couldn't load preview",
  '팔로워': 'followers', '커뮤니티 설정': 'Community settings', '규칙': 'Rules',
  'AI가 만든 결과물을 그냥 넘기지 말고, 써 보고, 판정하고, 이유를 남기는 커뮤니티예요. 주제별 커뮤니티를 팔로우하고, 없으면 직접 만들어요.': "A community where you don't just scroll past AI-made work: try it, judge it, say why. Follow topic communities, or create your own.",
  '내 판정 점수': 'My karma', '판정하기: 한 장씩 넘기며 판정': 'Judge: one card at a time', '로그인하고 참여하기': 'Log in to join', '판정 기준': 'How to judge',
  '▲ 보석': '▲ Gem', ': 쓸모 있거나, 재미있거나, 영감을 줘요.': ': useful, fun or inspiring.', '▼ 슬롭': '▼ Slop', ': 시간이 아까웠어요.': ': a waste of time.',
  '댓글로 어디가 좋은지 짚어 주면 다른 사람이 찾는 데 큰 도움이 돼요.': 'comments pointing out what is good help others a lot.',
  'AI가 만들었다는 이유만으로 내리지 말아 주세요.': "Please don't downvote just because AI made it.", '스팸, 악성 코드, 괴롭힘, 개인정보 노출은': 'Spam, malicious code, harassment and doxxing:',
  '신고': 'Report', '많이 쓰인 태그': 'Popular tags', '인기 커뮤니티': 'Popular communities', '전체 보기': 'See all', '글을 불러오지 못했어요. 새로고침해 주세요.': "Couldn't load the post. Please refresh.",
  '게시글': 'posts', '의견 수': 'comments', '운영자 지정': 'Adding moderators',
  // judge
  '판정할 글을 다 봤어요 🎉': "You've judged everything 🎉", '보석함 보기': 'See gems', '내가 만든 것 올리기': 'Post your own',
  '하나씩 보고 바로 판정해요. 오늘': 'Judge one at a time. Today:', '개 · 남은 글': ' judged · left:', '개': '', '범위': 'Scope', '전체': 'All', '팔로우한 곳': 'Following',
  '…더 보기': '…more', '슬롭 (←)': 'Slop (←)', '건너뛰기 (↓)': 'Skip (↓)', '모르겠어요': 'Not sure', '보석 (→)': 'Gem (→)', '한 줄이면 충분해요 (선택)': 'One line is enough (optional)',
  '남기기': 'Send', '다음 글': 'Next', '실행할 코드가 없어요': 'No code to run', '이유를 남겼어요': 'Reason posted', '댓글을 남기지 못했어요': "Couldn't post the comment",
  // moderation
  '운영자 추가': 'Add moderator', '운영자 해제': 'Remove moderator', '숨김 해제': 'Unhide', '댓글 잠금': 'Lock comments', '잠금 해제': 'Unlock', '고정 해제': 'Unpin',
  '작성 제한': 'Restrict', '제한 해제': 'Lift restriction', '신고 기각': 'Dismiss report', '삭제': 'Delete', '게시판 이동': 'Move',
  '이 커뮤니티의 운영자만 할 수 있어요': 'Only moderators of this community can do that', '글 숨기기': 'Hide post', '댓글 숨기기': 'Hide comment',
  '숨긴 항목은 작성자와 운영자에게만 보여요. 언제든 되돌릴 수 있어요. 이 항목의 신고는 처리된 것으로 정리돼요.': 'Hidden items are visible only to the author and moderators. You can undo it anytime. Reports on it are marked resolved.',
  '숨기기': 'Hide', '숨겼어요': 'Hidden', '숨김을 풀었어요': 'Unhidden', '댓글을 잠갔어요': 'Comments locked', '댓글 잠금을 풀었어요': 'Comments unlocked',
  '게시판 상단에 고정했어요': 'Pinned to top', '고정을 풀었어요': 'Unpinned',
  '제한된 사람은 글, 댓글, 판정을 남길 수 없어요. 읽기는 계속할 수 있고, 이미 쓴 글은 그대로 남아요.': "Restricted users can't post, comment or vote. They can still read, and existing posts stay.",
  '제한하기': 'Restrict', '작성을 제한했어요': 'User restricted', '작성 제한을 풀었어요': 'Restriction lifted', '신고를 기각했어요': 'Report dismissed', '삭제했어요': 'Deleted',
  '운영 작업을 저장하지 못했어요': "Couldn't save the moderation action", '운영자만 볼 수 있는 화면이에요. 커뮤니티를 만들면 그 커뮤니티의 운영자가 돼요.': 'Only moderators can see this. Create a community to become its moderator.',
  '운영자로': 'Log in', '운영 정보를 불러오지 못했어요.': "Couldn't load moderation data.", '삭제된 글': 'Deleted post', '[삭제된 댓글]': '[deleted comment]', '댓글': 'Comment',
  '글로 가기': 'Go to post', '삭제된 댓글': 'Deleted comment', '정말 삭제할까요? 한 번 더 누르세요': 'Really delete? Click again', '작성자 제한': 'Restrict author',
  '사이트 전체의': "Site-wide", '내가 운영하는 커뮤니티의': 'For communities you moderate:', '신고와 숨긴 항목을 관리해요. 이 화면과 신고 내용, 운영 기록은 운영자에게만 보여요.': 'manage reports and hidden items. Only moderators can see this page, reports and the log.',
  '신고 대기': 'Open reports', '문제없음 (기각)': 'No problem (dismiss)', '처리할 신고가 없어요.': 'No open reports.', '숨긴 항목': 'Hidden items', '없음': 'none',
  '숨긴 항목이 없어요.': 'Nothing hidden.', '제한된 사람이 없어요.': 'Nobody is restricted.', '운영 기록': 'Moderation log', '사용자': 'User', '아직 기록이 없어요.': 'No entries yet.',
  '커뮤니티 운영자는 각 커뮤니티의': 'Community moderators are added in each community’s', '에서 아이디로 추가해요. 사이트 전체 운영자는 관리자가 따로 지정해요.': 'by username. Site-wide moderators are assigned by an admin.',
  // login & settings
  '데모로 시작하기': 'Start the demo', '이 사이트는 지금 데모 모드예요. 서버 없이 이 브라우저에만 저장되고, 데모 계정은 운영자 권한이 있어서 신고 처리와 숨기기도 써 볼 수 있어요.': 'This site is in demo mode. Everything stays in this browser, and the demo account is a moderator so you can try reports and hiding too.',
  '표시 이름': 'Display name', '예: 판정러': 'e.g. GemHunter', '데모 사용자': 'Demo user', '데모 계정으로 시작': 'Start with a demo account', '데모 계정으로 들어왔어요': 'Signed in to the demo account',
  '카카오': 'Kakao', '메일 링크로 로그인': 'Log in with an email link', '비밀번호 찾기': 'Reset password', '로 계속하기': '', '또는 이메일로': 'or with email', '가입': 'Sign up',
  '이메일': 'Email', '비밀번호': 'Password', '8자 이상': 'At least 8 characters', '가입하면 바로 시작할 수 있어요. 확인 메일을 기다리지 않아도 돼요.': 'Sign up and start right away.',
  '가입하고 시작하기': 'Sign up and start', '로그인 링크 받기': 'Email me a login link', '재설정 메일 받기': 'Email me a reset link', '비밀번호 없이 메일 링크로': 'Use an email link instead',
  '비밀번호로 로그인': 'Log in with password', '비밀번호를 잊었어요': 'Forgot password', '이메일 주소를 확인해 주세요.': 'Please check the email address.',
  '비밀번호는 8자 이상이어야 해요.': 'Password must be at least 8 characters.', '잠시만요…': 'One moment…', '가입했어요. 환영해요!': 'Signed up. Welcome!', '로그인했어요': 'Logged in',
  '이미 가입된 이메일이에요.': 'That email is already registered.', '을 눌러 주세요.': ' instead.', '이메일 또는 비밀번호가 맞지 않아요.': 'Wrong email or password.',
  '아직 메일 확인이 안 됐어요. 메일함의 확인 링크를 눌러 주세요.': 'Email not confirmed yet. Click the link in your inbox.', '더 안전한 비밀번호를 써 주세요(8자 이상, 흔하지 않은 것).': 'Please use a stronger password (8+ characters, not a common one).',
  '처리하지 못했어요. 잠시 후 다시 시도해 주세요.': "Something went wrong. Please try again shortly.", '이 로그인 방법은 아직 설정되지 않았어요': "This login method isn't set up yet",
  '아이디': 'Username', '영문 소문자, 숫자, 밑줄로 3~20자. 프로필 주소에 쓰여요.': '3–20 lowercase letters, digits or underscores. Used in your profile address.', '소개': 'Bio',
  '주로 어떤 AI 결과물을 만들거나 찾나요?': 'What kind of AI-made work do you make or look for?', '새 비밀번호 정하기': 'Set a new password', '비밀번호 바꾸기': 'Change password', '새 비밀번호': 'New password',
  '비밀번호 저장': 'Save password', '8자 이상이어야 해요.': 'Must be at least 8 characters.', '비밀번호를 바꿨어요': 'Password changed', '바꾸지 못했어요. 더 안전한 비밀번호를 써 보세요.': "Couldn't change it. Try a stronger password.",
  '아이디는 영문 소문자, 숫자, 밑줄로 3~20자여야 해요.': 'Usernames must be 3–20 lowercase letters, digits or underscores.', '이미 쓰이는 아이디예요.': 'That username is taken.',
  '이 사용자를 찾을 수 없어요.': 'User not found.', '작성 제한됨': 'restricted', '판정 점수': 'Karma', '올린 글': 'Posts', '아직 올린 글이 없어요.': 'No posts yet.', '첫 글을 올려 보세요.': 'Write your first post.',
  '님이 내 댓글에 답글을 달았어요': ' replied to your comment', '님이 내 글에 의견을 남겼어요': ' commented on your post', '님이 내 제안을 새 버전에 반영했어요': ' used your suggestion in a new version',
  '내 글이 보석이 됐어요!': 'Your post became a gem!', '누군가': 'Someone', '아직 알림이 없어요. 누군가 내 글에 의견을 남기거나, 내 댓글에 답하거나, 내 제안이 반영되면 여기에 떠요.': "No notifications yet. You'll see comments on your posts, replies, and suggestions that get used here.",
  // post page
  '글을 찾을 수 없어요. 삭제되었거나 운영자가 숨긴 글일 수 있어요.': 'Post not found. It may have been deleted or hidden by a moderator.', '다시 실행': 'Restart', '전체화면': 'Fullscreen', '코드 복사': 'Copy code',
  '사용한 프롬프트': 'Prompt used', '댓글 잠김': 'Comments locked', '↳ 리믹스 원본:': '↳ Remix of', '원본 글': 'original post', '. 작성자와 운영자에게만 보여요.': '. Only the author and moderators can see it.',
  '판정을 더 받아 보세요.': 'Get more verdicts.', '친구나 단톡방, 관련 커뮤니티에 공유하면 보석인지 슬롭인지 금방 모여요.': 'Share it with friends, group chats or related communities and the verdicts come in fast.',
  '최신 보기': 'See latest', '이 브라우저에서는 전체화면을 쓸 수 없어요': "Fullscreen isn't available in this browser", '코드를 복사했어요': 'Code copied', '복사하지 못했어요. 코드 탭에서 직접 선택해 주세요': "Couldn't copy. Select it in the Code tab.",
  '삭제하지 못했어요': "Couldn't delete", '게시판 상단 고정': 'Pin to top', '댓글 잠금 해제': 'Unlock comments', '커뮤니티 이동': 'Move community', '옮기지 못했어요': "Couldn't move",
  '댓글 종류': 'Comment type', '좋은 점을 짚을 땐': 'Pointing out something good? Pick', ', 고칠 점은': '; for fixes pick', '을 골라 주세요.': '.', '수정 저장': 'Save edit', '댓글 달기': 'Comment',
  '접힌 댓글': 'collapsed comment', '접기': 'Collapse', '이 스레드 접기': 'Collapse thread', '삭제됨': 'deleted', '작성자': 'OP', '· 수정됨': '· edited', '답글': 'Reply', '수정': 'Edit',
  '답글을 남겨 주세요': 'Write a reply', '댓글 정렬': 'Sort comments', '베스트': 'Best', '오래된 순': 'Oldest',
  '운영자가 이 글의 댓글을 잠갔어요. 기존 의견은 읽을 수 있어요.': 'A moderator locked comments on this post. You can still read them.',
  '이 결과물에서 가치 있는 점, 아쉬운 점, 고칠 점을 남겨 주세요': "What's valuable here, what's lacking, what should change?", '하면 의견을 남길 수 있어요.': 'to comment.',
  '아직 의견이 없어요. 첫 판정 이유를 남겨 주세요.': 'No comments yet. Be the first to say why.', '댓글을 저장하지 못했어요. 다시 시도해 주세요': "Couldn't save the comment. Please try again",
  '반영함으로 표시했어요': 'Marked as addressed', '커뮤니티 판정': 'Community verdict', '토론 요약': 'Discussion summary',
  '댓글과 판정을 Claude가 정리해 줘요. 어디가 보석이고 어디가 슬롭인지 한눈에 봐요.': 'Claude sums up the comments and votes: what is gem and what is slop, at a glance.',
  '댓글이 생기면 요약할 수 있어요': 'Available once there are comments', '다시 요약': 'Summarize again', '요약하기': 'Summarize', '수정 이력': 'Version history', '메모 없음': 'no note',
  '이 글의 리믹스': 'Remixes', '작성 정보': 'About this post', 'Slop이 게시판 사용법을 보여 주려고 Claude로 만들어 올린 예시예요. 판정과 의견은 실제로 남길 수 있어요.': 'An example Slop made with Claude to show how things work. Votes and comments are real.',
  '요약하려면 로그인해 주세요': 'Log in to summarize', '정리하는 중…': 'Summarizing…', '요약하지 못했어요.': "Couldn't summarize.",
  // guests, limits, empty states, share
  '판정(▲/▼)은 가입하지 않아도 할 수 있어요. 글과 댓글을 쓰려면 가입해 주세요.': 'You can judge (▲/▼) without an account. Sign up to post and comment.',
  '가입하면 확인 메일이 가요. 메일의 링크를 누르면 가입이 끝나요.': "We'll email you a confirmation link. Click it and you're in.",
  '판정했어요. 이유를 남기거나 글을 올리려면 가입해 주세요': 'Verdict saved. Sign up to leave reasons or post your own.',
  '짧은 시간에 너무 많이 올렸어요. 잠시 후 다시 해 주세요.': "That's a lot in a short time. Please try again a bit later.",
  '글을 쓰려면 먼저 로그인해 주세요.': 'Please log in to post.', '의견을 남기려면 로그인해 주세요.': 'Log in to comment.', '운영자로 로그인해 주세요.': 'Please log in as a moderator.',
  '이미 가입된 이메일이에요. "로그인"을 눌러 주세요.': 'That email is already registered. Use "Log in" instead.',
  'http:// 또는 https://로 시작하는 링크 주소를 넣어 주세요.': 'Enter a link that starts with http:// or https://.',
  '저장함은 로그인해야 쓸 수 있어요.': 'Log in to use Saved.', '저장한 글이 없어요. 글 아래의 "저장"을 누르면 여기에 모여요.': 'Nothing saved yet. Tap "Save" under a post to keep it here.',
  '판정하기에서 ▲/▼를 눌러 주세요. 보석 3표 이상, 비율 75% 이상이면 여기에 모여요.': 'Vote ▲/▼ in Judge. Posts with 3+ gem votes and a 75% gem ratio land here.',
  '이 언어로 된 글이 아직 없어요': 'No posts in this language yet', '다른 언어로 된 글이 있을 수 있어요.': 'There may be posts in other languages.', '모든 언어 보기': 'Show all languages',
  '더 불러오지 못했어요. 다시 눌러 주세요.': "Couldn't load more. Please try again.",
  '어디가 보석인가요? 이유를 남기면 "가치 발견" 댓글이 돼요.': 'What makes it a gem? Your reason becomes a "Found value" comment.',
  '무엇이 아쉬웠나요? 이유를 남기면 "개선 제안" 댓글이 돼요.': 'What fell short? Your reason becomes a "Suggestion" comment.',
  '스레드': 'Threads', '페이스북': 'Facebook', '레딧': 'Reddit', '실행할 코드가 없어요': 'No code to run',
  // legal, account deletion, visits
  '이용약관': 'Terms', '개인정보 처리방침': 'Privacy', '가입하면 이용약관과 개인정보 처리방침에 동의하는 것으로 봐요.': 'By signing up you agree to the Terms and the Privacy Policy.',
  '계정 삭제': 'Delete account', '계정을 지우면 프로필, 판정, 저장한 글, 알림, 팔로우가 바로 사라지고 되돌릴 수 없어요.': 'Deleting your account removes your profile, votes, saved posts, notifications and follows right away. This cannot be undone.',
  '내가 쓴 글과 댓글도 모두 지우기': 'Also delete all my posts and comments', '고르지 않으면 글과 댓글은 "탈퇴한 사용자"가 쓴 것으로 남아요.': 'If you leave this unchecked, your posts and comments stay, shown as written by "Deleted user".',
  '확인을 위해 아이디를 입력해 주세요': 'Type your username to confirm', '지우는 중…': 'Deleting…', '계정을 삭제했어요': 'Account deleted',
  '사이트의 마지막 관리자는 계정을 지울 수 없어요.': "The site's last admin can't delete their account.", '계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.': "Couldn't delete the account. Please try again shortly.",
  '데모에서는 계정을 지울 수 없어요': "You can't delete accounts in the demo",
  // installable app
  '앱 설치': 'Install app', '앱으로 받기': 'Get the app', '앱으로 설치하기': 'Install as an app', '뒤로': 'Back',
  '설치하면 홈 화면 아이콘으로 바로 열리고, 주소창 없이 전체 화면으로 써요.': 'Once installed it opens from your home screen, full screen, without the address bar.',
  'Safari 아래쪽의 공유 버튼(네모에서 위로 나가는 화살표)을 눌러요.': 'In Safari, tap the Share button (the square with an arrow pointing up).',
  '목록에서 "홈 화면에 추가"를 골라요.': 'Choose "Add to Home Screen".', '오른쪽 위 "추가"를 누르면 끝이에요.': 'Tap "Add" in the top right. Done.',
  'iPhone에서는 Safari에서만 돼요. 카카오톡 같은 앱 안에서 열었다면 Safari로 열어 주세요.': 'On iPhone this only works in Safari. If you opened this inside another app, open it in Safari first.',
  '브라우저 메뉴(⋮ 또는 ≡)를 열어요.': 'Open the browser menu (⋮ or ≡).', '"앱 설치" 또는 "홈 화면에 추가"를 골라요.': 'Choose "Install app" or "Add to Home screen".',
  'Chrome, Edge, 삼성 인터넷에서 돼요.': 'Works in Chrome, Edge and Samsung Internet.', '앱을 설치했어요. 홈 화면에서 열어 보세요': 'Installed. Open it from your home screen.',
  // swipe mode
  '넘겨보기': 'Swipe', '넘겨보며 구경하기': 'Swipe through', '나가기': 'Exit', '볼 글이 아직 없어요.': 'Nothing to show yet.', '플레이하기': 'Play', '탭해서 플레이': 'Tap to play',
  '✕ 그만하기': '✕ Done', '↑ 위로 넘기면 다음 글': '↑ Swipe up for the next one', '불러오는 중이에요. 잠시 후 다시 눌러 주세요': 'Still loading. Tap again in a moment',
  '어땠어요? 오른쪽 ▲보석 / ▼슬롭으로 판정해 주세요': 'How was it? Judge it with ▲ / ▼ on the right', '방문 통계': 'Visits', '최근 14일': 'Last 14 days', '이번 주 많이 본 페이지': 'Top pages this week', '방문 기록이 아직 없어요.': 'No visits recorded yet.',
  '첫 버전': 'first version', '예시 게시물': 'example post', '언어': 'Language', '글 언어': 'Post language', '콘텐츠 언어': 'Content language', '모든 언어': 'All languages',
};

/* dynamic text nodes: [regex, replacement] (replacement may be a function) */
const tr = (s) => D[s] ?? s;
const R = [
  [/^사람들은 AI 결과물을 쉽게 "슬롭"이라고 부르지만, 그 안에도 쓸모 있고 재미있는 게 숨어 있어요\. 여기서 같이 캐내요\.$/, 'People are quick to call AI output "slop", but useful and fun things hide in there too. Dig them up with us.'],
  [/^(.+) 차단$/, 'Block $1'],
  [/^의견 (\d+)개$/, (m, n) => `${n} comment${n === '1' ? '' : 's'}`],
  [/^좋은 점을 짚을 땐 "가치 발견", 고칠 점은 "개선 제안"을 골라 주세요\.$/, 'Pointing out something good? Pick "Found value". For fixes, pick "Suggestion".'],
  [/^\*\*굵게\*\*, `코드`, - 목록, > 인용, 링크는 자동 연결돼요$/, '**bold**, `code`, - lists, > quotes; links are linked automatically'],
  [/^사이트 전체의 신고와 숨긴 항목을 관리해요\. (.*)$/, 'Manage site-wide reports and hidden items. Only moderators can see this page, reports and the log.'],
  [/^내가 운영하는 커뮤니티의 신고와 숨긴 항목을 관리해요\. (.*)$/, 'Manage reports and hidden items in communities you moderate. Only moderators can see this page, reports and the log.'],
  [/^글 (\d+)$/, '$1 posts'],
  [/^팔로우한 커뮤니티의 글이 홈에 모여요\. "인기"에서는 모든 커뮤니티 글을 볼 수 있어요\.$/, 'Posts from communities you follow appear on Home. "Popular" shows posts from every community.'],
  [/^"가치 발견" 댓글로 어디가 좋은지 짚어 주면 다른 사람이 찾는 데 큰 도움이 돼요\.$/, '"Found value" comments that point out what is good help others a lot.'],
  [/^스팸, 악성 코드, 괴롭힘, 개인정보 노출은 "신고"해 주세요\.$/, 'Please "Report" spam, malicious code, harassment and doxxing.'],
  [/^(.+) · @(.+) · 관리자$/, '$1 · @$2 · admin'], [/^(.+) · @(.+) · 운영자$/, '$1 · @$2 · moderator'],
  [/^명 팔로우 · 글 (\d+)$/, 'followers · $1 posts'],
  [/^의견 (\d+)$/, (m, n) => `${n} comment${n === '1' ? '' : 's'}`],
  [/^보석 (\d+) · 슬롭 (\d+)$/, 'Gem $1 · Slop $2'],
  [/^수정 v(\d+)$/, 'edited v$1'], [/^v(\d+)에서 반영$/, 'addressed in v$1'], [/^반영함 표시 \(v(\d+)\)$/, 'Mark addressed (v$1)'],
  [/^v(\d+) 대비 변경점$/, 'Changes since v$1'], [/^v(\d+) 대비 본문 변경점$/, 'Text changes since v$1'],
  [/^(\d+)% 보석 판정 · (\d+)표$/, '$1% gem · $2 votes'],
  [/^오늘 (\d+)개를 판정했어요\. 새 글이 올라오면 다시 와 주세요\.$/, 'You judged $1 today. Come back when new posts arrive.'],
  [/^(.+)를 팔로우했어요$/, (m, c) => `Following ${tr(c)}`], [/^v(\d+)을 올렸어요$/, 'Posted v$1'], [/^@(.+)님을 운영자로 추가했어요$/, 'Added @$1 as moderator'],
  [/^검색: (.*) ✕$/, 'Search: $1 ✕'], [/^도구: (.*) ✕$/, 'Tool: $1 ✕'], [/^신고 (\d+)$/, '$1 report(s)'], [/^최근 (.+)$/, 'latest $1'], [/^사유: (.*)$/, 'Reason: $1'],
  [/^\[\+\] 점수가 낮아 접힌 댓글 \((-?\d+)점\) · 답글 (\d+)개$/, (m, s, n) => `[+] Collapsed for low score (${s}) · ${n} repl${n === '1' ? 'y' : 'ies'}`],
  [/^\[\+\] (.+) · 답글 (\d+)개$/, (m, a, n) => `[+] ${tr(a)} · ${n} repl${n === '1' ? 'y' : 'ies'}`],
  [/^지금 v(\d+)을 보고 있어요\. 최신은 v(\d+)이에요\.$/, "You're viewing v$1. The latest is v$2."],
  [/^수정판 올리기 · v(\d+)$/, 'New version · v$1'], [/^리믹스: (.+)$/, 'Remix: $1'], [/^(.+)에서 찾은 …$/, 'Found on $1 …'],
  [/^커뮤니티: (.+)$/, (m, c) => `Community: ${tr(c)}`], [/^(.+)로 이동$/, (m, c) => `Move to ${tr(c)}`], [/^(.+)\(으\)로 옮겼어요$/, (m, c) => `Moved to ${tr(c)}`],
  [/^← (.+)$/, (m, c) => `← ${tr(c)}`], [/^(.+) 생김$/, 'created $1'], [/^· (.+) 가입$/, '· joined $1'], [/^(.+) 가입$/, 'joined $1'], [/^· 수정 (.+)$/, '· edited $1'],
  [/^운영자가 숨긴 글이에요(.*)\. 작성자와 운영자에게만 보여요\.$/, (m, r) => `Hidden by a moderator${r.replace(/^ \(사유: (.*)\)$/, ' (reason: $1)')}. Only the author and moderators can see it.`],
  [/^운영자가 이 계정의 글쓰기·댓글·판정을 제한했어요(.*)\. 읽기는 계속할 수 있어요\.$/, (m, r) => `A moderator restricted this account from posting, commenting and voting${r.replace(/^ \(사유: (.*)\)$/, ' (reason: $1)')}. You can still read.`],
  [/^\(사유: (.*)\)$/, '(reason: $1)'], [/^ \(사유: (.*)\)$/, ' (reason: $1)'],
  [/^작성자 제한: (.+)$/, 'Restrict author: $1'], [/^(.+)에 글쓰기$/, (m, c) => `Post in ${tr(c)}`],
  [/^"(.+)" 커뮤니티가 없어요$/, 'The "$1" community does not exist'], [/^"(.+)"에 맞는 커뮤니티가 없어요$/, 'No communities match "$1"'],
  [/^(.+)로 계속하기$/, (m, p) => `Continue with ${tr(p)}`], [/^(.+)로 확인 메일을 보냈어요\. 메일의 링크를 누르면 가입이 끝나요\.$/, 'We sent a confirmation email to $1. Click the link to finish signing up.'],
  [/^(.+)로 로그인 링크를 보냈어요\. 메일함을 확인해 주세요\.$/, 'We sent a login link to $1. Check your inbox.'], [/^(.+)로 비밀번호 재설정 메일을 보냈어요\.$/, 'We sent a password reset email to $1.'],
  [/^오늘 (\d+)개 · 남은 글 (\d+)개$/, 'Today $1 · $2 left'], [/^(\d+)명 팔로우 · 글 (\d+)$/, '$1 followers · $2 posts'], [/^· 이 버전에 단 의견 (\d+)$/, '· $1 comments on this version'],
  [/^(.+) · 이 버전에 단 의견 (\d+)$/, '$1 · $2 comments on this version'],
  [/^(.+) 설정$/, (m, c) => `${tr(c)} settings`],
  [/^알림 (\d+)개$/, '$1 notifications'], [/^· 조회 (\d+)$/, (m, n) => `· ${n} view${n === '1' ? '' : 's'}`], [/^… (\d+)줄 동일 …$/, '… $1 unchanged lines …'], [/^(.+) \(나\)$/, '$1 (you)'],
  [/^(.+) · c\/([a-z0-9-]+)$/, (m, n, s) => `${tr(n)} · c/${s}`],
  [/^아래 개선 제안·질문 중 이번에 반영한 것을 고르면 "v(\d+)에서 반영"으로 표시되고, 쓴 사람에게 알림이 가요\.$/, 'Pick the suggestions and questions this version addresses: they get marked "addressed in v$1" and their authors are notified.'],
];

/* ago() strings */
export function agoText(s) {
  if (lang !== 'en') return null;
  if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 86400 * 30) return Math.floor(s / 86400) + 'd ago'; return null;
}

export function t(s) {
  if (lang === 'ko' || !s) return s;
  return toEnglish(s);
}
export function toEnglish(s) {
  if (!s) return s;
  const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], core = s.trim().replace(/\s+/g, ' ');
  if (!core) return s;
  if (D[core] !== undefined) return lead + D[core] + trail;
  for (const [re, rep] of R) if (re.test(core)) return lead + core.replace(re, rep) + trail;
  return s;
}

const ATTRS = ['placeholder', 'title', 'aria-label', 'label'];
const SKIP = '.md, .ctext, .ptitle, .excerpt, pre, code, textarea, .judge-title, .article h1, .linkcard, [data-ugc], .note .q, .mono-ugc, script, style';
const HANGUL = /[가-힣]/;
// only write when the value actually changes, or the observer would loop forever
function setAttr(el, a) { const v = el.getAttribute?.(a); if (!v || !HANGUL.test(v)) return; const nv = t(v); if (nv !== v) el.setAttribute(a, nv); }
function translateNode(n) {
  if (n.nodeType === 3) {
    if (!HANGUL.test(n.nodeValue)) return;
    const p = n.parentElement; if (!p || p.closest(SKIP)) return;
    const v = t(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v;
  } else if (n.nodeType === 1) {
    for (const a of ATTRS) setAttr(n, a);
    if (n.matches?.(SKIP)) return;
    if (n.tagName === 'INPUT' && (n.type === 'submit' || n.type === 'button') && HANGUL.test(n.value)) { const nv = t(n.value); if (nv !== n.value) n.value = nv; }
    const w = document.createTreeWalker(n, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: (x) => {
      if (x.nodeType === 1 && x.matches(SKIP)) { for (const a of ATTRS) setAttr(x, a); return NodeFilter.FILTER_REJECT; }
      return NodeFilter.FILTER_ACCEPT;
    } });
    let x; while ((x = w.nextNode())) {
      if (x.nodeType === 3) translateNode(x);
      else for (const a of ATTRS) setAttr(x, a);
    }
  }
}

export function startTranslator() {
  document.documentElement.lang = lang;
  if (lang === 'ko') return;
  translateNode(document.body);
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') translateNode(m.target);
      else if (m.type === 'attributes') translateNode(m.target);
      else m.addedNodes.forEach(translateNode);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
export const tt = t; // for toasts and dialogs built as strings
