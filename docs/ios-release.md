# Slop 아이폰 앱 (App Store) 출시 안내

만든 날: 2026-11-10 · 앱 고유 이름(Bundle ID): `io.github.jungtaejoon.slop` · 버전 1.0 (빌드 1)

앱은 Capacitor로 만들었어요. 사이트 화면을 앱 안에 넣은 구조라, 사이트를 고치면 `npm run ios`로 다시 묶어서 새 빌드를 올려야 앱에 반영돼요(안드로이드와 다른 점).

## 먼저 직접 하셔야 하는 일

1. **Xcode 설치:** Mac App Store에서 "Xcode"를 받아요(약 10GB, 무료). 설치 후 한 번 열어서 추가 구성요소 설치를 끝내요.
2. **Apple 개발자 프로그램 가입:** <https://developer.apple.com/programs/enroll/> → 개인(Individual) → 연 99달러(한국 129,000원). 승인까지 보통 하루~이틀 걸려요.
3. **Xcode에 Apple ID 로그인:** Xcode → Settings → Accounts → + → Apple ID.

여기까지 끝나면 알려 주세요. 다음은 제가 이어서 할 수 있어요.

## 그다음 순서 (제가 도와 드릴 수 있는 부분)

1. 시뮬레이터에서 앱을 띄워 확인하고 스크린샷을 찍어요.
2. Xcode에서 서명 팀을 지정하고 보관(Archive) → App Store Connect로 업로드해요. (업로드 확인 창은 직접 눌러 주셔야 할 수 있어요.)
3. App Store Connect(<https://appstoreconnect.apple.com>)에서 앱을 만들고 아래 정보를 채워요.
4. TestFlight로 휴대폰에서 먼저 시험해 보고, 심사를 제출해요. 심사는 보통 1~3일 걸려요.

## App Store Connect에 넣을 정보

- 이름: `Slop` (이미 쓰이고 있으면 `Slop - AI Gems`)
- 부제(30자 이내): `Judge AI-made apps and art` / 한국어: `AI 결과물, 보석일까 슬롭일까`
- 카테고리: 엔터테인먼트 (보조: 소셜 네트워킹)
- 연령 등급: 사용자 생성 콘텐츠가 있으므로 설문에서 해당 항목을 표시 → 보통 12+ 또는 17+
- 개인정보처리방침 URL: `https://jungtaejoon.github.io/slop/privacy/`
- 지원 URL: `https://jungtaejoon.github.io/slop/` · 연락처: jungtaejoon@gmail.com
- 설명 문구: `docs/android-release.md`의 "자세한 설명"과 같은 내용을 써요.
- 앱 개인정보(App Privacy): 이메일 주소, 사용자 ID, 사용자 콘텐츠(사진·글) → 앱 기능용, 사용자와 연결됨, 추적 없음
- 심사용 메모: "로그인 없이 둘러보기와 판정이 가능하고, 이메일로 바로 가입할 수 있어요(메일 확인 없음). 계정 삭제는 설정 → 계정 삭제에 있어요."

## 심사에서 걸릴 수 있는 점

- **사용자 차단 기능(가이드라인 1.2):** 사용자가 글을 올리는 앱은 신고·운영 기능에 더해 "다른 사용자 차단" 기능이 있어야 해요. 아직 없어서 심사 전에 추가해야 해요(데이터베이스 변경 필요).
- **웹사이트를 감싼 앱(가이드라인 4.2):** 사이트를 그대로 넣은 앱은 "앱다운 기능이 부족하다"며 거절될 때가 있어요. 거절되면 공유 시트, 알림 같은 기기 기능을 더 붙여서 다시 내요.
- 구글·깃허브 로그인 버튼은 앱에서는 숨겨 두었어요(넣으면 "Apple로 로그인"도 함께 넣어야 해서요).

## 다시 만들기

```bash
npm run ios          # 사이트를 빌드해서 ios/ 프로젝트에 복사
npm run ios:assets   # 로고를 바꿨을 때만: 아이콘·시작 화면 다시 그리기
open ios/App/App.xcodeproj
```

새 버전을 올릴 때는 Xcode에서 빌드 번호(Build)를 1씩 올려요.
