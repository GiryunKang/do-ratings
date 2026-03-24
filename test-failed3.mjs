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
console.log('=== 로그인 ===');
await p.goto(`${BASE}/ko/auth/login`);
await p.waitForTimeout(2000);
await p.fill('input[placeholder*="이메일"]', '83482@daum.net');
await p.fill('input[placeholder*="비밀번호"]', 'rkd140828!');
await p.locator('button:text-is("로그인")').first().click();
await p.waitForTimeout(6000);
await closeOverlays(p);
console.log('로그인 완료:', p.url());

// ===========================
// 1. 댓글 작성 (page.type 사용)
// ===========================
console.log('\n=== 1. 댓글 작성 ===');
await p.goto(`${BASE}/ko/subject/ae956145-1ef8-4e3e-90f8-cd5d0758fd53`);
await p.waitForTimeout(4000);

// 댓글 버튼 찾아서 클릭
const commentBtnLocator = p.locator('button').filter({ hasText: '댓글' }).first();
if (await commentBtnLocator.isVisible({ timeout: 3000 }).catch(() => false)) {
  await commentBtnLocator.click();
  await p.waitForTimeout(2000);
  console.log('  댓글 섹션 열림');

  // textarea 찾기 — locator로
  const textareas = p.locator('textarea');
  const taCount = await textareas.count();
  console.log('  textarea 개수:', taCount);

  if (taCount > 0) {
    // 마지막 textarea가 댓글 입력란일 가능성 높음
    const commentArea = textareas.last();
    await commentArea.click();
    await p.waitForTimeout(300);

    // page.type으로 실제 키보드 입력 (React state 확실히 반영)
    const commentText = `댓글테스트 ${Date.now()}`;
    await commentArea.type(commentText, { delay: 30 });
    await p.waitForTimeout(500);

    // 입력 확인
    const typedVal = await commentArea.inputValue();
    console.log('  입력된 값:', typedVal);

    // Enter로 제출
    await commentArea.press('Enter');
    await p.waitForTimeout(3000);

    // 화면에서 확인
    const bodyText = await p.textContent('body');
    const commentVisible = bodyText.includes(commentText);
    console.log('  화면 표시:', commentVisible);

    // DB 확인
    const commentDb = await supaRest('review_comments?order=created_at.desc&limit=1&select=content');
    const dbMatch = commentDb?.[0]?.content?.includes('댓글테스트');
    console.log('  DB 확인:', dbMatch, '내용:', commentDb?.[0]?.content?.substring(0, 30));

    console.log(commentVisible || dbMatch ? '✅ 댓글 작성 성공' : '❌ 댓글 작성 실패');

    if (!commentVisible && !dbMatch) {
      // 등록 버튼으로 시도
      console.log('  Enter 실패 — 등록 버튼 시도');
      await commentArea.click();
      await commentArea.type('등록버튼테스트', { delay: 30 });
      await p.waitForTimeout(300);

      const submitBtn = p.locator('button').filter({ hasText: '등록' }).last();
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitBtn.click();
        await p.waitForTimeout(3000);
        const db2 = await supaRest('review_comments?order=created_at.desc&limit=1&select=content');
        console.log('  등록 버튼 DB:', db2?.[0]?.content?.substring(0, 30));
        console.log(db2?.[0]?.content?.includes('등록버튼') ? '✅ 등록 버튼으로 성공' : '❌ 등록 버튼도 실패');
      } else {
        console.log('  등록 버튼 미발견');
      }
    }
  } else {
    console.log('  ❌ textarea 없음 — 로그인 필요?');
  }
} else {
  console.log('  ❌ 댓글 버튼 미발견 (리뷰가 없을 수 있음)');
  // 스크린샷
  await p.screenshot({ path: 'debug-comment-btn.png' });
}

// ===========================
// 2. 컬렉션 생성 (page.type 사용)
// ===========================
console.log('\n=== 2. 컬렉션 생성 ===');
await p.goto(`${BASE}/ko/collections`);
await p.waitForTimeout(3000);

// 생성 버튼 찾기
const collBtn = p.locator('button').filter({ hasText: /컬렉션|만들기|Create/ }).first();
if (await collBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  await collBtn.click();
  await p.waitForTimeout(2000);
  console.log('  모달 열림');

  // 모달 내 입력란
  const modalInputs = p.locator('input[type="text"]');
  const inputCount = await modalInputs.count();
  console.log('  입력란 개수:', inputCount);

  if (inputCount > 0) {
    // 모달 내 입력란 — 검색바가 아닌 것을 찾기
    // bg-black/40 오버레이 뒤의 모달 내 input을 직접 타겟
    const koInput = p.locator('.fixed input[type="text"], [role="dialog"] input[type="text"]').first();
    await koInput.click({ force: true });
    await koInput.type('Playwright 컬렉션', { delay: 30 });
    await p.waitForTimeout(300);

    const typedVal = await koInput.inputValue();
    console.log('  입력된 값:', typedVal);

    // 만들기/생성 버튼
    const createBtn = p.locator('button').filter({ hasText: /만들기|생성|Create|추가/ }).last();
    if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createBtn.click();
      await p.waitForTimeout(3000);

      // DB 확인
      const collDb = await supaRest(`collections?user_id=eq.${USER_ID}&order=created_at.desc&limit=1&select=id,title`);
      const created = collDb?.length > 0;
      console.log('  DB:', JSON.stringify(collDb?.[0]));
      console.log(created ? '✅ 컬렉션 생성 성공' : '❌ 컬렉션 생성 실패');
    } else {
      console.log('  ❌ 만들기 버튼 미발견');
      await p.screenshot({ path: 'debug-coll-modal.png' });
    }
  } else {
    console.log('  ❌ 입력란 없음');
  }
} else {
  console.log('  ❌ 컬렉션 생성 버튼 미발견');
  await p.screenshot({ path: 'debug-coll-page.png' });
}

// ===========================
// 3. 카테고리 추가 요청 (page.type 사용)
// ===========================
console.log('\n=== 3. 카테고리 추가 요청 ===');
await p.goto(`${BASE}/ko`);
await p.waitForTimeout(2000);
await closeOverlays(p);

const catReqBtn = p.locator('button').filter({ hasText: '카테고리 추가 요청' }).first();
if (await catReqBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  await catReqBtn.click();
  await p.waitForTimeout(2000);
  console.log('  모달 열림');

  // 입력란 — 한국어 이름 (첫 번째 빈 input)
  const inputs = p.locator('input[type="text"]');
  const count = await inputs.count();
  console.log('  입력란 개수:', count);

  let filled = false;
  for (let i = 0; i < count; i++) {
    const inp = inputs.nth(i);
    const val = await inp.inputValue();
    if (!val) {
      await inp.click();
      await inp.type('PW 카테고리 테스트', { delay: 30 });
      console.log('  입력:', await inp.inputValue());
      filled = true;
      break;
    }
  }

  if (filled) {
    await p.waitForTimeout(300);

    // 요청/제출 버튼
    const submitBtn = p.locator('button').filter({ hasText: /요청|제출|Submit|Request/ }).first();
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitBtn.click();
      await p.waitForTimeout(3000);

      // DB 확인
      const catDb = await supaRest('category_requests?order=created_at.desc&limit=1&select=id,name_ko');
      const created = catDb?.[0]?.name_ko?.includes('PW 카테고리');
      console.log('  DB:', JSON.stringify(catDb?.[0]));
      console.log(created ? '✅ 카테고리 요청 성공' : '❌ 카테고리 요청 실패');
    } else {
      console.log('  ❌ 제출 버튼 미발견');
      await p.screenshot({ path: 'debug-catreq-modal.png' });
    }
  } else {
    console.log('  ❌ 빈 입력란 없음');
  }
} else {
  console.log('  ❌ 카테고리 요청 버튼 미발견');
}

// ===========================
// 4. 좋아요 재테스트 (TESTER2 리뷰에)
// ===========================
console.log('\n=== 4. 좋아요 재테스트 ===');
await p.goto(`${BASE}/ko/subject/ae956145-1ef8-4e3e-90f8-cd5d0758fd53`);
await p.waitForTimeout(4000);

// helpful 버튼 찾기 — disabled가 아닌 것
const helpfulBtns = p.locator('button:not([disabled])');
const hCount = await helpfulBtns.count();
let helpfulClicked = false;

for (let i = 0; i < hCount; i++) {
  const btn = helpfulBtns.nth(i);
  const html = await btn.innerHTML().catch(() => '');
  // HelpfulButton의 SVG path 확인
  if (html.includes('M14 9V5') || html.includes('thumb')) {
    await btn.click();
    helpfulClicked = true;
    console.log('  좋아요 버튼 클릭');
    await p.waitForTimeout(2000);
    break;
  }
}

if (helpfulClicked) {
  const helpDb = await supaRest(`helpful_votes?user_id=eq.${USER_ID}&order=created_at.desc&limit=1&select=*`);
  console.log('  DB helpful_votes:', helpDb?.length, '건');
  console.log(helpDb?.length > 0 ? '✅ 좋아요 성공' : '❌ 좋아요 DB 미반영');
} else {
  console.log('  좋아요 버튼 못 찾음 — 다른 방법 시도');
  // evaluate로 첫 번째 non-disabled helpful 버튼 클릭
  await p.evaluate(() => {
    const btns = document.querySelectorAll('button:not([disabled])');
    for (const btn of btns) {
      if (btn.innerHTML.includes('M14 9V5')) {
        btn.click();
        return;
      }
    }
  });
  await p.waitForTimeout(2000);
  const helpDb2 = await supaRest(`helpful_votes?user_id=eq.${USER_ID}&order=created_at.desc&limit=1&select=*`);
  console.log('  DB helpful_votes:', helpDb2?.length, '건');
  console.log(helpDb2?.length > 0 ? '✅ 좋아요 성공 (evaluate)' : '❌ 좋아요 실패');
}

await ctx.close();
await browser.close();
console.log('\n=== 완료 ===');
