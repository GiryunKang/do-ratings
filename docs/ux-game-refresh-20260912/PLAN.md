# Do! Ratings! 사용성·디자인·취향 탐험 개선

요청: 2026-09-12, Astra의 면밀한 UI/UX 검토와 실제 적용, 게임 같은 재미.

## 목표와 범위
- 처음 온 사람이 검색 또는 카테고리에서 대상을 찾고, 평가 초안을 작성하고, 로그인 후 저장까지 이어진다.
- 저장된 실제 평가를 취향 탐험 단계·분야 도장으로 보여준다. 공개 점수를 맞추거나 높은 점수를 주는 일에 보상하지 않는다.
- 홈의 중복 랭킹과 오래된 데이터를 실시간인 것처럼 표현하는 구성을 정리한다.
- 기존 Next.js/Supabase/Vercel, routes, 회원/리뷰 데이터와 권한 계약은 유지한다.

## 변경 경계
- Root: DESIGN.md, globals.css, app/layout·locale/layout·locale/page, Header/Sidebar/BottomNav, ThemeToggle/Provider, SearchBar, explore/page, SubjectImage, subject/category 이미지 표시, AuthProvider, 필요 개발 config.
- Astra 디자인: ASTRA-DESIGN-REVIEW.md, ReviewForm/StarRating/QuickRateStars/write, 로그인·회원가입·callback 복귀와 초안 보존 관련 유틸 및 테스트.
- Astra 게임: ASTRA-GAME-REVIEW.md, lib/game·components/game·locale/play, DailyMission/RatingPrediction/RatingStreak 정직성, 게임 계산 테스트.
- 기존 파일 삭제 없음. 운영 데이터 수정·리뷰 생성·배포는 이 검증 과정에서 실행하지 않는다.

## 검증 게이트
1. TypeScript, 변경 파일 ESLint, production build.
2. 고유 평가 기반 진행 계산, 계정 전환, empty/error, 수정/새로고침 중복 보상 방지.
3. 320/375/414/768/1440 화면, 한국어·영어, light/dark, reduced motion, 키보드.
4. 실제 공개 데이터 GET로 홈/검색/상세 확인. 저장·인증 실패/성공은 로컬 mock으로 검증하고 운영 데이터에는 쓰지 않는다.
5. 검색 작동, 이동 일관성, 평점 /10 통일, 이미지 실패 fallback, 저장 후 완료 안내.

## 최초 근거
- 이전 캡처: ../../../../docs/do-ratings-check-20260912/home-desktop.png (운영 홈페이지, 2026-09-12).
- Home 검색 input에 form/handler 없음; Sidebar popular/latest query를 Home이 소비하지 않음.
- 공통 max-w-4xl + md sidebar 256px, 모바일 고정 광고/가입 유도/하단 내비 중첩.
- 실제 홈페이지 동일 샘 올트먼 평점 10.0 vs 5.0 혼용, 오래된 리뷰를 LIVE FEED로 표시, 이미지 실패.

## 한계 관리
- repository schema와 운영 schema 간 차이는 읽기/모의 검증과 구분한다. DB migration은 별도 검증이 필요하다.
- 각 페이지 전체 개편이 아니라 공통 시스템과 핵심 발견→평가→재방문 흐름을 우선한다. 잔여 findings는 감사 문서에 기록한다.
