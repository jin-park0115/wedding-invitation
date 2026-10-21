# 서준 그리고 하늘

가상의 커플을 위한 애니메이션 모바일 청첩장입니다. 빌드 과정은 없지만 JS가 ES 모듈이라 `file://`로는 안 열리고, 로컬 서버(`python -m http.server`)로 열어야 합니다.

- `index.html` 마크업 · `css/` 스타일 (base, hero, sections, overlays) · `js/` 기능별 모듈 (`main.js`가 진입점)

- 봉투가 열리는 인트로, 손글씨 이름, 흩날리는 꽃잎
- 스크롤 타임라인, 그림 갤러리, 플립 카운트다운, 하트 달력
- 약도 애니메이션, 주소·계좌 복사, 오르골 배경음악(WebAudio)
- 다크모드, '동작 줄이기' 설정 대응

방명록, 실시간 말풍선, 하트 공유, "N명이 보고 있어요"는 열린 곳에 따라 저장소가 달라집니다 (`js/backend.js`).

- claude.ai Artifact: Artifact의 `db` · `user` · `room` 기능
- GitHub Pages 등 그 밖: Firebase 익명 로그인 + Firestore (`js/firebase-config.js`, 프로젝트 `jin-wedding-invitation`)

보안 규칙은 `firestore.rules`에 있고, 고친 뒤에는 `npx firebase-tools deploy --only firestore:rules`로 올립니다. 익명 로그인을 쓰기 때문에 GitHub Pages가 아닌 다른 도메인에서 열려면 Firebase Auth의 승인된 도메인에 그 도메인을 추가해야 합니다.

이름, 장소, 계좌는 모두 가상입니다.
