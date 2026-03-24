import { chromium, devices } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ...devices['iPhone 14'] });
const p = await ctx.newPage();

// 에러 수집
p.on('console', msg => { if (msg.type() === 'error') console.log('  ERR:', msg.text().substring(0, 100)); });

// 로그인
console.log('=== 로그인 ===');
await p.goto('https://do-ratings.com/ko/auth/login');
await p.waitForTimeout(2000);
await p.fill('input[placeholder*="이메일"]', '83482@daum.net');
await p.fill('input[placeholder*="비밀번호"]', 'rkd140828!');
await p.evaluate(() => {
  for (const btn of document.querySelectorAll('button')) {
    if (btn.textContent?.trim() === '로그인' && !btn.querySelector('img')) { btn.click(); break; }
  }
});
await p.waitForTimeout(6000);

// 모든 오버레이 닫기
for (let i = 0; i < 15; i++) {
  const closed = await p.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.textContent?.includes('건너뛰기') || btn.textContent?.trim() === '✕') { btn.click(); return true; }
    }
    const ol = document.querySelector('[class*="fixed"][class*="inset"]');
    if (ol && ol.classList.contains('z-[9999]') || ol?.classList.contains('z-[9998]')) { ol.click(); return true; }
    return false;
  });
  if (!closed) break;
  await p.waitForTimeout(400);
}

console.log('로그인 완료:', p.url());

// 리뷰 작성 (트럼프)
console.log('\n=== 리뷰 작성 (도널드 트럼프) ===');
await p.goto('https://do-ratings.com/ko/write/75530a16-2ef7-4c6d-b02b-77ea8ce7a2c4');
await p.waitForTimeout(4000);

// 오버레이 닫기
for (let i = 0; i < 10; i++) {
  const closed = await p.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.textContent?.includes('건너뛰기') || btn.textContent?.trim() === '✕') { btn.click(); return true; }
    }
    return false;
  });
  if (!closed) break;
  await p.waitForTimeout(300);
}
await p.waitForTimeout(1000);

// 스크린샷 — 폼 초기 상태
await p.screenshot({ path: 'review-01-initial.png' });

// 1. 별점 4점 클릭 — evaluate로 React state 직접 변경
console.log('별점 클릭...');
const starResult = await p.evaluate(() => {
  const buttons = document.querySelectorAll('form button');
  const starBtns = [];
  buttons.forEach(btn => {
    if (btn.querySelector('svg[viewBox="0 0 24 24"]')) starBtns.push(btn);
  });
  if (starBtns.length >= 4) {
    // 실제 React onClick을 트리거하기 위해 dispatchEvent 사용
    starBtns[3].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return { clicked: true, total: starBtns.length };
  }
  return { clicked: false, total: starBtns.length };
});
console.log('별점 결과:', starResult);
await p.waitForTimeout(500);

// 별점이 실제로 변경됐는지 확인
const ratingCheck = await p.evaluate(() => {
  const spans = document.querySelectorAll('form span');
  for (const s of spans) {
    if (/^[1-5]\.[0-9]$/.test(s.textContent?.trim() ?? '')) return s.textContent?.trim();
  }
  return null;
});
console.log('별점 값:', ratingCheck);
await p.screenshot({ path: 'review-02-after-star.png' });

// 2. 제목 입력 — React의 onChange를 올바르게 트리거
console.log('제목 입력...');
await p.evaluate(() => {
  const input = document.querySelector('input[maxlength="100"]');
  if (input) {
    // React 16+ fiber를 통한 값 설정
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, '모바일 Playwright 리뷰 테스트');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
await p.waitForTimeout(300);

// 3. 내용 입력
console.log('내용 입력...');
await p.evaluate(() => {
  const ta = document.querySelector('textarea[maxlength="5000"]');
  if (ta) {
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    nativeSetter?.call(ta, '이것은 Playwright 자동 테스트에서 작성된 리뷰입니다. 모바일 환경에서 정상적으로 제출되는지 확인합니다.');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
await p.waitForTimeout(300);

// 4. 면책 동의
console.log('면책 동의...');
await p.evaluate(() => {
  const cb = document.querySelector('input[type="checkbox"]');
  if (cb && !cb.checked) {
    cb.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
});
await p.waitForTimeout(500);

// 5. 폼 상태 확인
const formState = await p.evaluate(() => {
  const titleInput = document.querySelector('input[maxlength="100"]');
  const contentArea = document.querySelector('textarea[maxlength="5000"]');
  const checkbox = document.querySelector('input[type="checkbox"]');
  const submitBtn = document.querySelector('button[type="submit"]');

  return {
    title: titleInput?.value ?? '',
    content: contentArea?.value ?? '',
    checked: checkbox?.checked ?? false,
    submitDisabled: submitBtn?.disabled ?? true,
    submitText: submitBtn?.textContent ?? '',
  };
});
console.log('폼 상태:', JSON.stringify(formState, null, 2));
await p.screenshot({ path: 'review-03-before-submit.png' });

// 6. 제출
if (!formState.submitDisabled) {
  console.log('제출 중...');
  await p.evaluate(() => {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn && !submitBtn.disabled) {
      submitBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  });
  await p.waitForTimeout(10000);

  const afterUrl = p.url();
  const afterBody = await p.textContent('body');
  const success = afterUrl.includes('/subject/') || afterBody.includes('등록되었습니다') || afterBody.includes('🎉');

  console.log('제출 후 URL:', afterUrl);
  console.log('성공:', success);
  await p.screenshot({ path: 'review-04-after-submit.png' });

  if (success) {
    console.log('✅ 리뷰 작성 성공!');

    // Subject 페이지에서 확인
    await p.goto('https://do-ratings.com/ko/subject/75530a16-2ef7-4c6d-b02b-77ea8ce7a2c4');
    await p.waitForTimeout(3000);
    const hasReview = (await p.textContent('body')).includes('모바일 Playwright 리뷰');
    console.log('리뷰 표시:', hasReview ? '✅ 확인됨' : '❌ 안 보임');
    await p.screenshot({ path: 'review-05-subject.png' });
  }
} else {
  console.log('❌ 등록 버튼이 비활성화 상태입니다');
  console.log('  title:', formState.title ? '✅' : '❌ 비어있음');
  console.log('  content:', formState.content ? '✅' : '❌ 비어있음');
  console.log('  agreed:', formState.checked ? '✅' : '❌ 미체크');
  console.log('  submitText:', formState.submitText);
}

await ctx.close();
await browser.close();
console.log('\n=== 완료 ===');
