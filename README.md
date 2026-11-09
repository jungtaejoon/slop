# Slop Lab

AI가 만든 글·이미지·실행물·코드·링크를 게시판별로 올리고, **▲보석 / ▼슬롭**으로 판정하고, 스레드 토론으로 가치 있는 것을 가려내는 커뮤니티 사이트예요.

- 레딧처럼 누구나 만드는 커뮤니티, 팔로우, 홈(팔로우한 커뮤니티) / 인기(전체) 피드, 커뮤니티별 운영자와 규칙
- 기본 커뮤니티 10개, 5가지 형식(글, 링크, 이미지, 실행물(HTML), 코드), 만든 도구·프롬프트 기록
- 인기 / 최신 / 최고(기간) / 논쟁 중 / 판정 대기 정렬, 보석함, 저장함, 검색·도구·태그 필터
- 스레드 댓글(가치 발견·개선 제안·질문 등 종류), 댓글 판정, 낮은 점수 자동 접기, 실시간 갱신
- 수정판(버전 기록·변경점 비교), 반영한 제안 표시, 리믹스
- 프로필과 판정 점수, 알림(답글·의견·제안 반영·보석 달성)
- 신고, 운영 화면(숨기기·삭제·고정·댓글 잠금·게시판 이동·작성 제한·운영 기록)
- Claude 토론 요약과 글 분류 추천(선택)

## 두 가지 모드

| 모드 | 언제 | 데이터 |
|---|---|---|
| **데모** | `.env`에 Supabase 값이 없을 때 | 이 브라우저의 localStorage. 서버 없이 바로 돌아가요. 데모 계정은 관리자예요. |
| **실서비스** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 있을 때 | Supabase(Postgres + 로그인 + 이미지 저장). 누구나 가입해서 참여해요. |

두 모드 모두 `examples/`에 있는 예시 글 10개(게시판마다 1개)로 시작해요.

## 로컬에서 실행

```bash
npm install
npm run dev
```

http://localhost:5173 을 열면 데모 모드로 떠요.

## 실서비스 배포

### 1. Supabase 프로젝트

1. https://supabase.com 에서 새 프로젝트를 만들어요.
2. **SQL Editor**에서 `supabase/migrations/` 안의 파일을 이름 순서대로 하나씩 붙여 넣고 실행해요(`…_init.sql` → `…_communities.sql`).
3. 같은 곳에서 `supabase/seed.sql`을 실행하면 예시 글 10개가 들어가요(다시 실행해도 예시만 교체돼요).
4. **Authentication → URL Configuration**에서 Site URL을 배포할 주소로, Redirect URLs에도 같은 주소를 넣어요. 로컬 테스트용으로 `http://localhost:5173`도 추가해요.
5. 이메일 로그인은 기본으로 켜져 있어요. GitHub/Google 로그인을 쓰려면 **Authentication → Providers**에서 켜고 각 서비스의 OAuth 앱 키를 넣어요.
6. **Project Settings → API**에서 Project URL과 `anon` 키를 복사해 둬요.

Supabase CLI를 쓴다면 `supabase link` 후 `supabase db push`, `psql`로 `seed.sql`을 실행해도 돼요.

### 2. 첫 관리자 지정

사이트에 한 번 로그인한 뒤, SQL Editor에서:

```sql
update profiles set role = 'admin' where username = '내아이디';
```

관리자는 다른 사람을 운영자로 지정할 수 있어요(`role = 'mod'`).

### 3. Claude 기능 (선택)

토론 요약과 분류 추천은 Supabase Edge Function `ai`가 Claude API를 불러요. 키는 서버에만 있고 브라우저로 나가지 않아요.

```bash
supabase functions deploy ai
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

설정하지 않으면 버튼을 눌렀을 때 "아직 Claude 연결이 설정되지 않았어요"라고 나와요. 기본 모델은 `claude-opus-5-5`(effort `low`)이고 `supabase/functions/ai/index.ts`의 `MODEL`에서 바꿀 수 있어요. 로그인한 사용자만, 10분에 20번까지 부를 수 있어요.

### 4. 프론트엔드 배포

빌드 결과(`dist/`)는 정적 파일이라 어디든 올릴 수 있어요. 해시 라우팅(`#/p/...`)이라 서버 리라이트 설정이 필요 없어요.

- **Vercel / Netlify / Cloudflare Pages**: 저장소를 연결하고 Build command `npm run build`, Output `dist`, 환경 변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 넣어요.
- **GitHub Pages**: `.github/workflows/pages.yml`이 들어 있어요. 저장소 Settings → Pages에서 Source를 "GitHub Actions"로 바꾸고, Settings → Secrets and variables → Actions의 **Variables**에 두 값을 넣으면 `main`에 푸시할 때마다 배포돼요. 값을 비워 두면 데모 모드로 배포돼요.

`anon` 키는 공개용이에요. 모든 권한은 데이터베이스의 행 수준 보안(RLS)이 막아요.

## 보안 설계

- 모든 테이블에 RLS가 켜져 있어요. 글 작성·수정판은 `create_post` / `save_post_version` 함수로만 할 수 있고, 함수가 작성자·작성 제한을 직접 확인해요.
- 판정 수, 댓글 수, 숨김·고정·잠금, 역할·작성 제한은 일반 사용자가 바꿀 수 없어요(트리거가 되돌려요). 누가 어떻게 판정했는지는 본인만 봐요.
- 신고와 운영 기록은 운영자만 읽어요. 숨긴 글·댓글은 작성자와 운영자에게만 보여요.
- 실행물(HTML)은 `sandbox="allow-scripts"` iframe에서 돌아가서 사이트의 로그인 정보나 저장소에 접근할 수 없어요.
- 이미지는 본인 폴더(`post-images/<user id>/`)에만 올릴 수 있고, 10MB·PNG/JPEG/GIF/WEBP로 제한돼요.

`npm run check:sql`은 메모리 안 Postgres(PGlite)에서 마이그레이션과 시드를 돌리고, 여러 사용자 역할로 이 규칙들을 확인해요.

## 예시 글 고치기

`examples/posts.mjs`(글 목록)와 `examples/*.html`, `*.py`(실행물·코드)를 고친 뒤:

```bash
npm run examples   # src/examples.generated.json, supabase/seed.sql, public/examples/*.svg 다시 만들기
```

## 구조

```
index.html, src/main.js     라우터, 헤더, 공통 동작
src/core.js                 상태, 분류, 판정·저장·신고·공유
src/views/                  feed, post(본문·댓글), compose, pages(로그인·설정·프로필·알림), mod
src/api/supabase.js|demo.js 같은 인터페이스의 두 백엔드
supabase/migrations/        스키마, RLS, 함수, 트리거
supabase/functions/ai/      Claude 요약·분류 Edge Function
scripts/                    예시 빌드, SQL 검사
legacy/                     이전 claude.ai 아티팩트 버전 (참고용)
```
