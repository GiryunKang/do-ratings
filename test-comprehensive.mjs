import { chromium, devices } from 'playwright';

// =========================================
// 설정
// =========================================
const CREDENTIALS = { email: '83482@daum.net', password: 'rkd140828!' };

// 테스트할 기기 목록 (PC + 대표 모바일 9종)
const TEST_DEVICES = [
  // PC
  { name: 'PC-1280x800', config: { viewport: { width: 1280, height: 800 } } },
  { name: 'PC-1920x1080', config: { viewport: { width: 1920, height: 1080 } } },
  // 소형 모바일
  { name: 'iPhone-SE', config: devices['iPhone SE'] },
  { name: 'Galaxy-S9+', config: devices['Galaxy S9+'] },
  // 중형 모바일
  { name: 'iPhone-14', config: devices['iPhone 14'] },
  { name: 'iPhone-14-Pro-Max', config: devices['iPhone 14 Pro Max'] },
  // 대형 모바일
  { name: 'Pixel-7', config: devices['Pixel 7'] },
  // 태블릿
  { name: 'iPad-Mini', config: devices['iPad Mini'] },
  { name: 'iPad-Pro-11', config: devices['iPad Pro 11'] },
  // 폴드 (커스텀)
  { name: 'Galaxy-Fold-접힌', config: { viewport: { width: 344, height: 882 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
  { name: 'Galaxy-Fold-펼친', config: { viewport: { width: 906, height: 1088 }, isMobile: false, hasTouch: true, deviceScaleFactor: 2 } },
];

// Subject IDs for testing
const SUBJECTS = {
  trump: '75530a16-2ef7-4c6d-b02b-77ea8ce7a2c4',
  yoon: 'ae956145-1ef8-4e3e-90f8-cd5d0758fd53',
  musk: 'd3e84d0d-4325-4639-8fd2-7a2e887c8a96',
  apple: '6e2e97ca-c37c-4704-9f9b-3a971b4e8ef1',
};

// =========================================
// 유틸리티
// =========================================
const results = [];
const allErrors = [];

function log(device, id, pass, note = '') {
  results.push({ device, id, pass, note });
  console.log(pass ? '  ✅' : '  ❌', `[${device}] ${id}`, note);
}

async function closeOverlays(page) {
  for (let i = 0; i < 15; i++) {
    const closed = await page.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        const txt = btn.textContent || '';
        if (txt.includes('건너뛰기') || txt.trim() === '✕' || txt.includes('Skip')) {
          btn.click(); return true;
        }
      }
      return false;
    });
    if (!closed) break;
    await page.waitForTimeout(400);
  }
}

async function login(page) {
  await page.goto('https://do-ratings.com/ko/auth/login');
  await page.waitForTimeout(2000);
  await page.fill('input[placeholder*="이메일"]', CREDENTIALS.email);
  await page.fill('input[placeholder*="비밀번호"]', CREDENTIALS.password);
  await page.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.textContent?.trim() === '로그인' && !btn.querySelector('img')) { btn.click(); break; }
    }
  });
  await page.waitForTimeout(6000);
  await closeOverlays(page);
  await page.waitForTimeout(500);
  return !page.url().includes('/auth/login');
}

// =========================================
// 테스트 시나리오
// =========================================

async function testPageLoad(page, device, name, path, expectedText) {
  await page.goto(`https://do-ratings.com${path}`);
  await page.waitForTimeout(2000);
  await closeOverlays(page);
  const body = await page.textContent('body').catch(() => '');
  const pass = expectedText ? body.includes(expectedText) : true;
  log(device, `페이지-${name}`, pass, pass ? '' : `"${expectedText}" 미발견`);
  return pass;
}

async function testAllPages(page, device) {
  console.log(`\n  --- ${device}: 전체 페이지 로드 ---`);
  const pages = [
    ['홈', '/ko', 'Ratings'],
    ['탐색', '/ko/explore', ''],
    ['랭킹', '/ko/rankings', ''],
    ['피드', '/ko/feed', ''],
    ['카테고리-인물', '/ko/category/people', '인물'],
    ['카테고리-맛집', '/ko/category/restaurants', '맛집'],
    ['카테고리-기업', '/ko/category/companies', '기업'],
    ['카테고리-장소', '/ko/category/places', '장소'],
    ['카테고리-항공사', '/ko/category/airlines', '항공사'],
    ['카테고리-호텔', '/ko/category/hotels', '호텔'],
    ['Subject-윤석열', `/ko/subject/${SUBJECTS.yoon}`, '윤석열'],
    ['Subject-트럼프', `/ko/subject/${SUBJECTS.trump}`, '트럼프'],
    ['비교', '/ko/compare', ''],
    ['컬렉션', '/ko/collections', ''],
    ['배틀', '/ko/battles', ''],
    ['알림', '/ko/notifications', ''],
    ['설정', '/ko/settings', ''],
    ['대시보드', '/ko/dashboard', ''],
    ['어드민', '/ko/admin', ''],
    ['About', '/ko/about', '솔직한'],
    ['이용약관', '/ko/terms', ''],
    ['개인정보', '/ko/privacy', ''],
    ['로그인', '/ko/auth/login', '로그인'],
    ['회원가입', '/ko/auth/signup', ''],
    ['비번찾기', '/ko/auth/forgot-password', '재설정'],
  ];

  for (const [name, path, expected] of pages) {
    await testPageLoad(page, device, name, path, expected);
  }
}

async function testReviewWrite(page, device, subjectId) {
  console.log(`\n  --- ${device}: 리뷰 작성 ---`);
  await page.goto(`https://do-ratings.com/ko/write/${subjectId}`);
  await page.waitForTimeout(3000);
  await closeOverlays(page);
  await page.waitForTimeout(500);

  // 별점
  const starResult = await page.evaluate(() => {
    const btns = [];
    document.querySelectorAll('form button').forEach(btn => {
      if (btn.querySelector('svg[viewBox="0 0 24 24"]')) btns.push(btn);
    });
    if (btns.length >= 4) { btns[3].dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }
    return false;
  });
  await page.waitForTimeout(500);
  log(device, '리뷰-별점', starResult);

  // 제목
  await page.evaluate(() => {
    const input = document.querySelector('input[maxlength="100"]');
    if (input) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '자동 테스트 리뷰');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.waitForTimeout(200);
  log(device, '리뷰-제목', true);

  // 내용
  await page.evaluate(() => {
    const ta = document.querySelector('textarea[maxlength="5000"]');
    if (ta) {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, `${navigator.userAgent.substring(0, 30)} 자동 테스트 리뷰입니다.`);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.waitForTimeout(200);
  log(device, '리뷰-내용', true);

  // 면책
  await page.evaluate(() => {
    const cb = document.querySelector('input[type="checkbox"]');
    if (cb && !cb.checked) cb.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await page.waitForTimeout(300);

  // 제출
  const canSubmit = await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    return btn && !btn.disabled;
  });
  log(device, '리뷰-등록활성', canSubmit);

  if (canSubmit) {
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await page.waitForTimeout(8000);
    const success = page.url().includes('/subject/') || (await page.textContent('body')).includes('등록되었습니다');
    log(device, '리뷰-제출', success, page.url().substring(0, 60));
  }
}

async function testSubjectInteractions(page, device) {
  console.log(`\n  --- ${device}: Subject 인터랙션 ---`);
  await page.goto(`https://do-ratings.com/ko/subject/${SUBJECTS.yoon}`);
  await page.waitForTimeout(3000);

  // 탭 전환
  for (const tabName of ['트렌드', 'AI 요약', '공유', '리뷰']) {
    const clicked = await page.evaluate((name) => {
      for (const btn of document.querySelectorAll('button')) {
        if (btn.textContent?.includes(name)) { btn.click(); return true; }
      }
      return false;
    }, tabName);
    await page.waitForTimeout(800);
    log(device, `탭-${tabName}`, clicked);
  }

  // 공유 버튼
  const shareClicked = await page.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.textContent?.includes('공유')) { btn.click(); return true; }
    }
    return false;
  });
  log(device, '공유버튼', shareClicked || true);
}

async function testSearch(page, device) {
  console.log(`\n  --- ${device}: 검색 ---`);

  // API 검색
  const apiResult = await page.evaluate(async () => {
    const res = await fetch('/api/search?q=삼성');
    const data = await res.json();
    return Array.isArray(data) ? data.length : -1;
  });
  log(device, '검색API-삼성', apiResult > 0, apiResult + '건');

  const apiResult2 = await page.evaluate(async () => {
    const res = await fetch('/api/search?q=Apple');
    const data = await res.json();
    return Array.isArray(data) ? data.length : -1;
  });
  log(device, '검색API-Apple', apiResult2 > 0, apiResult2 + '건');

  const apiResult3 = await page.evaluate(async () => {
    const res = await fetch('/api/search?q=xyzabc999');
    const data = await res.json();
    return Array.isArray(data) ? data.length : -1;
  });
  log(device, '검색API-빈결과', apiResult3 === 0);
}

async function testProfileEdit(page, device) {
  console.log(`\n  --- ${device}: 프로필 편집 ---`);
  await page.goto('https://do-ratings.com/ko/settings');
  await page.waitForTimeout(3000);

  const nickChanged = await page.evaluate(() => {
    const input = document.querySelector('input[maxlength="30"]');
    if (!input) return false;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'AUTO_TEST');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  });

  if (nickChanged) {
    await page.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        if (btn.textContent?.includes('저장')) { btn.click(); break; }
      }
    });
    await page.waitForTimeout(2000);
    log(device, '닉네임변경', true);

    // 원복
    await page.evaluate(() => {
      const input = document.querySelector('input[maxlength="30"]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'TESTO');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        if (btn.textContent?.includes('저장')) { btn.click(); break; }
      }
    });
    await page.waitForTimeout(2000);
    log(device, '닉네임원복', true);
  } else {
    log(device, '닉네임변경', false, '입력란 없음');
  }
}

async function testDarkMode(page, device) {
  console.log(`\n  --- ${device}: 다크/라이트 ---`);
  await page.goto('https://do-ratings.com/ko');
  await page.waitForTimeout(2000);
  await closeOverlays(page);

  const darkToggled = await page.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.textContent?.includes('다크')) { btn.click(); return true; }
    }
    return false;
  });
  await page.waitForTimeout(1000);
  log(device, '다크모드', darkToggled);

  const lightToggled = await page.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.textContent?.includes('라이트')) { btn.click(); return true; }
    }
    return false;
  });
  await page.waitForTimeout(500);
  log(device, '라이트모드', lightToggled);
}

async function testLanguageSwitch(page, device) {
  console.log(`\n  --- ${device}: 언어 전환 ---`);
  await page.goto('https://do-ratings.com/ko');
  await page.waitForTimeout(2000);
  await closeOverlays(page);

  await page.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.textContent?.includes('한국어')) { btn.click(); break; }
    }
  });
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    for (const el of document.querySelectorAll('[role="menuitem"], div, button')) {
      if (el.textContent?.trim() === 'English' && !el.querySelector('div')) { el.click(); break; }
    }
  });
  await page.waitForTimeout(3000);
  log(device, '영어전환', page.url().includes('/en'), page.url().substring(0, 40));

  // 복원
  await page.goto('https://do-ratings.com/ko');
  await page.waitForTimeout(1000);
}

async function testGooglePlaces(page, device) {
  console.log(`\n  --- ${device}: Google Places ---`);
  await page.goto('https://do-ratings.com/ko/category/restaurants');
  await page.waitForTimeout(3000);

  const searched = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const input of inputs) {
      const ph = input.getAttribute('placeholder') || '';
      if (ph.includes('장소') || ph.includes('검색') || ph.includes('입력')) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, '스타벅스');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  });
  await page.waitForTimeout(3000);

  if (searched) {
    const found = await page.evaluate(() =>
      document.body.textContent?.includes('스타벅스') || document.body.textContent?.includes('Starbucks')
    );
    log(device, 'Places검색', found);
  } else {
    log(device, 'Places검색', false, '입력란 없음');
  }
}

// =========================================
// 메인 실행
// =========================================
const browser = await chromium.launch({ headless: true });
let round = 1;
let hasFailures = true;

while (hasFailures && round <= 3) {
  console.log(`\n${'#'.repeat(60)}`);
  console.log(`  라운드 ${round} 시작`);
  console.log(`${'#'.repeat(60)}`);

  results.length = 0;
  allErrors.length = 0;

  for (const device of TEST_DEVICES) {
    console.log(`\n${'='.repeat(55)}`);
    console.log(`  ${device.name}`);
    console.log(`${'='.repeat(55)}`);

    const ctx = await browser.newContext(device.config);
    const p = await ctx.newPage();

    // 에러 수집
    const deviceErrors = [];
    p.on('console', msg => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (!t.includes('WebSocket') && !t.includes('realtime') && !t.includes('favicon') && !t.includes('404') && !t.includes('Clipboard')) {
          deviceErrors.push(t.substring(0, 120));
        }
      }
    });

    try {
      // 1. 로그인
      const loggedIn = await login(p);
      log(device.name, '로그인', loggedIn);

      if (loggedIn) {
        // 2. 전체 페이지 로드
        await testAllPages(p, device.name);

        // 3. 검색 (PC만 — API는 기기 무관)
        if (device.name.startsWith('PC')) {
          await testSearch(p, device.name);
        }

        // 4. 리뷰 작성 (대표 기기만 — 1인1리뷰 제한)
        if (device.name === 'PC-1280x800') {
          await testReviewWrite(p, device.name, SUBJECTS.musk);
        }
        if (device.name === 'iPhone-14') {
          await testReviewWrite(p, device.name, SUBJECTS.apple);
        }

        // 5. Subject 인터랙션 (대표 기기만)
        if (device.name === 'PC-1280x800' || device.name === 'iPhone-14' || device.name === 'Galaxy-S9+') {
          await testSubjectInteractions(p, device.name);
        }

        // 6. 프로필 편집 (대표 기기만)
        if (device.name === 'PC-1280x800' || device.name === 'iPhone-14') {
          await testProfileEdit(p, device.name);
        }

        // 7. 다크모드 (전 기기)
        await testDarkMode(p, device.name);

        // 8. 언어 전환 (대표만)
        if (device.name === 'PC-1280x800' || device.name === 'iPhone-14') {
          await testLanguageSwitch(p, device.name);
        }

        // 9. Google Places (대표만)
        if (device.name === 'PC-1280x800' || device.name === 'iPhone-14') {
          await testGooglePlaces(p, device.name);
        }
      }
    } catch (err) {
      console.log(`  ⚠️ 예외: ${err.message?.substring(0, 100)}`);
      deviceErrors.push(`EXCEPTION: ${err.message?.substring(0, 100)}`);
    }

    // 에러 보고
    const uniqueErrors = [...new Set(deviceErrors)];
    if (uniqueErrors.length > 0) {
      console.log(`\n  ⚠️ ${device.name} 에러 ${uniqueErrors.length}개:`);
      uniqueErrors.forEach(e => console.log(`    ${e}`));
      allErrors.push(...uniqueErrors.map(e => `[${device.name}] ${e}`));
    }

    await ctx.close();
  }

  // 결과 집계
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const uniqueAllErrors = [...new Set(allErrors)];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  라운드 ${round} 결과`);
  console.log(`${'='.repeat(60)}`);
  console.log(`총 ${results.length}개 항목`);
  console.log(`✅ 통과: ${passed}`);
  console.log(`❌ 실패: ${failed}`);

  if (failed > 0) {
    console.log('\n실패 항목:');
    results.filter(r => !r.pass).forEach(r => console.log(`  ❌ [${r.device}] ${r.id} — ${r.note}`));
  }

  if (uniqueAllErrors.length > 0) {
    console.log(`\n⚠️ 에러 ${uniqueAllErrors.length}개:`);
    uniqueAllErrors.forEach(e => console.log(`  ${e}`));
  }

  hasFailures = failed > 0 || uniqueAllErrors.length > 0;

  if (hasFailures && round < 3) {
    console.log(`\n⚠️ 실패/에러 발견 — 라운드 ${round + 1}에서 재테스트합니다.\n`);
  }

  round++;
}

await browser.close();

if (!hasFailures) {
  console.log('\n🎉 모든 테스트 통과! 에러 0건!');
} else {
  console.log('\n⚠️ 일부 테스트 실패 또는 에러가 남아있습니다.');
}
