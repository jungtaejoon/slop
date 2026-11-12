# 소셜 로그인 켜기 (Google, 카카오는 보류)

> **지금 방침 (2026-11-12):** 로그인 정보는 이메일로 하나로 모아요. Google은 이메일을 주므로 켜고, 카카오는 개인 앱이 이메일을 받을 수 없어서 보류해요.
> 카카오 앱(ID 1647229)은 리다이렉트 주소·동의항목까지 만들어 두었고, Supabase에서 켜지만 않은 상태예요. 비즈 앱으로 전환해 이메일 동의항목을 쓸 수 있게 되면 아래 1번의 7단계만 하면 돼요.

사이트 코드는 준비돼 있어요. Supabase에서 로그인 방식을 켜면 로그인 화면에 버튼이 저절로 나타나요. 다시 배포할 필요는 없어요.

모든 단계에서 쓰는 **콜백 주소**는 하나예요.

```
https://sbeickdtzkxxovlnnumo.supabase.co/auth/v1/callback
```

## 0. Supabase 주소 설정 확인 (한 번만)

Supabase 대시보드 → Authentication → **URL Configuration**

- Site URL: `https://slop.ai.kr/`
- Redirect URLs에 `https://slop.ai.kr/**`가 있는지 확인하고, 없으면 추가해요.

## 1. 카카오

1. https://developers.kakao.com → 로그인 → **내 애플리케이션 → 애플리케이션 추가하기**
   - 앱 이름: Slop, 회사명: 개인 이름, 카테고리는 아무거나 골라요.
2. **앱 설정 → 플랫폼 키**(또는 "앱 키")에서 **REST API 키**를 복사해요. 이것이 Client ID예요.
3. 같은 REST API 키의 편집 화면으로 들어가요.
   - **카카오 로그인 리다이렉트 URI**에 위의 콜백 주소를 넣어요.
   - **클라이언트 시크릿** 코드를 만들어 복사하고, 사용 상태를 **활성화**해요. 이것이 Client Secret이에요.
4. **앱 설정 → 플랫폼 → Web**에서 사이트 도메인 `https://slop.ai.kr`을 등록해요.
5. **제품 설정 → 카카오 로그인**에서 사용 설정을 **ON**으로 바꿔요.
6. **카카오 로그인 → 동의항목**에서 다음 두 항목을 켜요.
   - 닉네임 (profile_nickname): 필수 동의
   - 프로필 사진 (profile_image): 선택 동의
   - 카카오계정(이메일)은 비즈 앱으로 전환해야 고를 수 있어요. 처음에는 빼도 돼요.
7. Supabase 대시보드 → Authentication → **Sign In / Providers → Kakao**
   - Enable을 켜요.
   - REST API 키와 클라이언트 시크릿을 넣어요.
   - 이메일 동의항목을 뺐다면 **Allow users without an email**도 켜요.
   - Save를 눌러요.

이메일 없이 들어온 카카오 사용자는 `user_ab12` 같은 아이디를 받아요. 설정에서 바꿀 수 있어요.

## 2. Google

1. https://console.cloud.google.com → 새 프로젝트(예: Slop)를 만들어요.
2. **API 및 서비스 → OAuth 동의 화면**(Google Auth Platform)에서 시작하기를 눌러요.
   - 앱 이름: Slop, 지원 이메일: 내 이메일
   - 대상: **외부**
   - 앱 도메인과 승인된 도메인에 `slop.ai.kr`, 개인정보처리방침 `https://slop.ai.kr/#/privacy`, 서비스 약관 `https://slop.ai.kr/#/terms`를 넣어요.
   - 승인된 도메인에 `supabase.co`도 넣어요.
3. **클라이언트 → 클라이언트 만들기** → 유형 **웹 애플리케이션**
   - 승인된 JavaScript 원본: `https://slop.ai.kr`
   - 승인된 리디렉션 URI: 위의 콜백 주소
   - 만든 뒤 클라이언트 ID와 클라이언트 보안 비밀번호를 복사해요.
4. **대상(게시 상태)**을 **프로덕션으로 게시**로 바꿔요. 테스트 상태로 두면 등록한 테스트 사용자만 로그인할 수 있어요. 이름·이메일·프로필 사진만 쓰므로 별도 심사는 필요 없어요.
5. Supabase 대시보드 → Authentication → **Sign In / Providers → Google**
   - Enable을 켜요.
   - Client ID와 Client Secret을 넣고 Save를 눌러요.

## 확인

https://slop.ai.kr/#/login 을 새로고침하면 켠 방식의 버튼이 보여요. 직접 한 번 로그인해 보세요.

- 이미 이메일로 가입한 사람이 같은 이메일의 Google 계정으로 로그인하면 같은 계정으로 이어져요. 그래서 이메일 하나로 계정이 정리돼요.
- 앱 안(안드로이드 TWA)에서도 버튼이 보여요. iOS 앱 껍데기(Capacitor) 안에서는 숨겨져요.
