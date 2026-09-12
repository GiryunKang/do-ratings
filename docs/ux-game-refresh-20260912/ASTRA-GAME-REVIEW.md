# Astra 게임 흐름 점검 및 구현 계약

작성일: 2026-09-12. 조사 대상은 저장소의 실제 코드이며, 아래 최초 발견 위치는 수정 전 줄 번호다. 운영 DB의 실제 함수·RLS 배포 상태를 확인한 것으로 해석하지 않는다.

## 핵심 발견 8개

1. **예측 점수 단위와 명칭이 부정확했다.** `src/components/home/RatingPrediction.tsx:49`에서 DB 1–5 평균을 계산하고 `:66`에서 1–10으로 clamp한 뒤 `:137`에서 그대로 `/10`으로 출력했다. AI 호출 없이 단순 가중평균인데 `:99`는 AI 예측이라고 표시했다. 현재는 ‘취향 점수 가늠하기’로 바꾸고 최근 50건 이내 표본과 60/40 산식을 설명하며 `displayRating()`을 거쳐 표시한다. 표본 밖의 과거 평가를 알 수 없으므로 ‘평가하지 않은 대상’이라고 보장하지 않는다.
2. **일일 미션과 연속 기록의 날짜 기준이 달랐다.** `DailyMission.tsx:31`은 기기 로컬 날짜를 사용하지만 `:49` 조회 시작은 UTC 자정이었다. `:57`의 50건 제한은 해당 카테고리 평가를 누락할 수 있다. `RatingStreak.tsx:32`는 30일만 조회하며 `:65`에서 이틀 이상만 표시해 첫날은 보이지 않았다. 현재 공통 한국시간 날짜 계산과 전체 기록 페이지 조회를 사용한다. 어제까지 이어진 기록은 오늘 자정까지 이어갈 수 있다.
3. **인증 변경 시 이전 상태가 남거나 초기 조회가 경합할 수 있었다.** 기존 미션·streak·예측은 비로그인 분기에서 데이터 초기화 없이 loading만 바꾸었다. `AuthProvider.tsx:21`의 getUser와 `:28` auth event는 순서를 보장하지 않는다. 새 게임 hook은 userId를 상태에 붙이고 현재 사용자와 다르면 숨긴다. effect cleanup과 요청 번호가 늦게 도착한 응답을 폐기한다. AuthProvider 자체 경합은 게임 모듈 밖의 별도 점검 대상이다.
4. **저장 성공과 다음 게임 행동이 이어지지 않았다.** `ReviewForm.tsx:165`는 새 리뷰 id를 반환하지만 `:226`부터 축하 후 2초 자동 이동만 했다. `:237`에서 제출 상태를 다시 풀어 재진입도 가능했다. 게임 측은 `ratings:review-saved` 이벤트 수신 후 재조회하며, 이벤트 자체는 보상 근거로 쓰지 않는다. 저장 담당 모듈이 insert/update 성공 후 이벤트를 보내는 계약이다.
5. **익명 사용자가 로그인하면 대상과 작성 맥락을 잃었다.** `QuickRateStars.tsx:27`은 목적지 없는 로그인으로 이동했다. `write/[subjectId]/page.tsx:108`은 redirect를 제공하지만 `auth/login/page.tsx:26`은 이를 무시하고 `/`로 이동했다. 신규 `/play`는 익명 탐색과 카테고리 이동을 열어두며, 로그인 링크에 locale이 포함된 return URL을 전달한다. 로그인·초안 복구 수정은 별도 담당 범위다.
6. **현재 폼과 저장소 초기 SQL 사이에 충돌이 있다.** `001_create_tables.sql:45`는 overall_rating 1–5를 요구하며 `:53`은 `(user_id, subject_id)` unique다. 하지만 `004_create_triggers.sql:39`는 insert 점수를 sub_ratings 평균으로 강제하고 `:27`은 빈 객체면 0을 반환한다. 기존 `ReviewForm.tsx:55`는 빈 sub_ratings를 사용했다. 운영 DB에 별도 함수 변경이 적용됐는지는 미검증이다. ‘UI 동작’만으로 실제 저장 성공을 주장하면 안 된다.
7. **기존 등급·업적은 새 탐험 진척과 다른 체계이며 신뢰성도 별도 검증이 필요하다.** `004_create_triggers.sql:5`의 platinum은 리뷰 200개+helpful 500개, gold는 50+100, silver는 리뷰 10개다. `007_phase2_engagement.sql:29`의 user_achievements insert 정책은 WITH CHECK(true)이므로 코드상 ‘시스템 전용’이 아니다. 같은 파일 `:130`은 ON CONFLICT DO NOTHING으로 중복 수여를 막지만 취소·재산정 체계는 아니다. 신규 탐험 단계는 이 테이블을 읽거나 쓰지 않으며 UI에서 별도 기록임을 명시한다.
8. **기존 검증 스크립트는 안전한 게임 검증 근거로 사용할 수 없다.** `test-review-submit.mjs`는 하드코딩 로그인 정보와 운영 사이트에 리뷰를 쓰는 코드를 포함한다. 해당 스크립트를 실행하지 않았다. 이번 테스트는 공개 GET만 허용하고 인증·리뷰 응답은 로컬 mock으로 구성하며 실제 POST/PATCH/DELETE를 차단한다.

## 최종 구현 계약

- 홈: `src/components/game/PlayerProgress.tsx` default export, props `{ locale: string }`.
- 상세: `src/app/[locale]/play/page.tsx` → `src/components/game/ExplorerHub.tsx`.
- 순수 로직: `src/lib/game/progress.ts`. `calculateProgress(reviews, now)`는 동일 입력에 동일 결과를 반환한다. 점수 높낮이·랜덤·클릭 수·새로고침 횟수는 계산에 관여하지 않는다.
- 읽기: `src/lib/game/usePlayerProgress.ts`에서 `reviews.select('id, subject_id, created_at, subjects(category_id, categories(slug))').eq('user_id', userId).eq('is_deleted', false).order('created_at', { ascending:false }).order('id', { ascending:false }).range(offset, offset+499)`를 500건씩 끝까지 읽는다. 50/1000건을 전체 기록처럼 표시하지 않는다.
- 중복 방지: subjectId당 하나의 유효 기록만 센다. 중복 응답은 최초 작성 날짜를 유지한다. 생성일 기준이므로 예전 평가 수정으로 오늘 미션이 달성되지 않는다.
- 탐험 단계: 고유 대상 리뷰 0·1·3·10·25·50개에서 각각 탐험 준비·첫 발자국·취향 발견·취향 탐험가·경험 수집가·탐험 길잡이. 기존 프로필 등급과 분리하며 금전·XP·경쟁 순위 보상은 없다.
- 도장: restaurants, places, hotels, airlines, companies, people 6개 카테고리에 각각 현재 리뷰가 1개 이상이면 획득 표시. ‘한 번 획득하면 영구 유지’라고 약속하지 않는다. 삭제된 리뷰는 제외된다.
- 미션: 첫 평가 1개, 다른 분야 3개, 한국시간 날짜로 순환하는 일일 카테고리 1개. 높은 점수를 요구하지 않으며 ‘직접 경험한 대상’이라는 안내를 함께 둔다.
- 저장 성공: `ratings:review-saved` CustomEvent 수신은 재조회 신호일 뿐이다. 재조회 성공 행만으로 진척을 다시 계산하므로 수정·재발행 이벤트에 점수가 누적되지 않는다.
- 인증·오류: auth loading / guest / loading / ready / error를 구분한다. 사용자 변경과 unmount 이후 응답은 폐기한다. 실패 시 0개로 대신 표시하지 않으며 retry를 제공한다.
- 최신성: 저장 이벤트·화면 focus·visibility 복귀·한국시간 날짜 변경에 재조회한다. 하루 변경 확인 타이머는 60초이며 숨김 해제 시 즉시 확인한다.
- 우연한 탐색: 최근 등록된 실제 subjects 최대 60개에서 처음 하나를 고르고 ‘다른 대상’ 버튼으로만 바꾼다. 이전 카드와 같은 카드를 연속 선택하지 않는다. 빈 데이터·조회 실패·대상이 하나뿐인 경우를 별도 처리한다. 획득 확률·점수·가짜 참여 수는 없다.
- 표시 단위: 저장은 1–5, 공개 숫자는 `displayRating(value)`로 2배하여 `/10`. 게임 단계/도장은 rating 값에 의존하지 않는다.
- 디자인: 상위 DESIGN.md의 기존 semantic tokens를 그대로 쓴다. Lucide 아이콘, 44px 조작 영역, 접근 가능한 progress, 짧은 CTA, 오류와 로딩 상태 안내를 제공한다. 자동 카드 전환·무한 애니메이션이 없어 reduced motion에서도 동일한 기능을 제공한다.

## 실행한 검증

- `node --test src/lib/game/progress.test.mjs`: 12 tests / 12 pass / 0 fail. 공백 기록, 중복 subject, 전체 단계 경계, 삭제·잘못된 날짜, 3개 분야·6개 도장, KST 자정, 일일 미션, 첫날·어제·중간 공백 streak, 45일 streak, 수정 평가의 생성일 유지 검증.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: exit 0.
- `node node_modules/eslint/bin/eslint.js src/lib/game src/components/game src/components/home/DailyMission.tsx src/components/home/RatingPrediction.tsx src/components/home/RatingStreak.tsx 'src/app/[locale]/play/page.tsx'`: exit 0 (UI smoke 스크립트 추가 전).
- 브라우저 검증 파일: `src/lib/game/ui.smoke.mjs`. KO/EN 320·375·414·768·1440, dark, reduced motion, overflow, mock 인증, 저장 이벤트 재조회, 중복 이벤트, 실패 및 retry를 검사한다. 모든 실제 쓰기 요청을 차단한다.
- 첫 로컬 UI 실행에서 dev 3107이 새 `/ko/play`에 Next 기본 404를 반환했다. `astra-game-mobile.png`는 그 실패 증거이며 완성 UI 스크린샷으로 사용하면 안 된다. 서버 라우트 재인식 후 재검증이 필요하다.

## 잔여 경계

실제 DB 함수·정책 배포 여부 및 운영 사용자 실제 저장은 이번 게임 모듈에서 변경하거나 검증하지 않았다. 기록 조회는 여러 HTTP 페이지이므로 페이지를 읽는 도중 다른 기기에서 삭제/추가하면 일시적 페이지 이동이 가능하다. 사용자 복귀·저장 이벤트에서 재조회하며 엄격한 DB snapshot이 필요한 대규모 기록은 추후 서버 집계 RPC로 분리할 수 있다.

Hallmark 자체 점검: Philosophy 4 / Hierarchy 4 / Execution 4 / Specificity 5 / Restraint 5 / Variety 4. 실행 검증과 화면 증거가 확보되지 않은 항목은 완성으로 표시하지 않았다.
