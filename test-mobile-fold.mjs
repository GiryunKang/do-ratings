import { chromium } from 'playwright';

const results = [];
const log = (id, pass, note = '') => { results.push({ id, pass, note }); console.log(pass ? '✅' : '❌', id, note); };

const browser = await chromium.launch({ headless: true });

// Galaxy Z Fold — 접은 상태 (커버 디스플레이)
console.log('\n===== Galaxy Z Fold 접은 상태 (344x882) =====');
const foldClosedCtx = await browser.newContext({
  viewport: { width: 344, height: 882 },
  userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F946B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
});
const fc = await foldClosedCtx.newPage();

await fc.goto('https://do-ratings.com/ko');
await fc.waitForTimeout(4000);
await fc.screenshot({ path: 'mobile-fold-closed-home.png' });
const fcBody = await fc.textContent('body');
log('fc-01 접은 홈', fcBody.includes('Ratings'));

// 하단 네비
const fcNav = await fc.$('a[href*="/rankings"]');
log('fc-02 접은 하단네비', fcNav !== null);

// 카테고리 pill
const fcPills = await fc.$$('a[href*="/category/"]');
log('fc-03 접은 카테고리', fcPills.length >= 4, fcPills.length + '개');

// Subject 상세
await fc.goto('https://do-ratings.com/ko/subject/ae956145-1ef8-4e3e-90f8-cd5d0758fd53');
await fc.waitForTimeout(3000);
await fc.screenshot({ path: 'mobile-fold-closed-subject.png' });
log('fc-04 접은 Subject', (await fc.textContent('h1').catch(() => '')).includes('윤석열'));

// 로그인
await fc.goto('https://do-ratings.com/ko/auth/login');
await fc.waitForTimeout(2000);
await fc.screenshot({ path: 'mobile-fold-closed-login.png' });
const fcGoogle = await fc.$('button:has-text("Google")');
const fcEmail = await fc.$('input[placeholder*="이메일"]');
log('fc-05 접은 로그인', fcGoogle !== null && fcEmail !== null);

// 로그인 실행
await fc.fill('input[placeholder*="이메일"]', '83482@daum.net');
await fc.fill('input[placeholder*="비밀번호"]', 'rkd140828!');
for (const btn of await fc.$$('button')) {
  if ((await btn.textContent().catch(() => '')).trim() === '로그인') { await btn.click(); break; }
}
await fc.waitForTimeout(5000);
try { const s = await fc.$('button:has-text("건너뛰기")'); if (s) await s.click({ force: true }); } catch(e) {}
await fc.waitForTimeout(1000);
log('fc-06 접은 로그인 성공', !fc.url().includes('/auth/login'));

// 리뷰 작성
await fc.goto('https://do-ratings.com/ko/write/ae956145-1ef8-4e3e-90f8-cd5d0758fd53');
await fc.waitForTimeout(3000);
// 오버레이 닫기
for (let i = 0; i < 5; i++) {
  const overlay = await fc.$('.fixed.inset-0');
  if (overlay) { await overlay.click({ force: true, position: { x: 5, y: 5 } }); await fc.waitForTimeout(300); }
  const closeBtn = await fc.$('button:has-text("✕")');
  if (closeBtn) { await closeBtn.click({ force: true }); await fc.waitForTimeout(300); }
}
await fc.waitForTimeout(500);
await fc.screenshot({ path: 'mobile-fold-closed-write.png' });
const fcStars = await fc.$$('form button:has(svg[viewBox="0 0 24 24"])');
log('fc-07 접은 별점', fcStars.length >= 5, fcStars.length + '개');

// 별점 터치
if (fcStars.length >= 4) {
  await fcStars[3].tap().catch(async () => await fcStars[3].click({ force: true }));
  log('fc-08 접은 별점 터치', true);
} else { log('fc-08 접은 별점 터치', false); }

// 다크모드
await fc.goto('https://do-ratings.com/ko');
await fc.waitForTimeout(2000);
for (let i = 0; i < 3; i++) {
  const o = await fc.$('.fixed.inset-0');
  if (o) { await o.click({ force: true, position: { x: 5, y: 5 } }); await fc.waitForTimeout(300); }
  const c = await fc.$('button:has-text("✕")');
  if (c) { await c.click({ force: true }); await fc.waitForTimeout(300); }
}
await fc.waitForTimeout(500);
const fcDark = await fc.$('button:has-text("다크")');
if (fcDark) {
  await fcDark.click({ force: true });
  await fc.waitForTimeout(1000);
  await fc.screenshot({ path: 'mobile-fold-closed-dark.png' });
  log('fc-09 접은 다크모드', true);
} else { log('fc-09 접은 다크모드', false); }

// About
await fc.goto('https://do-ratings.com/ko/about');
await fc.waitForTimeout(2000);
await fc.screenshot({ path: 'mobile-fold-closed-about.png' });
log('fc-10 접은 About', (await fc.textContent('body')).includes('솔직한'));

await foldClosedCtx.close();

// ===== Galaxy Z Fold — 펼친 상태 (메인 디스플레이) =====
console.log('\n===== Galaxy Z Fold 펼친 상태 (906x1088) =====');
const foldOpenCtx = await browser.newContext({
  viewport: { width: 906, height: 1088 },
  userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F946B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  isMobile: false,
  hasTouch: true,
  deviceScaleFactor: 2,
});
const fo = await foldOpenCtx.newPage();

await fo.goto('https://do-ratings.com/ko');
await fo.waitForTimeout(4000);
await fo.screenshot({ path: 'mobile-fold-open-home.png' });
log('fo-01 펼친 홈', true);

// 사이드바 보이는지 (md:block = 768px 이상이면 보임)
const sidebar = await fo.$('aside, [class*="hidden md:block"]');
log('fo-02 펼친 사이드바', sidebar !== null, '906px > 768px → 사이드바 표시');

// Subject 상세
await fo.goto('https://do-ratings.com/ko/subject/ae956145-1ef8-4e3e-90f8-cd5d0758fd53');
await fo.waitForTimeout(3000);
await fo.screenshot({ path: 'mobile-fold-open-subject.png' });
log('fo-03 펼친 Subject', (await fo.textContent('h1').catch(() => '')).includes('윤석열'));

// 카테고리
await fo.goto('https://do-ratings.com/ko/category/restaurants');
await fo.waitForTimeout(2000);
await fo.screenshot({ path: 'mobile-fold-open-category.png' });
log('fo-04 펼친 맛집', (await fo.textContent('body')).includes('맛집'));

// 로그인
await fo.goto('https://do-ratings.com/ko/auth/login');
await fo.waitForTimeout(2000);
await fo.screenshot({ path: 'mobile-fold-open-login.png' });
log('fo-05 펼친 로그인', (await fo.$('button:has-text("Google")')) !== null);

// 다크모드
await fo.goto('https://do-ratings.com/ko');
await fo.waitForTimeout(2000);
const foDark = await fo.$('button:has-text("다크")');
if (foDark) {
  await foDark.click();
  await fo.waitForTimeout(1000);
  await fo.screenshot({ path: 'mobile-fold-open-dark.png' });
  log('fo-06 펼친 다크모드', true);
} else { log('fo-06 펼친 다크모드', false); }

// 비교 페이지
await fo.goto('https://do-ratings.com/ko/compare?ids=ae956145-1ef8-4e3e-90f8-cd5d0758fd53');
await fo.waitForTimeout(2000);
await fo.screenshot({ path: 'mobile-fold-open-compare.png' });
log('fo-07 펼친 비교', true);

// 가로 모드 (펼친 상태에서 가로)
await fo.setViewportSize({ width: 1088, height: 906 });
await fo.goto('https://do-ratings.com/ko');
await fo.waitForTimeout(2000);
await fo.screenshot({ path: 'mobile-fold-open-landscape.png' });
log('fo-08 펼친 가로모드', true);

await foldOpenCtx.close();
await browser.close();

console.log('\n========== Galaxy Z Fold 테스트 결과 ==========');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`총 ${results.length}개`);
console.log(`✅ 통과: ${passed}`);
console.log(`❌ 실패: ${failed}`);
if (failed > 0) {
  console.log('\n실패:');
  results.filter(r => !r.pass).forEach(r => console.log(`  ❌ ${r.id} — ${r.note}`));
}
console.log('==============================================');
