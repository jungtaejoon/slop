// Terms of Service and Privacy Policy, in English and Korean. Plain data (no DOM),
// so the app and the static page builder (scripts/build-share-pages.mjs) share it.
// Keep both languages in step, and update EFFECTIVE when the meaning changes.

export const EFFECTIVE = { en: 'November 9, 2026', ko: '2026년 11월 9일' };
const CONTACT = { name: '정태준', email: 'jungtaejoon@gmail.com' };

export const LEGAL = {
  terms: {
    en: {
      title: 'Terms of Service',
      body: `
<p>Slop Lab is a free community site where people share things made with AI and judge them ▲ gem or ▼ slop. It is run by an individual, ${CONTACT.name} (“we”). By using Slop Lab you agree to these terms.</p>
<h2>1. Accounts</h2>
<ul>
<li>You must be at least 14 years old to create an account.</li>
<li>Keep your login details safe. You are responsible for what happens under your account.</li>
<li>One person per account. Don't impersonate anyone.</li>
<li>You can vote without an account; your browser then holds a guest ID that can only vote.</li>
</ul>
<h2>2. Your content</h2>
<ul>
<li>You keep ownership of what you post: posts, apps, code, images, text, prompts and comments.</li>
<li>You give Slop Lab a worldwide, free, non-exclusive license to host, display, run (for apps), copy and share your content on the site and in its link previews, feeds and pages, for as long as it is on Slop Lab. This also lets other members remix your post on Slop Lab, with a link back to yours.</li>
<li>Only post things you have the right to share, and follow the terms of the AI tool you used. Say which tool made it.</li>
</ul>
<h2>3. Community rules</h2>
<ul>
<li>Nothing illegal, and no sexual content involving minors.</li>
<li>No malicious code: no apps that steal data, mine crypto, phish, track people, or send data to outside addresses.</li>
<li>No harassment, hate, or threats. No sharing other people's personal information.</li>
<li>No spam, and no vote manipulation (multiple accounts, scripts, buying or trading votes).</li>
<li>No copyright infringement.</li>
<li>Judge the work, not the fact that AI made it.</li>
</ul>
<h2>4. Moderation</h2>
<p>Moderators can hide, lock, move or delete content and restrict accounts that break these rules. Use the Report button to flag problems. We may also remove content when the law requires it.</p>
<h2>5. Apps and code made by others</h2>
<p>Apps posted on Slop Lab run in an isolated sandbox in your browser, but they are written by other people. Try them, and use posted code, at your own risk. Everything is provided as is.</p>
<h2>6. No warranty, limited liability</h2>
<p>Slop Lab is provided as is, without warranties of any kind. To the extent the law allows, we are not liable for indirect or consequential damages, for content posted by others, or for interruptions or data loss.</p>
<h2>7. Ending</h2>
<p>You can delete your account at any time in Settings. We may suspend or remove accounts that break these terms.</p>
<h2>8. Changes</h2>
<p>We may update these terms. We'll post the new version here with a new effective date. If you keep using Slop Lab after a change, you accept the updated terms.</p>
<h2>9. Law</h2>
<p>These terms are governed by the laws of the Republic of Korea. Disputes go to the competent courts of the Republic of Korea.</p>
<h2>10. Contact</h2>
<p>${CONTACT.name} · <a href="mailto:${CONTACT.email}">${CONTACT.email}</a></p>`,
    },
    ko: {
      title: '이용약관',
      body: `
<p>Slop Lab은 AI로 만든 결과물을 올리고 ▲보석 / ▼슬롭으로 판정하는 무료 커뮤니티예요. 개인 ${CONTACT.name}(이하 “운영자”)이 운영해요. Slop Lab을 이용하면 이 약관에 동의하는 것으로 봐요.</p>
<h2>1. 계정</h2>
<ul>
<li>만 14세 이상만 계정을 만들 수 있어요.</li>
<li>로그인 정보는 직접 안전하게 관리해 주세요. 계정에서 일어나는 일은 계정 주인에게 책임이 있어요.</li>
<li>한 사람이 한 계정을 써요. 다른 사람을 사칭하지 마세요.</li>
<li>계정 없이도 판정할 수 있어요. 이때 브라우저에 판정만 할 수 있는 손님 ID가 저장돼요.</li>
</ul>
<h2>2. 내가 올린 콘텐츠</h2>
<ul>
<li>올린 글, 실행물, 코드, 이미지, 프롬프트, 댓글의 권리는 올린 사람에게 있어요.</li>
<li>올린 콘텐츠가 Slop Lab에 있는 동안, Slop Lab이 사이트와 링크 미리보기·피드·페이지에서 그것을 보관하고, 보여 주고, (실행물은) 실행하고, 복제·공유할 수 있는 무료·비독점·전 세계 이용 권한을 줘요. 다른 회원이 Slop Lab 안에서 원본 링크와 함께 리믹스하는 것도 여기에 포함돼요.</li>
<li>공유할 권리가 있는 것만 올리고, 사용한 AI 도구의 약관을 지켜 주세요. 어떤 도구로 만들었는지도 밝혀 주세요.</li>
</ul>
<h2>3. 커뮤니티 규칙</h2>
<ul>
<li>불법 콘텐츠, 미성년자가 등장하는 성적 콘텐츠는 금지예요.</li>
<li>악성 코드 금지: 데이터를 빼돌리거나, 채굴하거나, 피싱하거나, 사람을 추적하거나, 외부 주소로 데이터를 보내는 실행물은 올릴 수 없어요.</li>
<li>괴롭힘, 혐오, 협박, 다른 사람의 개인정보 공개는 금지예요.</li>
<li>스팸, 판정 조작(여러 계정, 자동화, 투표 매매)은 금지예요.</li>
<li>저작권을 침해하지 마세요.</li>
<li>AI가 만들었다는 이유가 아니라 결과물 자체로 판정해 주세요.</li>
</ul>
<h2>4. 운영</h2>
<p>운영자와 커뮤니티 운영자는 규칙을 어긴 콘텐츠를 숨기거나, 잠그거나, 옮기거나, 지울 수 있고, 계정의 활동을 제한할 수 있어요. 문제가 보이면 “신고” 버튼을 눌러 주세요. 법에 따라 필요한 경우에도 콘텐츠를 지울 수 있어요.</p>
<h2>5. 다른 사람이 만든 실행물과 코드</h2>
<p>실행물은 브라우저의 격리된 공간(샌드박스)에서 돌아가지만, 다른 사람이 만든 것이에요. 실행물과 코드는 각자 판단해서 써 주세요. 모든 것은 있는 그대로 제공돼요.</p>
<h2>6. 보증 없음과 책임 제한</h2>
<p>Slop Lab은 어떤 보증도 없이 있는 그대로 제공돼요. 법이 허용하는 범위에서, 운영자는 간접 손해, 다른 사람이 올린 콘텐츠, 서비스 중단이나 데이터 손실에 대해 책임지지 않아요.</p>
<h2>7. 이용 종료</h2>
<p>설정 화면에서 언제든 계정을 삭제할 수 있어요. 약관을 어긴 계정은 정지되거나 삭제될 수 있어요.</p>
<h2>8. 약관 변경</h2>
<p>약관을 바꿀 수 있어요. 바뀐 약관은 시행일과 함께 이 페이지에 올려요. 변경 후에도 계속 이용하면 바뀐 약관에 동의하는 것으로 봐요.</p>
<h2>9. 준거법</h2>
<p>이 약관은 대한민국 법을 따르고, 분쟁은 대한민국의 관할 법원에서 다뤄요.</p>
<h2>10. 연락처</h2>
<p>${CONTACT.name} · <a href="mailto:${CONTACT.email}">${CONTACT.email}</a></p>`,
    },
  },

  privacy: {
    en: {
      title: 'Privacy Policy',
      body: `
<p>This policy explains what Slop Lab collects, why, and what you can do about it. Slop Lab is run by an individual, ${CONTACT.name}.</p>
<h2>1. What we collect</h2>
<ul>
<li><b>Account:</b> your email address and password. The password is stored only as a hash by our login provider (Supabase). Optional profile details: username, display name, bio.</li>
<li><b>What you do on the site:</b> posts (titles, text, code, links, images, prompts), comments, votes, saved posts, reports, and the communities you follow.</li>
<li><b>Guest votes:</b> if you vote without an account, we create an anonymous guest ID that is kept in your browser. Your votes are linked only to that ID.</li>
<li><b>Visit counts:</b> we count views per page per day. We do not store your IP address, a cookie, or any identifier for this.</li>
<li><b>Technical data:</b> our hosting and database providers process IP addresses and request logs to deliver the site and protect it from abuse. Fonts load from jsDelivr and Google Fonts, which receive your IP address when your browser requests them.</li>
</ul>
<h2>2. Why we use it</h2>
<p>To run your account and sign you in; to show your posts, comments and profile; to count votes and views; to send notifications inside the site; and to prevent spam and abuse (rate limits, moderation). We don't sell your data, show ads, or use advertising or tracking cookies.</p>
<h2>3. What is public</h2>
<p>Your username, display name, bio, posts and comments are public. Vote totals are public, but who voted how is not. Your email address, saved posts and reports are private; moderators can see reports.</p>
<h2>4. Who processes it, and where</h2>
<ul>
<li><b>Supabase</b> (database, login, image storage): servers in Tokyo, Japan.</li>
<li><b>GitHub Pages</b> (hosting the site): United States.</li>
<li><b>jsDelivr</b> and <b>Google Fonts</b> (fonts): global content delivery networks.</li>
</ul>
<p>They process data only to provide their service.</p>
<h2>5. How long we keep it</h2>
<ul>
<li>Account data: until you delete your account.</li>
<li>Posts and comments: until you or a moderator delete them.</li>
<li>When you delete your account, your profile, votes, saved posts, notifications, reports and follows are deleted right away. Your posts and comments are deleted too if you choose so; otherwise they stay, shown as written by “Deleted user”.</li>
<li>Daily visit counts contain no personal data.</li>
</ul>
<h2>6. Your rights and choices</h2>
<ul>
<li>See and edit your profile in Settings, and delete your posts and comments at any time.</li>
<li>Delete your account in Settings. It takes effect immediately and can't be undone.</li>
<li>For anything else, such as a copy of your data, a correction, or a question, email us.</li>
</ul>
<h2>7. Browser storage</h2>
<p>We use your browser's local storage for your login session, language and display preferences, and drafts. We don't use advertising or tracking cookies.</p>
<h2>8. Children</h2>
<p>Slop Lab is not meant for children under 14. If you are under 14, please don't create an account.</p>
<h2>9. Security</h2>
<p>Connections use HTTPS, passwords are hashed by Supabase, and database access rules limit who can read or change each piece of data.</p>
<h2>10. Changes</h2>
<p>We'll post any changes here with a new effective date.</p>
<h2>11. Contact (privacy officer)</h2>
<p>${CONTACT.name} · <a href="mailto:${CONTACT.email}">${CONTACT.email}</a></p>`,
    },
    ko: {
      title: '개인정보 처리방침',
      body: `
<p>Slop Lab(운영자: ${CONTACT.name})이 어떤 개인정보를 왜 처리하는지, 이용자가 무엇을 할 수 있는지 알려 드려요.</p>
<h2>1. 처리하는 개인정보</h2>
<ul>
<li><b>계정:</b> 이메일 주소, 비밀번호(로그인 서비스 Supabase가 암호화된 값으로만 보관해요). 선택 항목: 아이디, 표시 이름, 소개.</li>
<li><b>사이트 이용 기록:</b> 올린 글(제목, 본문, 코드, 링크, 이미지, 프롬프트), 댓글, 판정, 저장한 글, 신고, 팔로우한 커뮤니티.</li>
<li><b>손님 판정:</b> 계정 없이 판정하면 브라우저에 익명 손님 ID가 저장되고, 판정은 그 ID에만 연결돼요.</li>
<li><b>방문 수:</b> 페이지별·날짜별 조회 수만 세요. 이를 위해 IP 주소, 쿠키, 식별자를 저장하지 않아요.</li>
<li><b>기술 정보:</b> 호스팅·데이터베이스 업체가 사이트 제공과 남용 방지를 위해 IP 주소와 접속 기록을 처리해요. 글꼴을 jsDelivr와 Google Fonts에서 불러올 때 이 업체들이 IP 주소를 받아요.</li>
</ul>
<h2>2. 처리 목적</h2>
<p>계정 운영과 로그인, 글·댓글·프로필 표시, 판정과 조회 수 집계, 사이트 안 알림, 스팸·남용 방지(이용 한도, 운영). 개인정보를 판매하지 않고, 광고를 보여 주지 않으며, 광고·추적 쿠키를 쓰지 않아요.</p>
<h2>3. 공개되는 정보</h2>
<p>아이디, 표시 이름, 소개, 글과 댓글은 공개돼요. 판정 합계는 공개되지만 누가 어떻게 판정했는지는 공개되지 않아요. 이메일 주소, 저장한 글, 신고는 비공개이고, 신고는 운영자가 볼 수 있어요.</p>
<h2>4. 처리 위탁과 국외 이전</h2>
<ul>
<li><b>Supabase</b>(데이터베이스, 로그인, 이미지 저장): 일본 도쿄의 서버. 이전 항목: 위 1번의 계정·이용 기록. 이전 시점과 방법: 이용할 때마다 네트워크로 전송. 보유 기간: 아래 5번과 같아요.</li>
<li><b>GitHub Pages</b>(사이트 호스팅): 미국. 접속 시 IP 주소와 접속 기록.</li>
<li><b>jsDelivr, Google Fonts</b>(글꼴 제공): 전 세계 콘텐츠 전송망. 글꼴을 불러올 때 IP 주소.</li>
</ul>
<p>이 업체들은 서비스 제공 목적으로만 정보를 처리해요. 국외 이전을 원하지 않으면 계정을 만들지 않거나 삭제하면 돼요(이 경우 글쓰기 등 일부 기능을 쓸 수 없어요).</p>
<h2>5. 보유 기간과 파기</h2>
<ul>
<li>계정 정보: 계정을 삭제할 때까지.</li>
<li>글과 댓글: 작성자나 운영자가 지울 때까지.</li>
<li>계정을 삭제하면 프로필, 판정, 저장한 글, 알림, 신고, 팔로우가 바로 지워져요. 글과 댓글은 함께 지우기를 고르면 지워지고, 고르지 않으면 “탈퇴한 사용자”가 쓴 것으로 남아요.</li>
<li>날짜별 방문 수에는 개인정보가 없어요.</li>
<li>지운 정보는 데이터베이스에서 바로 삭제해서 되살릴 수 없게 해요.</li>
</ul>
<h2>6. 이용자의 권리</h2>
<ul>
<li>설정에서 프로필을 보고 고칠 수 있고, 글과 댓글은 언제든 지울 수 있어요.</li>
<li>설정에서 계정을 삭제할 수 있어요. 바로 적용되고 되돌릴 수 없어요.</li>
<li>그 밖의 열람, 정정, 삭제, 처리 정지 요청이나 문의는 아래 이메일로 보내 주세요.</li>
</ul>
<h2>7. 자동 수집 장치(쿠키 등)</h2>
<p>로그인 상태, 언어·보기 설정, 작성 중인 초안을 브라우저의 로컬 저장소에 저장해요. 광고·추적 쿠키는 쓰지 않아요.</p>
<h2>8. 만 14세 미만</h2>
<p>Slop Lab은 만 14세 미만을 대상으로 하지 않아요. 만 14세 미만이면 계정을 만들지 말아 주세요.</p>
<h2>9. 안전성 확보 조치</h2>
<p>모든 연결은 HTTPS로 암호화되고, 비밀번호는 Supabase가 암호화된 값으로만 보관하며, 데이터베이스 접근 규칙으로 정보마다 읽고 바꿀 수 있는 사람을 제한해요.</p>
<h2>10. 변경</h2>
<p>처리방침이 바뀌면 시행일과 함께 이 페이지에 올려요.</p>
<h2>11. 개인정보 보호책임자</h2>
<p>${CONTACT.name} · <a href="mailto:${CONTACT.email}">${CONTACT.email}</a></p>`,
    },
  },
};
