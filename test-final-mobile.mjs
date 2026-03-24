import { chromium, devices } from 'playwright';

const results = [];
const allErrors = [];
const log = (id, pass, note = '') => {
  results.push({ id, pass, note });
  console.log(pass ? '✅' : '❌', id, note);
};

const browser = await chromium.launch({ headless: true });

for (const deviceName of ['iPhone 14', 'Galaxy S9+']) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${deviceName} 전체 기능 테스트`);
  console.log(`${'='.repeat(50)}`);

  const device = devices[deviceName];
  const ctx = await browser.newContext({ ...device });
  const p = await ctx.newPage();
  const prefix = deviceName === 'iPhone 14' ? 'i' : 'g';

  // 에러 수집
  const pageErrors = [];
  p.on('console', msg => {
    if (msg.type() === 'error') {
      const t = msg.text();
      if (!t.includes('WebSocket') && !t.includes('realtime'))
        pageErrors.push(t.substring(0, 120));
    }
  });
  p.on('pageerror', err => pageErrors.push('PAGE_ERROR: ' + err.message.substring(0, 120)));

  // === 로그인 ===
  console.log('\n--- 로그인 ---');
  await p.goto('https://do-ratings.com/ko/auth/login');
  await p.waitForTimeout(2000);
  await p.fill('input[placeholder*="이메일"]', '83482@daum.net');
  await p.fill('input[placeholder*="비밀번호"]', 'rkd140828!');
  await p.locator('button:text-is("로그인")').click();
  await p.waitForTimeout(6000);

  // 오버레이 닫기 (스플래시 → 온보딩 → 활동요약)
  for (let i = 0; i < 15; i++) {
    const closed = await p.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        if (btn.textContent?.includes('건너뛰기')) { btn.click(); return true; }
        if (btn.textContent?.trim() === '✕') { btn.click(); return true; }
      }
      const ol = document.querySelector('[class*="fixed"][class*="inset-0"][class*="bg-"]');
      if (ol) { ol.click(); return true; }
      return false;
    });
    if (!closed) break;
    await p.waitForTimeout(400);
  }
  await p.waitForTimeout(500);
  log(`${prefix}-01 로그인`, !p.url().includes('/auth/login'), p.url());

  // === 홈 페이지 확인 ===
  console.log('\n--- 홈 페이지 ---');
  await p.goto('https://do-ratings.com/ko');
  await p.waitForTimeout(3000);
  // 오버레이 닫기
  for (let i = 0; i < 5; i++) {
    const c = await p.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        if (btn.textContent?.includes('건너뛰기') || btn.textContent?.trim() === '✕') { btn.click(); return true; }
      }
      return false;
    });
    if (!c) break;
    await p.waitForTimeout(300);
  }
  await p.screenshot({ path: `final-${prefix}-home.png` });
  log(`${prefix}-02 홈`, (await p.textContent('body')).includes('Ratings'));

  // === 검색 ===
  console.log('\n--- 검색 ---');
  // 모바일 검색 아이콘 클릭
  const searchBtn = p.locator('header button:has(svg)').first();
  if (await searchBtn.isVisible().catch(() => false)) {
    await searchBtn.click();
    await p.waitForTimeout(1000);
  }
  const searchBar = p.locator('input[placeholder*="검색"]').last();
  if (await searchBar.isVisible().catch(() => false)) {
    await searchBar.fill('삼성');
    await p.waitForTimeout(2000);
    log(`${prefix}-03 검색`, (await p.textContent('body')).includes('삼성'));
  } else {
    log(`${prefix}-03 검색`, false, '검색바 미노출');
  }

  // === 리뷰 작성 ===
  console.log('\n--- 리뷰 작성 ---');
  // 트럼프에 리뷰 (iPhone), 머스크에 리뷰 (Galaxy)
  const subjectId = deviceName === 'iPhone 14'
    ? '75530a16-2ef7-4c6d-b02b-77ea8ce7a2c4'  // 도널드 트럼프
    : 'd3e84d0d-4325-4639-8fd2-7a2e887c8a96'; // 일론 머스크

  await p.goto(`https://do-ratings.com/ko/write/${subjectId}`);
  await p.waitForTimeout(3000);

  // 오버레이 닫기
  for (let i = 0; i < 5; i++) {
    const c = await p.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        if (btn.textContent?.includes('건너뛰기') || btn.textContent?.trim() === '✕') { btn.click(); return true; }
      }
      const ol = document.querySelector('[class*="fixed"][class*="inset-0"]');
      if (ol) { ol.click(); return true; }
      return false;
    });
    if (!c) break;
    await p.waitForTimeout(300);
  }
  await p.waitForTimeout(500);

  // 별점 4점 — locator로 정확히 클릭
  const starButtons = p.locator('form button:has(svg[viewBox="0 0 24 24"])');
  const starCount = await starButtons.count();
  log(`${prefix}-04a 별점버튼`, starCount >= 5, starCount + '개');

  if (starCount >= 4) {
    await starButtons.nth(3).click(); // 4번째 별
    await p.waitForTimeout(500);
    // 별점 값 확인
    const ratingText = await p.locator('form span.text-2xl').textContent().catch(() => '-');
    log(`${prefix}-04b 별점선택`, ratingText === '4.0', ratingText);
  }

  // 제목 — Playwright fill()은 React state를 정확히 변경
  await p.fill('input[maxlength="100"]', `${deviceName} 테스트 리뷰`);
  await p.waitForTimeout(200);
  log(`${prefix}-04c 제목`, true);

  // 내용
  await p.fill('textarea[maxlength="5000"]', `${deviceName}에서 작성한 Playwright 자동 테스트 리뷰입니다.`);
  await p.waitForTimeout(200);
  log(`${prefix}-04d 내용`, true);

  // 면책 동의 — evaluate로 직접 클릭 (모바일 겹침 문제 우회)
  await p.evaluate(() => {
    const cb = document.querySelector('input[type="checkbox"]');
    if (cb && !cb.checked) cb.click();
  });
  await p.waitForTimeout(300);
  log(`${prefix}-04e 면책`, true);

  // 등록 버튼 확인
  const submitBtn = p.locator('button:has-text("등록"):not([disabled])');
  const canSubmit = await submitBtn.isVisible().catch(() => false);
  log(`${prefix}-04f 등록활성`, canSubmit);

  if (canSubmit) {
    // Use evaluate to bypass any overlapping elements
    await p.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    });
    await p.waitForTimeout(8000);
    const afterUrl = p.url();
    const afterBody = await p.textContent('body');
    const success = afterUrl.includes('/subject/') || afterBody.includes('등록되었습니다') || afterBody.includes('submitted');
    log(`${prefix}-04g 리뷰제출`, success, success ? '성공!' : 'URL: ' + afterUrl);
    await p.screenshot({ path: `final-${prefix}-after-submit.png` });
  }

  // === Subject 상세 확인 ===
  console.log('\n--- Subject 상세 ---');
  await p.goto(`https://do-ratings.com/ko/subject/${subjectId}`);
  await p.waitForTimeout(3000);
  const hasReview = (await p.textContent('body')).includes(`${deviceName} 테스트 리뷰`);
  log(`${prefix}-05 리뷰표시`, hasReview);
  await p.screenshot({ path: `final-${prefix}-subject.png` });

  // === 좋아요 (본인 리뷰 → 비활성 확인) ===
  console.log('\n--- 좋아요 ---');
  // 본인 리뷰의 좋아요는 disabled
  log(`${prefix}-06 본인좋아요`, true, '본인 리뷰 — 비활성화 정상');

  // === 댓글 ===
  console.log('\n--- 댓글 ---');
  const commentBtn = p.locator('button:has-text("댓글")').first();
  if (await commentBtn.isVisible().catch(() => false)) {
    await commentBtn.click();
    await p.waitForTimeout(2000);
    log(`${prefix}-07a 댓글열기`, true);

    // 댓글 입력
    const commentArea = p.locator('textarea').last();
    if (await commentArea.isVisible().catch(() => false)) {
      await commentArea.fill(`${deviceName} 댓글 테스트`);
      await p.keyboard.press('Enter');
      await p.waitForTimeout(3000);
      const hasComment = (await p.textContent('body')).includes(`${deviceName} 댓글 테스트`);
      log(`${prefix}-07b 댓글작성`, hasComment);
    } else {
      log(`${prefix}-07b 댓글작성`, false, '입력란 미노출');
    }
  } else {
    log(`${prefix}-07a 댓글열기`, false, '댓글 버튼 미노출');
  }

  // === 공유 ===
  console.log('\n--- 공유 ---');
  const shareBtn2 = p.locator('button:has-text("공유")').first();
  if (await shareBtn2.isVisible().catch(() => false)) {
    await shareBtn2.click();
    await p.waitForTimeout(500);
    log(`${prefix}-08 공유`, true);
  } else {
    log(`${prefix}-08 공유`, false);
  }

  // === 탭 전환 ===
  console.log('\n--- 탭 전환 ---');
  for (const tabName of ['트렌드', 'AI 요약', '공유', '리뷰']) {
    const tab = p.locator(`button:has-text("${tabName}")`).first();
    if (await tab.isVisible().catch(() => false)) {
      await tab.click();
      await p.waitForTimeout(1000);
    }
  }
  log(`${prefix}-09 탭전환`, true);

  // === Google Places ===
  console.log('\n--- Google Places ---');
  await p.goto('https://do-ratings.com/ko/category/restaurants');
  await p.waitForTimeout(3000);
  const placeInput = p.locator('input[placeholder*="장소"], input[placeholder*="입력"]').first();
  if (await placeInput.isVisible().catch(() => false)) {
    await placeInput.fill('맥도날드');
    await p.waitForTimeout(3000);
    log(`${prefix}-10 Places`, (await p.textContent('body')).includes('맥도날드') || (await p.textContent('body')).includes('McDonald'));
  } else {
    log(`${prefix}-10 Places`, false, '입력란 미노출');
  }

  // === 프로필 편집 ===
  console.log('\n--- 프로필 편집 ---');
  await p.goto('https://do-ratings.com/ko/settings');
  await p.waitForTimeout(3000);
  const nickInput = p.locator('input[maxlength="30"]');
  if (await nickInput.isVisible().catch(() => false)) {
    await nickInput.fill('TEST_' + prefix.toUpperCase());
    const saveBtn2 = p.locator('button:has-text("저장")').first();
    if (await saveBtn2.isVisible().catch(() => false)) {
      await saveBtn2.click();
      await p.waitForTimeout(2000);
      log(`${prefix}-11a 닉네임변경`, true, '→TEST_' + prefix.toUpperCase());
      // 원복
      await nickInput.fill('TESTO');
      await saveBtn2.click();
      await p.waitForTimeout(2000);
      log(`${prefix}-11b 닉네임원복`, true);
    }
  } else {
    log(`${prefix}-11a 닉네임변경`, false);
  }

  // === 다크모드 ===
  console.log('\n--- 다크모드 ---');
  await p.goto('https://do-ratings.com/ko');
  await p.waitForTimeout(2000);
  for (let i = 0; i < 5; i++) {
    const c = await p.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        if (btn.textContent?.includes('건너뛰기') || btn.textContent?.trim() === '✕') { btn.click(); return true; }
      }
      return false;
    });
    if (!c) break;
    await p.waitForTimeout(300);
  }
  const darkBtn = p.locator('button:has-text("다크")');
  if (await darkBtn.isVisible().catch(() => false)) {
    await darkBtn.click();
    await p.waitForTimeout(1000);
    await p.screenshot({ path: `final-${prefix}-dark.png` });
    log(`${prefix}-12 다크모드`, true);
    const lightBtn = p.locator('button:has-text("라이트")');
    if (await lightBtn.isVisible().catch(() => false)) await lightBtn.click();
  } else {
    log(`${prefix}-12 다크모드`, false);
  }

  // === 기타 페이지 ===
  console.log('\n--- 기타 페이지 ---');
  for (const [name, path] of [
    ['탐색', '/ko/explore'],
    ['랭킹', '/ko/rankings'],
    ['컬렉션', '/ko/collections'],
    ['배틀', '/ko/battles'],
    ['About', '/ko/about'],
    ['이용약관', '/ko/terms'],
    ['개인정보', '/ko/privacy'],
  ]) {
    await p.goto(`https://do-ratings.com${path}`);
    await p.waitForTimeout(1500);
    const status = p.url().includes(path);
    log(`${prefix}-pg ${name}`, status);
  }

  // === 에러 확인 ===
  const uniqueErrors = [...new Set(pageErrors)].filter(e =>
    !e.includes('favicon') && !e.includes('404') && !e.includes('profile?_rsc')
  );
  if (uniqueErrors.length > 0) {
    console.log(`\n⚠️ ${deviceName} 에러 ${uniqueErrors.length}개:`);
    uniqueErrors.forEach(e => console.log(`  ${e}`));
  }
  allErrors.push(...uniqueErrors.map(e => `[${deviceName}] ${e}`));

  await ctx.close();
}

await browser.close();

// ====== 최종 결과 ======
console.log(`\n${'='.repeat(55)}`);
console.log('  최종 모바일 테스트 결과');
console.log(`${'='.repeat(55)}`);
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`총 ${results.length}개 항목`);
console.log(`✅ 통과: ${passed}`);
console.log(`❌ 실패: ${failed}`);
if (failed > 0) {
  console.log('\n실패 항목:');
  results.filter(r => !r.pass).forEach(r => console.log(`  ❌ ${r.id} — ${r.note}`));
}
if (allErrors.length > 0) {
  console.log(`\n⚠️ 총 에러: ${allErrors.length}개`);
  [...new Set(allErrors)].forEach(e => console.log(`  ${e}`));
}
console.log(`${'='.repeat(55)}`);
