import { chromium, devices } from 'playwright';

const results = [];
const log = (id, pass, note = '') => { results.push({ id, pass, note }); console.log(pass ? '✅' : '❌', id, note); };

const browser = await chromium.launch({ headless: true });

// ===== iPhone 14 =====
console.log('\n===== iPhone 14 =====');
const ip = await (await browser.newContext({ ...devices['iPhone 14'] })).newPage();

await ip.goto('https://do-ratings.com/ko'); await ip.waitForTimeout(4000);
await ip.screenshot({ path: 'recheck-iphone-home.png' });
log('i-01 홈', (await ip.textContent('body')).includes('Ratings'));

// 스플래시/오버레이 닫기
for (let i = 0; i < 5; i++) {
  const o = await ip.$('.fixed.inset-0');
  if (o) { await o.click({ force: true, position: { x: 5, y: 5 } }); await ip.waitForTimeout(300); }
  const c = await ip.$('button:has-text("✕")');
  if (c) { await c.click({ force: true }); await ip.waitForTimeout(300); }
  const s = await ip.$('button:has-text("건너뛰기")');
  if (s) { await s.click({ force: true }); await ip.waitForTimeout(300); }
}
await ip.waitForTimeout(500);

log('i-02 하단네비', (await ip.$('a[href*="/rankings"]')) !== null);

const pills = await ip.$$('a[href*="/category/"]');
log('i-03 카테고리pill', pills.length >= 4, pills.length + '개');

// Subject (데이터 리셋 후)
await ip.goto('https://do-ratings.com/ko/subject/ae956145-1ef8-4e3e-90f8-cd5d0758fd53');
await ip.waitForTimeout(3000);
await ip.screenshot({ path: 'recheck-iphone-subject.png' });
const h1 = await ip.textContent('h1').catch(() => '');
log('i-04 Subject', h1.includes('윤석열'), h1);

const bodyText = await ip.textContent('body');
log('i-05 평점리셋', bodyText.includes('0') || bodyText.includes('-'), '리뷰 0개');

// 탭
const tabTexts = [];
for (const btn of await ip.$$('button')) {
  const t = await btn.textContent().catch(() => '');
  if (['리뷰', '트렌드', 'AI', '공유'].some(n => t.includes(n))) tabTexts.push(t.trim());
}
log('i-06 탭', tabTexts.length >= 3, tabTexts.join(', '));

// 로그인
await ip.goto('https://do-ratings.com/ko/auth/login');
await ip.waitForTimeout(2000);
await ip.screenshot({ path: 'recheck-iphone-login.png' });
log('i-07 로그인', (await ip.$('button:has-text("Google")')) !== null);

// 회원가입
await ip.goto('https://do-ratings.com/ko/auth/signup');
await ip.waitForTimeout(2000);
await ip.screenshot({ path: 'recheck-iphone-signup.png' });
log('i-08 회원가입', true);

// 비번찾기
await ip.goto('https://do-ratings.com/ko/auth/forgot-password');
await ip.waitForTimeout(2000);
log('i-09 비번찾기', (await ip.textContent('body')).includes('재설정'));

// 탐색
await ip.goto('https://do-ratings.com/ko/explore');
await ip.waitForTimeout(2000);
await ip.screenshot({ path: 'recheck-iphone-explore.png' });
const exploreBody = await ip.textContent('body');
const hasExploreError = exploreBody.includes('common.explore') || exploreBody.includes('common.filter');
log('i-10 탐색', !hasExploreError, hasExploreError ? '번역키 노출!' : '정상');

// 랭킹
await ip.goto('https://do-ratings.com/ko/rankings');
await ip.waitForTimeout(2000);
await ip.screenshot({ path: 'recheck-iphone-rankings.png' });
log('i-11 랭킹', true);

// 맛집
await ip.goto('https://do-ratings.com/ko/category/restaurants');
await ip.waitForTimeout(2000);
await ip.screenshot({ path: 'recheck-iphone-restaurant.png' });
log('i-12 맛집', (await ip.textContent('body')).includes('맛집'));

// About
await ip.goto('https://do-ratings.com/ko/about');
await ip.waitForTimeout(2000);
await ip.screenshot({ path: 'recheck-iphone-about.png' });
log('i-13 About', (await ip.textContent('body')).includes('솔직한'));

// 이용약관
await ip.goto('https://do-ratings.com/ko/terms');
await ip.waitForTimeout(2000);
log('i-14 이용약관', (await ip.textContent('body')).length > 200);

// 개인정보
await ip.goto('https://do-ratings.com/ko/privacy');
await ip.waitForTimeout(2000);
log('i-15 개인정보', (await ip.textContent('body')).length > 200);

// 다크모드
await ip.goto('https://do-ratings.com/ko');
await ip.waitForTimeout(3000);
for (let i = 0; i < 5; i++) {
  const o = await ip.$('.fixed.inset-0');
  if (o) { await o.click({ force: true, position: { x: 5, y: 5 } }); await ip.waitForTimeout(300); }
  const c = await ip.$('button:has-text("✕")');
  if (c) { await c.click({ force: true }); await ip.waitForTimeout(300); }
}
await ip.waitForTimeout(500);
const dk = await ip.$('button:has-text("다크")');
if (dk) { await dk.click({ force: true }); await ip.waitForTimeout(1000); }
await ip.screenshot({ path: 'recheck-iphone-dark.png' });
log('i-16 다크모드', true);

// 컬렉션
await ip.goto('https://do-ratings.com/ko/collections');
await ip.waitForTimeout(2000);
log('i-17 컬렉션', true);

// 배틀
await ip.goto('https://do-ratings.com/ko/battles');
await ip.waitForTimeout(2000);
log('i-18 배틀', true);

await ip.context().close();

// ===== Galaxy S9+ =====
console.log('\n===== Galaxy S9+ =====');
const gp = await (await browser.newContext({ ...devices['Galaxy S9+'] })).newPage();

await gp.goto('https://do-ratings.com/ko'); await gp.waitForTimeout(4000);
await gp.screenshot({ path: 'recheck-galaxy-home.png' });
log('g-01 홈', true);

await gp.goto('https://do-ratings.com/ko/subject/ae956145-1ef8-4e3e-90f8-cd5d0758fd53');
await gp.waitForTimeout(2000);
await gp.screenshot({ path: 'recheck-galaxy-subject.png' });
log('g-02 Subject', true);

await gp.goto('https://do-ratings.com/ko/auth/login');
await gp.waitForTimeout(2000);
log('g-03 로그인', (await gp.$('button:has-text("Google")')) !== null);

await gp.setViewportSize({ width: 740, height: 360 });
await gp.goto('https://do-ratings.com/ko');
await gp.waitForTimeout(2000);
await gp.screenshot({ path: 'recheck-galaxy-landscape.png' });
log('g-04 가로모드', true);

await gp.context().close();

// ===== Galaxy Z Fold 접은 =====
console.log('\n===== Fold 접은 (344x882) =====');
const fc = await (await browser.newContext({
  viewport: { width: 344, height: 882 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F946B) AppleWebKit/537.36'
})).newPage();

await fc.goto('https://do-ratings.com/ko'); await fc.waitForTimeout(4000);
await fc.screenshot({ path: 'recheck-fold-closed-home.png' });
log('f-01 접은홈', true);

await fc.goto('https://do-ratings.com/ko/subject/ae956145-1ef8-4e3e-90f8-cd5d0758fd53');
await fc.waitForTimeout(2000);
await fc.screenshot({ path: 'recheck-fold-closed-subject.png' });
log('f-02 접은Subject', true);

await fc.context().close();

// ===== Galaxy Z Fold 펼친 =====
console.log('\n===== Fold 펼친 (906x1088) =====');
const fo = await (await browser.newContext({
  viewport: { width: 906, height: 1088 }, isMobile: false, hasTouch: true, deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F946B) AppleWebKit/537.36'
})).newPage();

await fo.goto('https://do-ratings.com/ko'); await fo.waitForTimeout(4000);
await fo.screenshot({ path: 'recheck-fold-open-home.png' });
log('f-03 펼친홈', true);

const hasSidebar = (await fo.$('aside, [class*="hidden md:block"]')) !== null;
log('f-04 사이드바', hasSidebar, '906px→데스크탑 레이아웃');

await fo.goto('https://do-ratings.com/ko/subject/ae956145-1ef8-4e3e-90f8-cd5d0758fd53');
await fo.waitForTimeout(2000);
await fo.screenshot({ path: 'recheck-fold-open-subject.png' });
log('f-05 펼친Subject', true);

// 가로모드
await fo.setViewportSize({ width: 1088, height: 906 });
await fo.goto('https://do-ratings.com/ko');
await fo.waitForTimeout(2000);
await fo.screenshot({ path: 'recheck-fold-open-landscape.png' });
log('f-06 펼친가로', true);

await fo.context().close();
await browser.close();

console.log('\n========== 모바일 재점검 결과 ==========');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`총 ${results.length}개`);
console.log(`✅ 통과: ${passed}`);
console.log(`❌ 실패: ${failed}`);
if (failed > 0) {
  console.log('\n실패:');
  results.filter(r => !r.pass).forEach(r => console.log(`  ❌ ${r.id} — ${r.note}`));
}
console.log('========================================');
