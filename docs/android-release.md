# Slop 안드로이드 앱 (구글 플레이) 출시 안내

만든 날: 2026-11-09 · 앱 고유 이름: `io.github.jungtaejoon.slop` · 버전 1.0.0 (versionCode 1)

## 준비된 파일 (`android-release/` 폴더, GitHub에는 올리지 않음)

| 파일 | 용도 |
|---|---|
| `slop-1.0.0.aab` | 구글 플레이에 올리는 파일 |
| `slop-1.0.0.apk` | 안드로이드 휴대폰에 직접 설치해 보는 시험용 파일 |
| `icon-512.png` | 스토어 아이콘 (512×512) |
| `feature-graphic-1024x500.png` | 스토어 대표 이미지 (1024×500) |
| `screenshot-1-swipe.jpg`, `screenshot-2-game.jpg`, `screenshot-3-home.jpg` | 휴대폰 스크린샷 (750×1500) |

## 서명 키: 꼭 백업하세요

- 위치: `~/.slop-android/upload-key.jks` (키 파일), `~/.slop-android/keystore-password.txt` (비밀번호)
- 앱을 업데이트할 때마다 이 키로 서명해야 해요. USB나 개인 클라우드 등 안전한 곳에 두 파일을 함께 백업해 두세요.
- GitHub나 채팅에 올리지 마세요. 잃어버려도 구글 플레이에 "업로드 키 재설정"을 요청할 수 있지만 며칠 걸려요.

## 휴대폰에서 먼저 시험해 보기 (선택)

1. `slop-1.0.0.apk`를 안드로이드 휴대폰으로 옮겨요(카카오톡 나에게 보내기, 구글 드라이브 등).
2. 파일을 눌러 설치해요. "출처를 알 수 없는 앱" 허용을 물으면 허용해요.
3. 주소창 없이 전체 화면으로 열리면 정상이에요(사이트 확인 파일이 이미 올라가 있어요).

## 구글 플레이 출시 순서 (직접 하셔야 하는 일)

1. **개발자 계정 만들기:** <https://play.google.com/console> → 개인 계정 → 등록비 25달러(한 번만) → 신분증·전화번호 확인. 확인에 며칠 걸릴 수 있어요.
2. **앱 만들기:** 앱 이름 `Slop`, 기본 언어 English(또는 한국어), 앱, 무료.
3. **앱 설정 체크리스트(대시보드):**
   - 개인정보처리방침 URL: `https://slop.ai.kr/privacy/`
   - 앱 액세스: "모든 기능을 별도 액세스 없이 사용할 수 있음"이 아니라 "일부 기능은 로그인 필요" → 심사자도 이메일로 바로 가입할 수 있다고 적어요(메일 확인이 꺼져 있어요).
   - 광고: 광고 없음
   - 콘텐츠 등급 설문: 사용자가 글·이미지를 올리고 서로 소통함(사용자 생성 콘텐츠, 신고·운영 기능 있음)
   - 타겟층: 만 13세 미만 제외. 16~17세, 18세 이상 선택을 권해요(약관상 만 14세 이상).
   - 데이터 보안: 아래 "데이터 보안 답변" 참고
   - 계정 삭제 안내 URL: `https://slop.ai.kr/privacy/` (앱의 설정 → 계정 삭제에서도 바로 지울 수 있어요)
   - 앱 카테고리: 엔터테인먼트, 연락처 이메일: jungtaejoon@gmail.com
4. **스토어 등록정보:** 아래 문구와 `android-release/`의 이미지들을 넣어요.
5. **비공개 테스트 (새 개인 계정 필수):** "테스트 → 비공개 테스트"에 `slop-1.0.0.aab`를 올리고, **테스터 12명 이상이 14일 동안 계속 참여**해야 정식 출시(프로덕션)를 신청할 수 있어요. 테스터의 구글 계정 이메일이 필요해요.
6. **앱 서명 키 지문 알려 주기:** 처음 업로드한 뒤 "설정 → 앱 무결성 → 앱 서명 키 인증서"의 **SHA-256 지문**을 복사해서 알려 주세요. 사이트 확인 파일(`public/.well-known/assetlinks.json` (https://slop.ai.kr/.well-known/assetlinks.json))에 추가해야 플레이에서 받은 앱이 주소창 없이 열려요.
7. **정식 출시 신청:** 14일 테스트가 끝나면 프로덕션 출시를 신청해요. 심사는 보통 며칠 걸려요.

## 스토어 등록정보 문구

**짧은 설명 (80자 이내)**
- English: `Swipe, play and judge AI-made apps, art and writing. Find the gems.`
- 한국어: `AI가 만든 앱·그림·글을 넘겨 보고, 써 보고, 보석인지 슬롭인지 판정해요.`

**자세한 설명 (English)**

People are quick to call AI output "slop", and a lot of it is. But useful and fun things hide in there too. Slop is a community for finding them.

- Swipe through AI-made things one screen at a time: games, tools, art, writing, prompts and code.
- Apps run right inside the post. Tap to play, tap Done to keep swiping.
- Vote ▲ gem or ▼ slop. No account needed to judge.
- Say why in a comment, and help makers turn feedback into the next version.
- Post what you made with AI, follow communities you like, or start your own.

Free, no ads. English and Korean.

**자세한 설명 (한국어)**

사람들은 AI 결과물을 쉽게 "슬롭"이라고 부르지만, 그 안에도 쓸모 있고 재미있는 게 숨어 있어요. Slop은 그걸 같이 캐내는 커뮤니티예요.

- AI가 만든 게임, 도구, 그림, 글, 프롬프트, 코드를 한 화면씩 넘겨 봐요.
- 실행물은 글 안에서 바로 돌아가요. 탭해서 플레이하고, 그만하기를 누르면 계속 넘겨요.
- ▲보석 / ▼슬롭으로 판정해요. 가입 없이도 판정할 수 있어요.
- 이유를 댓글로 남기면 만든 사람이 다음 버전을 만드는 데 도움이 돼요.
- AI로 만든 걸 올리고, 마음에 드는 커뮤니티를 팔로우하거나 직접 만들어요.

무료이고 광고가 없어요. 영어와 한국어를 지원해요.

## 데이터 보안 답변 (Data safety)

- 데이터 수집: 예 / 공유(제3자 제공): 아니요
- 전송 중 암호화: 예 / 삭제 요청: 예 (앱 안 계정 삭제, 위 URL)
- 수집 항목과 목적:
  - 개인 정보 → 이메일 주소: 계정 관리 (필수, 가입한 경우만)
  - 개인 정보 → 사용자 ID: 앱 기능, 계정 관리
  - 사진 및 동영상 → 사진: 앱 기능 (사용자가 올린 경우만)
  - 앱 활동 → 앱 상호작용(판정, 저장, 팔로우), 기타 사용자 생성 콘텐츠(글, 댓글): 앱 기능
- 광고, 분석용 추적: 없음 (방문 수는 페이지별 합계만 세고 개인 정보는 저장하지 않아요)

## 앱을 다시 만들어야 할 때

사이트를 고치면 앱에도 바로 반영돼서 보통은 다시 만들 필요가 없어요. 앱 이름·아이콘을 바꾸거나 구글이 요구하는 안드로이드 버전이 올라갔을 때만 다시 만들어요:

1. `android/generate.mjs`에서 `appVersionCode`를 1 올리고 `appVersionName`을 바꿔요.
2. `node android/generate.mjs` → `android/` 폴더에서 Bubblewrap 빌드(비밀번호는 `~/.slop-android/keystore-password.txt`).
