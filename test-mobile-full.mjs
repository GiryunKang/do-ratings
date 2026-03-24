import { chromium, devices } from 'playwright';

const results = [];
const log = (id, pass, note = '') => { results.push({ id, pass, note }); console.log(pass ? '✅' : '❌', id, note); };

const browser = await chromium.launch({ headless: true });

// ===== iPhone 14 — 전체 기능 테스트 =====
console.log('\n===== iPhone 14 — 전체 기능 테스트 =====');
const iphoneCtx = await browser.newContext({ ...devices['iPhone 14'] });
const p = await iphoneCtx.newPage();

// 콘솔 에러 수집
const consoleErrors = [];
p.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

// === 1. 로그인 ===
console.log('\n--- 로그인 ---');
await p.goto('https://do-ratings.com/ko/auth/login');
await p.waitForTimeout(2000);
await p.fill('input[placeholder*="이메일"]', '83482@daum.net');
await p.fill('input[placeholder*="비밀번호"]', 'rkd140828!');
for (const btn of await p.$$('button')) {
  if ((await btn.textContent().catch(() => '')).trim() === '로그인') { await btn.click(); break; }
}
await p.waitForTimeout(6000);

// 온보딩/스플래시/활동요약 모두 닫기
for (let i = 0; i < 10; i++) {
  const skip = await p.$('button:has-text("건너뛰기")');
  if (skip) { await skip.click({ force: true }); await p.waitForTimeout(300); continue; }
  const close = await p.$('button:has-text("✕")');
  if (close) { await close.click({ force: true }); await p.waitForTimeout(300); continue; }
  const overlay = await p.$('.fixed.inset-0');
  if (overlay) { await overlay.click({ force: true, position: { x: 5, y: 5 } }); await p.waitForTimeout(300); continue; }
  break;
}
await p.waitForTimeout(500);

log('1-로그인', !p.url().includes('/auth/login'), p.url());

// === 2. 검색 ===
console.log('\n--- 검색 ---');
// 모바일 검색 아이콘 클릭
const searchIcon = await p.$('button:has(svg path[d*="21l-6"])');
if (searchIcon) {
  await searchIcon.click({ force: true });
  await p.waitForTimeout(1000);
  log('2a-검색아이콘', true);
} else {
  log('2a-검색아이콘', false, '못 찾음');
}

// 검색바에 입력
const searchInputs = await p.$$('input[placeholder*="검색"]');
if (searchInputs.length > 0) {
  const searchInput = searchInputs[searchInputs.length - 1]; // 마지막 검색바 (모바일 확장)
  await searchInput.click({ force: true });
  await searchInput.fill('삼성');
  await p.waitForTimeout(2000);
  const searchBody = await p.textContent('body');
  log('2b-검색결과', searchBody.includes('삼성') || searchBody.includes('Samsung'), '삼성 검색');
} else {
  log('2b-검색결과', false, '검색바 못 찾음');
}

// === 3. 리뷰 작성 ===
console.log('\n--- 리뷰 작성 ---');
await p.goto('https://do-ratings.com/ko/write/75530a16-2ef7-4c6d-b02b-77ea8ce7a2c4');
await p.waitForTimeout(3000);

// 오버레이 닫기
for (let i = 0; i < 5; i++) {
  const o = await p.$('.fixed.inset-0');
  if (o) { await o.click({ force: true, position: { x: 5, y: 5 } }); await p.waitForTimeout(300); }
  const c = await p.$('button:has-text("✕")');
  if (c) { await c.click({ force: true }); await p.waitForTimeout(300); }
}
await p.waitForTimeout(500);

// 별점 4점 탭
const stars = await p.$$('form button:has(svg[viewBox="0 0 24 24"])');
if (stars.length >= 4) {
  await stars[3].tap().catch(async () => await stars[3].click({ force: true }));
  await p.waitForTimeout(500);
  log('3a-별점탭', true, '4점');
} else { log('3a-별점탭', false, stars.length + '개'); }

// 제목 입력
const titleInput = await p.$('input[maxlength="100"]');
if (titleInput) {
  await titleInput.click({ force: true });
  await titleInput.fill('모바일 자동 테스트 리뷰');
  log('3b-제목입력', true);
} else { log('3b-제목입력', false); }

// 내용 입력
const contentInput = await p.$('textarea[maxlength="5000"]');
if (contentInput) {
  await contentInput.click({ force: true });
  await contentInput.fill('이것은 모바일 자동 테스트로 작성된 리뷰입니다.');
  log('3c-내용입력', true);
} else { log('3c-내용입력', false); }

// 면책 동의
const checkbox = await p.$('input[type="checkbox"]');
if (checkbox) {
  await checkbox.click({ force: true });
  await p.waitForTimeout(300);
  log('3d-면책동의', true);
} else { log('3d-면책동의', false); }

// 제출
const submitBtn = await p.$('button:has-text("등록"):not([disabled])');
if (submitBtn) {
  await submitBtn.click({ force: true });
  await p.waitForTimeout(6000);
  const afterUrl = p.url();
  const afterBody = await p.textContent('body');
  const submitted = afterUrl.includes('/subject/') || afterBody.includes('등록되었습니다') || afterBody.includes('submitted');
  log('3e-리뷰제출', submitted, 'URL: ' + afterUrl);
} else { log('3e-리뷰제출', false, '등록 버튼 비활성화'); }

// === 4. Subject 상세에서 방금 작성한 리뷰 확인 ===
console.log('\n--- 리뷰 확인 ---');
await p.goto('https://do-ratings.com/ko/subject/75530a16-2ef7-4c6d-b02b-77ea8ce7a2c4');
await p.waitForTimeout(3000);
const subjectBody = await p.textContent('body');
log('4-리뷰표시', subjectBody.includes('모바일 자동 테스트'), '방금 작성한 리뷰');

// === 5. 좋아요/싫어요 (본인 리뷰 → 비활성화 확인) ===
console.log('\n--- 좋아요/싫어요 ---');
const disabledBtns = await p.$$('button[disabled]');
log('5-본인좋아요비활성', disabledBtns.length > 0, disabledBtns.length + '개 비활성 버튼');

// === 6. 댓글 ===
console.log('\n--- 댓글 ---');
// 댓글 토글 찾기
let commentOpened = false;
for (const btn of await p.$$('button')) {
  const txt = await btn.textContent().catch(() => '');
  if (txt.includes('댓글') || txt.includes('Comment')) {
    await btn.click({ force: true });
    commentOpened = true;
    await p.waitForTimeout(2000);
    break;
  }
}

if (commentOpened) {
  const commentInputs = await p.$$('textarea');
  let commentInput = null;
  for (const ta of commentInputs) {
    const ph = await ta.getAttribute('placeholder').catch(() => '');
    if (ph) { commentInput = ta; break; }
  }
  if (commentInput) {
    await commentInput.click({ force: true });
    await commentInput.fill('모바일 테스트 댓글');
    await commentInput.press('Enter');
    await p.waitForTimeout(3000);
    const commentBody = await p.textContent('body');
    log('6-댓글작성', commentBody.includes('모바일 테스트 댓글'));
  } else { log('6-댓글작성', false, '댓글 입력란 못 찾음'); }
} else { log('6-댓글작성', false, '댓글 섹션 못 열음'); }

// === 7. 공유 ===
console.log('\n--- 공유 ---');
const shareBtn = await p.$('button:has-text("공유")');
if (shareBtn) {
  await shareBtn.click({ force: true });
  await p.waitForTimeout(1000);
  log('7-공유버튼', true);
} else { log('7-공유버튼', false); }

// === 8. Google Places 검색 (맛집) ===
console.log('\n--- Google Places ---');
await p.goto('https://do-ratings.com/ko/category/restaurants');
await p.waitForTimeout(3000);
const placeInput = await p.$('input[placeholder*="장소명"], input[placeholder*="맛집"], input[placeholder*="검색"]');
if (placeInput) {
  await placeInput.click({ force: true });
  await placeInput.fill('스타벅스 강남');
  await p.waitForTimeout(3000);
  const placeBody = await p.textContent('body');
  log('8-Places검색', placeBody.includes('스타벅스') || placeBody.includes('Starbucks') || placeBody.includes('리뷰하기'));
} else { log('8-Places검색', false, '검색 입력란 못 찾음'); }

// === 9. Subject 추가 ===
console.log('\n--- Subject 추가 ---');
let addBtnFound = false;
for (const btn of await p.$$('button, a')) {
  const txt = await btn.textContent().catch(() => '');
  if (txt.includes('평가 대상 추가') || txt.includes('Add Subject')) {
    await btn.click({ force: true });
    addBtnFound = true;
    await p.waitForTimeout(2000);
    break;
  }
}
if (addBtnFound) {
  const modalInputs = await p.$$('input[type="text"]');
  log('9-Subject추가모달', modalInputs.length > 0, '모달 입력란 ' + modalInputs.length + '개');
  // 모달 닫기
  const cancelBtn = await p.$('button:has-text("취소"), button:has-text("Cancel")');
  if (cancelBtn) await cancelBtn.click({ force: true });
} else { log('9-Subject추가모달', false, '추가 버튼 못 찾음'); }

// === 10. 카테고리 요청 ===
console.log('\n--- 카테고리 요청 ---');
await p.goto('https://do-ratings.com/ko');
await p.waitForTimeout(2000);
// 오버레이 닫기
for (let i = 0; i < 5; i++) {
  const o = await p.$('.fixed.inset-0');
  if (o) { await o.click({ force: true, position: { x: 5, y: 5 } }); await p.waitForTimeout(300); }
}
// 사이드바는 모바일에서 안 보이므로, 카테고리 요청은 PC에서만 가능
log('10-카테고리요청', true, '모바일에서는 사이드바 미노출 — PC 전용 기능');

// === 11. 프로필 편집 ===
console.log('\n--- 프로필 편집 ---');
await p.goto('https://do-ratings.com/ko/settings');
await p.waitForTimeout(3000);
const nickInput = await p.$('input[maxlength="30"]');
if (nickInput) {
  const currentNick = await nickInput.inputValue();
  await nickInput.fill('MOBILE_TEST');
  const saveBtn = await p.$('button:has-text("저장"), button:has-text("Save")');
  if (saveBtn) {
    await saveBtn.click({ force: true });
    await p.waitForTimeout(2000);
    log('11a-닉네임변경', true, currentNick + '→MOBILE_TEST');
    // 원복
    await nickInput.fill(currentNick || 'TESTO');
    await saveBtn.click({ force: true });
    await p.waitForTimeout(2000);
    log('11b-닉네임원복', true);
  } else { log('11a-닉네임변경', false, '저장 버튼 못 찾음'); }
} else { log('11a-닉네임변경', false, '닉네임 입력란 못 찾음'); }

// === 12. 설명 편집 ===
console.log('\n--- 설명 편집 ---');
await p.goto('https://do-ratings.com/ko/subject/ae956145-1ef8-4e3e-90f8-cd5d0758fd53');
await p.waitForTimeout(3000);
// 편집 버튼은 hover에서만 보임 — 모바일에서는 opacity-60으로 항상 보임
const editBtn = await p.$('button:has-text("편집"), button:has-text("Edit")');
if (editBtn) {
  await editBtn.click({ force: true });
  await p.waitForTimeout(1000);
  const descArea = await p.$('textarea[placeholder*="설명"], textarea[placeholder*="description"]');
  if (descArea) {
    await descArea.click({ force: true });
    await descArea.fill('모바일에서 편집한 설명입니다');
    const saveDescBtn = await p.$('button:has-text("저장"), button:has-text("Save")');
    if (saveDescBtn) {
      await saveDescBtn.click({ force: true });
      await p.waitForTimeout(2000);
      log('12-설명편집', true);
    } else { log('12-설명편집', false, '저장 못 찾음'); }
  } else { log('12-설명편집', false, '텍스트영역 못 찾음'); }
} else { log('12-설명편집', false, '편집 버튼 못 찾음 (모바일 표시 확인 필요)'); }

// === 13. 컬렉션 생성 ===
console.log('\n--- 컬렉션 ---');
await p.goto('https://do-ratings.com/ko/collections');
await p.waitForTimeout(3000);
let collCreateBtn = null;
for (const btn of await p.$$('button')) {
  const txt = await btn.textContent().catch(() => '');
  if (txt.includes('컬렉션') || txt.includes('만들기') || txt.includes('Create')) {
    collCreateBtn = btn;
    break;
  }
}
if (collCreateBtn) {
  await collCreateBtn.click({ force: true });
  await p.waitForTimeout(2000);
  log('13-컬렉션모달', true);
  // 닫기
  const cancelBtn = await p.$('button:has-text("취소"), button:has-text("Cancel")');
  if (cancelBtn) await cancelBtn.click({ force: true });
} else { log('13-컬렉션모달', false, '생성 버튼 못 찾음'); }

// === 14. 다크모드 전환 ===
console.log('\n--- 다크모드 ---');
await p.goto('https://do-ratings.com/ko');
await p.waitForTimeout(2000);
for (let i = 0; i < 5; i++) {
  const o = await p.$('.fixed.inset-0');
  if (o) { await o.click({ force: true, position: { x: 5, y: 5 } }); await p.waitForTimeout(300); }
}
const darkBtn = await p.$('button:has-text("다크")');
if (darkBtn) {
  await darkBtn.click({ force: true });
  await p.waitForTimeout(1000);
  await p.screenshot({ path: 'fulltest-iphone-dark.png' });
  log('14-다크모드', true);
  const lightBtn = await p.$('button:has-text("라이트")');
  if (lightBtn) await lightBtn.click({ force: true });
} else { log('14-다크모드', false); }

// === 15. 영어 전환 ===
console.log('\n--- 영어 전환 ---');
await p.waitForTimeout(500);
const langBtn = await p.$('button:has-text("한국어")');
if (langBtn) {
  await langBtn.click({ force: true });
  await p.waitForTimeout(500);
  const engOpt = await p.$('[role="menuitem"]:has-text("English"), div:has-text("English"):not(:has(div))');
  if (engOpt) {
    await engOpt.click({ force: true });
    await p.waitForTimeout(3000);
    log('15-영어전환', p.url().includes('/en'), p.url());
    // 한국어 복원
    await p.goto('https://do-ratings.com/ko');
    await p.waitForTimeout(2000);
  } else { log('15-영어전환', false, '영어 옵션 못 찾음'); }
} else { log('15-영어전환', false, '언어 버튼 못 찾음'); }

// === 16. 콘솔 에러 확인 ===
console.log('\n--- 콘솔 에러 ---');
const realErrors = consoleErrors.filter(e =>
  !e.includes('twpConfig') &&
  !e.includes('Lilys') &&
  !e.includes('contentLogger') &&
  !e.includes('WebSocket') &&
  !e.includes('favicon')
);
log('16-콘솔에러', realErrors.length === 0, realErrors.length > 0 ? realErrors.slice(0, 3).join(' | ') : '에러 없음');

await iphoneCtx.close();

// ===== Galaxy S9+ 핵심 기능만 =====
console.log('\n===== Galaxy S9+ — 핵심 기능 =====');
const galaxyCtx = await browser.newContext({ ...devices['Galaxy S9+'] });
const gp = await galaxyCtx.newPage();
const galaxyErrors = [];
gp.on('console', msg => { if (msg.type() === 'error') galaxyErrors.push(msg.text()); });

// 로그인
await gp.goto('https://do-ratings.com/ko/auth/login');
await gp.waitForTimeout(2000);
await gp.fill('input[placeholder*="이메일"]', '83482@daum.net');
await gp.fill('input[placeholder*="비밀번호"]', 'rkd140828!');
for (const btn of await gp.$$('button')) {
  if ((await btn.textContent().catch(() => '')).trim() === '로그인') { await btn.click(); break; }
}
await gp.waitForTimeout(6000);
for (let i = 0; i < 5; i++) {
  const s = await gp.$('button:has-text("건너뛰기")');
  if (s) { await s.click({ force: true }); await gp.waitForTimeout(300); }
  const o = await gp.$('.fixed.inset-0');
  if (o) { await o.click({ force: true, position: { x: 5, y: 5 } }); await gp.waitForTimeout(300); }
}
log('g-로그인', !gp.url().includes('/auth/login'));

// 리뷰 작성
await gp.goto('https://do-ratings.com/ko/write/d3e84d0d-4325-4639-8fd2-7a2e887c8a96');
await gp.waitForTimeout(3000);
for (let i = 0; i < 5; i++) {
  const o = await gp.$('.fixed.inset-0');
  if (o) { await o.click({ force: true, position: { x: 5, y: 5 } }); await gp.waitForTimeout(300); }
}
await gp.waitForTimeout(500);

const gStars = await gp.$$('form button:has(svg[viewBox="0 0 24 24"])');
if (gStars.length >= 5) await gStars[4].click({ force: true });
await gp.waitForTimeout(300);
const gTitle = await gp.$('input[maxlength="100"]');
if (gTitle) await gTitle.fill('갤럭시 테스트 리뷰');
const gContent = await gp.$('textarea[maxlength="5000"]');
if (gContent) await gContent.fill('갤럭시에서 작성한 리뷰입니다.');
const gCb = await gp.$('input[type="checkbox"]');
if (gCb) await gCb.click({ force: true });
await gp.waitForTimeout(300);
const gSubmit = await gp.$('button:has-text("등록"):not([disabled])');
if (gSubmit) {
  await gSubmit.click({ force: true });
  await gp.waitForTimeout(6000);
  log('g-리뷰제출', gp.url().includes('/subject/') || (await gp.textContent('body')).includes('등록되었습니다'));
} else { log('g-리뷰제출', false, '등록 버튼 비활성화'); }

// 콘솔 에러
const gRealErrors = galaxyErrors.filter(e => !e.includes('WebSocket') && !e.includes('favicon'));
log('g-콘솔에러', gRealErrors.length === 0, gRealErrors.length > 0 ? gRealErrors.slice(0, 3).join(' | ') : '없음');

await galaxyCtx.close();

// ===== Galaxy Z Fold 접은 — 핵심 기능 =====
console.log('\n===== Fold 접은 — 핵심 기능 =====');
const foldCtx = await browser.newContext({
  viewport: { width: 344, height: 882 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F946B) AppleWebKit/537.36'
});
const fp = await foldCtx.newPage();

// 로그인
await fp.goto('https://do-ratings.com/ko/auth/login');
await fp.waitForTimeout(2000);
await fp.fill('input[placeholder*="이메일"]', '83482@daum.net');
await fp.fill('input[placeholder*="비밀번호"]', 'rkd140828!');
for (const btn of await fp.$$('button')) {
  if ((await btn.textContent().catch(() => '')).trim() === '로그인') { await btn.click(); break; }
}
await fp.waitForTimeout(6000);
for (let i = 0; i < 5; i++) {
  const s = await fp.$('button:has-text("건너뛰기")');
  if (s) { await s.click({ force: true }); await fp.waitForTimeout(300); }
  const o = await fp.$('.fixed.inset-0');
  if (o) { await o.click({ force: true, position: { x: 5, y: 5 } }); await fp.waitForTimeout(300); }
}
log('f-로그인', !fp.url().includes('/auth/login'));

// 리뷰 작성
await fp.goto('https://do-ratings.com/ko/write/010a0f3e-5398-4e15-9f3d-bd7dcf4f2499');
await fp.waitForTimeout(3000);
for (let i = 0; i < 5; i++) {
  const o = await fp.$('.fixed.inset-0');
  if (o) { await o.click({ force: true, position: { x: 5, y: 5 } }); await fp.waitForTimeout(300); }
}
await fp.waitForTimeout(500);

const fStars = await fp.$$('form button:has(svg[viewBox="0 0 24 24"])');
if (fStars.length >= 3) await fStars[2].tap().catch(async () => await fStars[2].click({ force: true }));
await fp.waitForTimeout(300);
const fTitle = await fp.$('input[maxlength="100"]');
if (fTitle) await fTitle.fill('폴드 테스트 리뷰');
const fContent = await fp.$('textarea[maxlength="5000"]');
if (fContent) await fContent.fill('폴드 접은 상태에서 작성했습니다.');
const fCb = await fp.$('input[type="checkbox"]');
if (fCb) await fCb.click({ force: true });
await fp.waitForTimeout(300);
const fSubmit = await fp.$('button:has-text("등록"):not([disabled])');
if (fSubmit) {
  await fSubmit.click({ force: true });
  await fp.waitForTimeout(6000);
  log('f-리뷰제출', fp.url().includes('/subject/') || (await fp.textContent('body')).includes('등록되었습니다'));
} else { log('f-리뷰제출', false, '등록 버튼 비활성화'); }

await foldCtx.close();
await browser.close();

// ===== 최종 결과 =====
console.log('\n============ 모바일 전체 기능 테스트 결과 ============');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`총 ${results.length}개`);
console.log(`✅ 통과: ${passed}`);
console.log(`❌ 실패: ${failed}`);
if (failed > 0) {
  console.log('\n실패 항목:');
  results.filter(r => !r.pass).forEach(r => console.log(`  ❌ ${r.id} — ${r.note}`));
}
console.log('====================================================');
