import { chromium } from 'playwright';

const BASE = 'https://do-ratings.com';
const SUPA = 'https://gpkiwcvzncikxgwyprhv.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwa2l3Y3Z6bmNpa3hnd3lwcmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDg1MDEsImV4cCI6MjA4OTIyNDUwMX0.ZdAxoGCvJgAZWcrDQLVbbSc3AeBmjCs0bnM_oIFWS3A';
const USER_ID = '12e7a22f-61e2-49df-b5fe-aab3dd471597';

async function supaRest(path) {
  const r = await fetch(`${SUPA}/rest/v1/${path}`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  });
  return r.json();
}

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
await p.goto(`${BASE}/ko/auth/login`);
await p.waitForTimeout(2000);
await p.fill('input[placeholder*="이메일"]', '83482@daum.net');
await p.fill('input[placeholder*="비밀번호"]', 'rkd140828!');
await p.locator('button:text-is("로그인")').first().click();
await p.waitForTimeout(6000);
await closeOverlays(p);
console.log('로그인:', p.url());

// === 컬렉션 생성 ===
console.log('\n=== 컬렉션 생성 ===');
await p.goto(`${BASE}/ko/collections`);
await p.waitForTimeout(3000);

// 생성 버튼 클릭
await p.evaluate(() => {
  for (const b of document.querySelectorAll('button'))
    if (b.textContent?.includes('컬렉션') || b.textContent?.includes('만들기')) { b.click(); break; }
});
await p.waitForTimeout(2000);

// 모달 내부 input에 입력 (evaluate로 z-index 우회)
await p.evaluate(() => {
  const modal = document.querySelector('.relative.bg-card');
  if (!modal) return;
  const inputs = modal.querySelectorAll('input[type="text"]');
  if (inputs.length > 0) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(inputs[0], 'PW 컬렉션 테스트');
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
  }
});
await p.waitForTimeout(500);

// 만들기 버튼 클릭
await p.evaluate(() => {
  const modal = document.querySelector('.relative.bg-card');
  if (!modal) return;
  for (const b of modal.querySelectorAll('button'))
    if (b.textContent?.includes('만들기') || b.textContent?.includes('생성')) { b.click(); break; }
});
await p.waitForTimeout(3000);

const collDb = await supaRest(`collections?user_id=eq.${USER_ID}&order=created_at.desc&limit=1&select=id,title`);
console.log('DB:', JSON.stringify(collDb?.[0]));
console.log(collDb?.length > 0 ? '✅ 컬렉션 생성 성공' : '❌ 컬렉션 생성 실패');

// === 카테고리 추가 요청 ===
console.log('\n=== 카테고리 추가 요청 ===');
await p.goto(`${BASE}/ko`);
await p.waitForTimeout(2000);
await closeOverlays(p);

// 카테고리 추가 요청 버튼
await p.evaluate(() => {
  for (const b of document.querySelectorAll('button'))
    if (b.textContent?.includes('카테고리 추가 요청')) { b.click(); break; }
});
await p.waitForTimeout(2000);

// 모달 input 입력
await p.evaluate(() => {
  const modals = document.querySelectorAll('.fixed.inset-0');
  for (const modal of modals) {
    const inputs = modal.querySelectorAll('input[type="text"]');
    for (const inp of inputs) {
      if (!inp.value) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(inp, 'PW 카테고리 요청');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        break;
      }
    }
  }
});
await p.waitForTimeout(500);

// 요청 버튼 클릭
await p.evaluate(() => {
  const modals = document.querySelectorAll('.fixed.inset-0');
  for (const modal of modals) {
    for (const b of modal.querySelectorAll('button'))
      if (b.textContent?.includes('요청') || b.textContent?.includes('제출')) { b.click(); return; }
  }
});
await p.waitForTimeout(3000);

const catDb = await supaRest('category_requests?order=created_at.desc&limit=1&select=id,name_ko');
console.log('DB:', JSON.stringify(catDb?.[0]));
console.log(catDb?.[0]?.name_ko?.includes('PW 카테고리') ? '✅ 카테고리 요청 성공' : '❌ 카테고리 요청 실패');

// === 좋아요 ===
console.log('\n=== 좋아요 ===');
await p.goto(`${BASE}/ko/subject/ae956145-1ef8-4e3e-90f8-cd5d0758fd53`);
await p.waitForTimeout(4000);

// TESTER2의 리뷰에서 좋아요 버튼 클릭
const helpfulBefore = await supaRest(`helpful_votes?user_id=eq.${USER_ID}&select=id`);
console.log('DB before:', helpfulBefore?.length, '건');

await p.evaluate(() => {
  const btns = document.querySelectorAll('button:not([disabled])');
  for (const btn of btns) {
    if (btn.innerHTML.includes('M14 9V5')) { btn.click(); return; }
  }
});
await p.waitForTimeout(2000);

const helpfulAfter = await supaRest(`helpful_votes?user_id=eq.${USER_ID}&select=id`);
console.log('DB after:', helpfulAfter?.length, '건');
console.log(helpfulAfter?.length > helpfulBefore?.length ? '✅ 좋아요 성공' : '❌ 좋아요 실패 (DB 변화 없음)');

await ctx.close();
await browser.close();
console.log('\n=== 완료 ===');
