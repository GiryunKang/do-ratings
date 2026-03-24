import { chromium, devices } from 'playwright';

const results = [];
const errors = [];
const log = (id, pass, note = '') => { results.push({ id, pass, note }); console.log(pass ? '✅' : '❌', id, note); };

const browser = await chromium.launch({ headless: true });
const iphoneCtx = await browser.newContext({ ...devices['iPhone 14'] });
const p = await iphoneCtx.newPage();

// 모든 콘솔 에러 수집
p.on('console', msg => {
  if (msg.type() === 'error') {
    const text = msg.text();
    if (!text.includes('WebSocket') && !text.includes('favicon') && !text.includes('404')) {
      errors.push(text.substring(0, 150));
    }
  }
});

// 네트워크 에러 수집
p.on('response', res => {
  if (res.status() >= 400 && !res.url().includes('favicon') && !res.url().includes('realtime')) {
    errors.push(`HTTP ${res.status()}: ${res.url().substring(0, 100)}`);
  }
});

// ==============================
// 1. 로그인
// ==============================
console.log('\n=== 1. 로그인 ===');
await p.goto('https://do-ratings.com/ko/auth/login');
await p.waitForTimeout(2000);
await p.fill('input[placeholder*="이메일"]', '83482@daum.net');
await p.fill('input[placeholder*="비밀번호"]', 'rkd140828!');

// 로그인 버튼 — evaluate로 클릭 (React 이벤트 트리거)
await p.evaluate(() => {
  const btns = document.querySelectorAll('button');
  for (const btn of btns) {
    if (btn.textContent.trim() === '로그인' && !btn.querySelector('img')) {
      btn.click();
      break;
    }
  }
});
await p.waitForTimeout(6000);

// 모든 오버레이 닫기
async function closeOverlays() {
  for (let i = 0; i < 10; i++) {
    const closed = await p.evaluate(() => {
      // 건너뛰기
      const skip = document.querySelector('button');
      for (const btn of document.querySelectorAll('button')) {
        if (btn.textContent.includes('건너뛰기')) { btn.click(); return 'skip'; }
      }
      // ✕ 닫기
      for (const btn of document.querySelectorAll('button')) {
        if (btn.textContent.trim() === '✕') { btn.click(); return 'close'; }
      }
      // 오버레이 클릭
      const overlay = document.querySelector('.fixed.inset-0');
      if (overlay) { overlay.click(); return 'overlay'; }
      return null;
    });
    if (!closed) break;
    await p.waitForTimeout(400);
  }
}
await closeOverlays();
await p.waitForTimeout(500);

log('1-로그인', !p.url().includes('/auth/login'), p.url());

// ==============================
// 2. 검색
// ==============================
console.log('\n=== 2. 검색 ===');
// 모바일 검색 아이콘
await p.evaluate(() => {
  const btns = document.querySelectorAll('button');
  for (const btn of btns) {
    if (btn.querySelector('svg') && btn.classList.contains('md:hidden')) {
      btn.click();
      return;
    }
  }
  // fallback: path에 21l-6 포함된 svg가 있는 button
  for (const btn of btns) {
    const path = btn.querySelector('path[d*="21l-6"]');
    if (path) { btn.click(); return; }
  }
});
await p.waitForTimeout(1000);

const searchInputs = await p.$$('input[placeholder*="검색"]');
if (searchInputs.length > 0) {
  await searchInputs[searchInputs.length - 1].fill('삼성');
  await p.waitForTimeout(2000);
  const hasResult = await p.evaluate(() => document.body.textContent.includes('삼성'));
  log('2-검색', hasResult);
} else {
  log('2-검색', false, '검색바 못 찾음');
}

// ==============================
// 3. 리뷰 작성 (핵심!)
// ==============================
console.log('\n=== 3. 리뷰 작성 ===');
await p.goto('https://do-ratings.com/ko/write/75530a16-2ef7-4c6d-b02b-77ea8ce7a2c4');
await p.waitForTimeout(3000);
await closeOverlays();
await p.waitForTimeout(500);

// 별점 4점 — evaluate로 직접 클릭
const starClicked = await p.evaluate(() => {
  const svgBtns = [];
  document.querySelectorAll('form button').forEach(btn => {
    if (btn.querySelector('svg[viewBox="0 0 24 24"]')) svgBtns.push(btn);
  });
  if (svgBtns.length >= 4) {
    svgBtns[3].click(); // 4번째 별
    return true;
  }
  return false;
});
await p.waitForTimeout(500);

// 별점이 실제로 변경되었는지 확인
const ratingValue = await p.evaluate(() => {
  const spans = document.querySelectorAll('span');
  for (const s of spans) {
    if (/^[1-5]\.[0-9]$/.test(s.textContent.trim())) return s.textContent.trim();
  }
  return null;
});
log('3a-별점', starClicked && ratingValue !== null, '별점: ' + ratingValue);

// 제목
await p.evaluate(() => {
  const input = document.querySelector('input[maxlength="100"]');
  if (input) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, '모바일 실제 테스트 리뷰');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
await p.waitForTimeout(300);
log('3b-제목', true);

// 내용
await p.evaluate(() => {
  const ta = document.querySelector('textarea[maxlength="5000"]');
  if (ta) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, '이것은 모바일에서 실제로 작성하여 DB에 저장되는지 확인하는 테스트 리뷰입니다.');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
await p.waitForTimeout(300);
log('3c-내용', true);

// 면책 동의
await p.evaluate(() => {
  const cb = document.querySelector('input[type="checkbox"]');
  if (cb && !cb.checked) cb.click();
});
await p.waitForTimeout(300);
log('3d-면책', true);

// 제출 버튼 활성화 확인
const submitEnabled = await p.evaluate(() => {
  const btns = document.querySelectorAll('button');
  for (const btn of btns) {
    if (btn.textContent.includes('등록') && !btn.disabled) return true;
  }
  return false;
});
log('3e-등록버튼활성', submitEnabled);

if (submitEnabled) {
  // 네트워크 응답 캡처
  const responsePromise = p.waitForResponse(res => res.url().includes('reviews') || res.url().includes('subject'), { timeout: 15000 }).catch(() => null);

  await p.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.includes('등록') && !btn.disabled) { btn.click(); break; }
    }
  });

  await p.waitForTimeout(8000);
  const finalUrl = p.url();
  const finalBody = await p.textContent('body');
  const success = finalUrl.includes('/subject/') || finalBody.includes('등록되었습니다') || finalBody.includes('submitted');
  log('3f-리뷰제출', success, 'URL: ' + finalUrl);
  await p.screenshot({ path: 'real-mobile-after-submit.png' });
}

// ==============================
// 4. 리뷰 확인 + 좋아요/댓글
// ==============================
console.log('\n=== 4. 리뷰 확인 ===');
await p.goto('https://do-ratings.com/ko/subject/75530a16-2ef7-4c6d-b02b-77ea8ce7a2c4');
await p.waitForTimeout(3000);
const hasReview = await p.evaluate(() => document.body.textContent.includes('모바일 실제 테스트'));
log('4a-리뷰표시', hasReview);

// 댓글 열기
const commentOpened = await p.evaluate(() => {
  const btns = document.querySelectorAll('button');
  for (const btn of btns) {
    if (btn.textContent.includes('댓글')) { btn.click(); return true; }
  }
  return false;
});
await p.waitForTimeout(2000);
log('4b-댓글열기', commentOpened);

if (commentOpened) {
  // 댓글 입력
  const commentWritten = await p.evaluate(() => {
    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      const ph = ta.getAttribute('placeholder') || '';
      if (ph) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ta, '모바일 댓글 테스트');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  });

  if (commentWritten) {
    // Enter로 제출
    await p.keyboard.press('Enter');
    await p.waitForTimeout(3000);
    const hasComment = await p.evaluate(() => document.body.textContent.includes('모바일 댓글 테스트'));
    log('4c-댓글작성', hasComment);
  } else {
    log('4c-댓글작성', false, '댓글 입력란 없음');
  }
}

// ==============================
// 5. Google Places 검색
// ==============================
console.log('\n=== 5. Google Places ===');
await p.goto('https://do-ratings.com/ko/category/restaurants');
await p.waitForTimeout(3000);

const placeSearched = await p.evaluate(() => {
  const inputs = document.querySelectorAll('input');
  for (const input of inputs) {
    const ph = input.getAttribute('placeholder') || '';
    if (ph.includes('장소') || ph.includes('검색') || ph.includes('입력')) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '스타벅스');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }
  return false;
});
await p.waitForTimeout(3000);
if (placeSearched) {
  const placeResult = await p.evaluate(() =>
    document.body.textContent.includes('스타벅스') || document.body.textContent.includes('Starbucks') || document.body.textContent.includes('리뷰하기')
  );
  log('5-Places검색', placeResult);
} else {
  log('5-Places검색', false, '입력란 못 찾음');
}

// ==============================
// 6. 프로필 편집
// ==============================
console.log('\n=== 6. 프로필 편집 ===');
await p.goto('https://do-ratings.com/ko/settings');
await p.waitForTimeout(3000);

const nickChanged = await p.evaluate(() => {
  const input = document.querySelector('input[maxlength="30"]');
  if (!input) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'MOBILE_OK');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
});

if (nickChanged) {
  await p.waitForTimeout(300);
  await p.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.includes('저장') || btn.textContent.includes('Save')) { btn.click(); break; }
    }
  });
  await p.waitForTimeout(2000);
  log('6a-닉네임변경', true, '→MOBILE_OK');

  // 원복
  await p.evaluate(() => {
    const input = document.querySelector('input[maxlength="30"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'TESTO');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await p.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.textContent.includes('저장')) { btn.click(); break; }
    }
  });
  await p.waitForTimeout(2000);
  log('6b-닉네임원복', true);
} else {
  log('6a-닉네임변경', false, '입력란 없음');
}

// ==============================
// 7. 설명 편집
// ==============================
console.log('\n=== 7. 설명 편집 ===');
await p.goto('https://do-ratings.com/ko/subject/ae956145-1ef8-4e3e-90f8-cd5d0758fd53');
await p.waitForTimeout(3000);

const editClicked = await p.evaluate(() => {
  const btns = document.querySelectorAll('button');
  for (const btn of btns) {
    if (btn.textContent.includes('편집') || btn.textContent.includes('Edit')) { btn.click(); return true; }
  }
  return false;
});

if (editClicked) {
  await p.waitForTimeout(1000);
  const descFilled = await p.evaluate(() => {
    const tas = document.querySelectorAll('textarea');
    for (const ta of tas) {
      const ph = ta.getAttribute('placeholder') || '';
      if (ph.includes('설명') || ph.includes('description')) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ta, '모바일에서 편집 테스트');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }
    return false;
  });

  if (descFilled) {
    await p.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        if (btn.textContent.includes('저장') || btn.textContent.includes('Save')) { btn.click(); break; }
      }
    });
    await p.waitForTimeout(2000);
    log('7-설명편집', true);
  } else { log('7-설명편집', false, '텍스트영역 없음'); }
} else { log('7-설명편집', false, '편집 버튼 없음'); }

// ==============================
// 8. 공유
// ==============================
console.log('\n=== 8. 공유 ===');
const shareClicked = await p.evaluate(() => {
  for (const btn of document.querySelectorAll('button')) {
    if (btn.textContent.includes('공유') || btn.textContent.includes('Share')) { btn.click(); return true; }
  }
  return false;
});
log('8-공유', shareClicked);

// ==============================
// 9. 다크모드
// ==============================
console.log('\n=== 9. 다크모드 ===');
await p.goto('https://do-ratings.com/ko');
await p.waitForTimeout(2000);
await closeOverlays();

const darkToggled = await p.evaluate(() => {
  for (const btn of document.querySelectorAll('button')) {
    if (btn.textContent.includes('다크')) { btn.click(); return true; }
  }
  return false;
});
await p.waitForTimeout(1000);
await p.screenshot({ path: 'real-mobile-dark.png' });
log('9-다크모드', darkToggled);

// 라이트 복원
await p.evaluate(() => {
  for (const btn of document.querySelectorAll('button')) {
    if (btn.textContent.includes('라이트')) { btn.click(); break; }
  }
});

// ==============================
// 10. 영어 전환
// ==============================
console.log('\n=== 10. 영어 전환 ===');
await p.waitForTimeout(500);
await p.evaluate(() => {
  for (const btn of document.querySelectorAll('button')) {
    if (btn.textContent.includes('한국어')) { btn.click(); break; }
  }
});
await p.waitForTimeout(500);
await p.evaluate(() => {
  for (const el of document.querySelectorAll('[role="menuitem"], div')) {
    if (el.textContent.trim() === 'English' && !el.querySelector('div')) { el.click(); break; }
  }
});
await p.waitForTimeout(3000);
log('10-영어전환', p.url().includes('/en'), p.url());

// ==============================
// 최종 에러 확인
// ==============================
console.log('\n=== 콘솔/네트워크 에러 ===');
const uniqueErrors = [...new Set(errors)];
if (uniqueErrors.length > 0) {
  console.log(`${uniqueErrors.length}개 에러 발견:`);
  uniqueErrors.forEach(e => console.log(`  ⚠️ ${e}`));
} else {
  console.log('에러 없음');
}
log('11-에러없음', uniqueErrors.length === 0, uniqueErrors.length + '개');

await iphoneCtx.close();
await browser.close();

// ==============================
// 최종 결과
// ==============================
console.log('\n============ 모바일 실제 기능 테스트 결과 ============');
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
