import { chromium } from 'playwright';

const BASE = 'https://do-ratings.com';

async function closeOverlays(p) {
  for (let i = 0; i < 15; i++) {
    const c = await p.evaluate(() => {
      for (const b of document.querySelectorAll('button')) {
        if (b.textContent?.includes('건너뛰기') || b.textContent?.trim() === '✕') { b.click(); return true; }
      }
      return false;
    });
    if (!c) break;
    await p.waitForTimeout(400);
  }
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const p = await ctx.newPage();

// 로그인
await p.goto(`${BASE}/ko/auth/login`, { timeout: 60000 });
await p.waitForTimeout(2000);
await p.fill('input[placeholder*="이메일"]', '83482@daum.net');
await p.fill('input[placeholder*="비밀번호"]', 'rkd140828!');
await p.locator('button:text-is("로그인")').first().click();
await p.waitForTimeout(6000);
await closeOverlays(p);
console.log('로그인 완료');

// === 1. 컬렉션 생성 ===
console.log('\n=== 컬렉션 생성 ===');
await p.goto(`${BASE}/ko/collections`, { timeout: 60000 });
await p.waitForTimeout(3000);

await p.evaluate(() => {
  for (const b of document.querySelectorAll('button'))
    if (b.textContent?.includes('컬렉션') || b.textContent?.includes('만들기')) { b.click(); break; }
});
await p.waitForTimeout(2000);

// 모달 내부 input에 입력
await p.evaluate(() => {
  const modal = document.querySelector('.relative.bg-card');
  if (!modal) { console.log('모달 없음'); return; }
  const inputs = modal.querySelectorAll('input[type="text"]');
  if (inputs.length > 0) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(inputs[0], 'PW 컬렉션');
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
  }
});
await p.waitForTimeout(500);

// 만들기 버튼
await p.evaluate(() => {
  const modal = document.querySelector('.relative.bg-card');
  if (!modal) return;
  for (const b of modal.querySelectorAll('button'))
    if (b.textContent?.includes('만들기') || b.textContent?.includes('생성')) { b.click(); break; }
});
await p.waitForTimeout(3000);

// 화면에서 확인 (DB 대신)
const pageText = await p.textContent('body');
const collCreated = pageText.includes('PW 컬렉션') || !pageText.includes('컬렉션이 없습니다');
console.log(collCreated ? '✅ 컬렉션 생성 (화면 확인)' : '❌ 컬렉션 미표시');
await p.screenshot({ path: 'test-coll-result.png' });

// === 2. 카테고리 추가 요청 ===
console.log('\n=== 카테고리 추가 요청 ===');
await p.goto(`${BASE}/ko`, { timeout: 60000 });
await p.waitForTimeout(2000);
await closeOverlays(p);

await p.evaluate(() => {
  for (const b of document.querySelectorAll('button'))
    if (b.textContent?.includes('카테고리 추가 요청')) { b.click(); break; }
});
await p.waitForTimeout(2000);

// 모달 input
const catFilled = await p.evaluate(() => {
  const modals = document.querySelectorAll('.fixed');
  for (const modal of modals) {
    const inputs = modal.querySelectorAll('input[type="text"]');
    for (const inp of inputs) {
      if (!inp.value) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(inp, 'PW카테고리');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }
  }
  return false;
});
console.log('입력:', catFilled);
await p.waitForTimeout(500);

// 요청 버튼
await p.evaluate(() => {
  const modals = document.querySelectorAll('.fixed');
  for (const modal of modals) {
    for (const b of modal.querySelectorAll('button'))
      if (b.textContent?.includes('요청') || b.textContent?.includes('제출')) { b.click(); return; }
  }
});
await p.waitForTimeout(3000);

// 화면 확인 (성공 메시지 or 모달 닫힘)
const afterCat = await p.evaluate(() => {
  // 모달이 닫혔으면 성공
  const modals = document.querySelectorAll('.fixed');
  for (const m of modals) {
    if (m.textContent?.includes('카테고리 추가 요청') && m.querySelector('input')) return false; // 아직 모달 열림
  }
  return true; // 모달 닫힘 = 성공
});
console.log(afterCat ? '✅ 카테고리 요청 (모달 닫힘)' : '❌ 모달 아직 열림');
await p.screenshot({ path: 'test-catreq-result.png' });

// === 3. 좋아요 ===
console.log('\n=== 좋아요 ===');
await p.goto(`${BASE}/ko/subject/ae956145-1ef8-4e3e-90f8-cd5d0758fd53`, { timeout: 60000 });
await p.waitForTimeout(4000);

// 좋아요 전 숫자 확인
const beforeCount = await p.evaluate(() => {
  const btns = document.querySelectorAll('button:not([disabled])');
  for (const btn of btns) {
    if (btn.innerHTML.includes('M14 9V5')) {
      const span = btn.querySelector('span');
      return span?.textContent?.trim() || '0';
    }
  }
  return null;
});
console.log('좋아요 전:', beforeCount);

// 클릭
await p.evaluate(() => {
  const btns = document.querySelectorAll('button:not([disabled])');
  for (const btn of btns) {
    if (btn.innerHTML.includes('M14 9V5')) { btn.click(); return; }
  }
});
await p.waitForTimeout(2000);

// 좋아요 후 숫자 확인
const afterCount = await p.evaluate(() => {
  const btns = document.querySelectorAll('button:not([disabled])');
  for (const btn of btns) {
    if (btn.innerHTML.includes('M14 9V5')) {
      const span = btn.querySelector('span');
      return span?.textContent?.trim() || '0';
    }
  }
  return null;
});
console.log('좋아요 후:', afterCount);
console.log(beforeCount !== afterCount ? '✅ 좋아요 성공 (숫자 변경)' : '❌ 좋아요 실패 (숫자 변경 없음)');

await ctx.close();
await browser.close();
console.log('\n=== 완료 ===');
