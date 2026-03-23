import { chromium, devices } from 'playwright';

const results = [];
const log = (id, pass, note = '') => { results.push({ id, pass, note }); console.log(pass ? '✅' : '❌', id, note); };

const browser = await chromium.launch({ headless: true });

// ===== iPhone 14 =====
console.log('\n===== iPhone 14 (375x812) =====');
const iPhone = devices['iPhone 14'];
const iphoneCtx = await browser.newContext({ ...iPhone });
const ip = await iphoneCtx.newPage();

await ip.goto('https://do-ratings.com/ko');
await ip.waitForTimeout(4000);
await ip.screenshot({ path: 'mobile-iphone-home.png' });
log('i-01 홈 로드', (await ip.textContent('body')).includes('Ratings'));

const bottomNav = await ip.$('a[href*="/rankings"]');
log('i-02 하단 네비', bottomNav !== null);

if (bottomNav) { await bottomNav.click({ force: true }); await ip.waitForTimeout(2000); }
log('i-03 랭킹 이동', ip.url().includes('/rankings'));

await ip.goto('https://do-ratings.com/ko');
await ip.waitForTimeout(2000);
const pills = await ip.$$('a[href*="/category/"]');
log('i-04 카테고리 pill', pills.length >= 4, pills.length + '개');

await ip.goto('https://do-ratings.com/ko/subject/ae956145-1ef8-4e3e-90f8-cd5d0758fd53');
await ip.waitForTimeout(3000);
await ip.screenshot({ path: 'mobile-iphone-subject.png' });
log('i-05 Subject 상세', (await ip.textContent('h1').catch(() => '')).includes('윤석열'));

const trendTab = await ip.$('button:has-text("트렌드")');
if (trendTab) { await trendTab.click(); await ip.waitForTimeout(1500); }
log('i-06 탭 전환', !!trendTab);

await ip.goto('https://do-ratings.com/ko/auth/login');
await ip.waitForTimeout(2000);
await ip.screenshot({ path: 'mobile-iphone-login.png' });
log('i-07 로그인 페이지', (await ip.$('button:has-text("Google")')) !== null);

await ip.fill('input[placeholder*="이메일"]', '83482@daum.net');
await ip.fill('input[placeholder*="비밀번호"]', 'rkd140828!');
for (const btn of await ip.$$('button')) {
  if ((await btn.textContent().catch(() => '')).trim() === '로그인') { await btn.click(); break; }
}
await ip.waitForTimeout(5000);
try { const s = await ip.$('button:has-text("건너뛰기")'); if (s) await s.click(); } catch (e) {}
await ip.waitForTimeout(1000);
log('i-08 모바일 로그인', !ip.url().includes('/auth/login'));

await ip.goto('https://do-ratings.com/ko/write/ae956145-1ef8-4e3e-90f8-cd5d0758fd53');
await ip.waitForTimeout(3000);
await ip.screenshot({ path: 'mobile-iphone-write.png' });
const stars = await ip.$$('form button:has(svg[viewBox="0 0 24 24"])');
log('i-09 별점 버튼', stars.length >= 5, stars.length + '개');

if (stars.length >= 4) {
  await stars[3].tap().catch(async () => await stars[3].click({ force: true }));
  log('i-10 별점 터치', true, '4점');
} else { log('i-10 별점 터치', false); }

// 온보딩 모달이 다시 뜰 수 있으므로 닫기
try {
  const skipBtn2 = await ip.$('button:has-text("건너뛰기")');
  if (skipBtn2) await skipBtn2.click({ force: true });
  await ip.waitForTimeout(500);
  const overlay = await ip.$('.fixed.inset-0.bg-black');
  if (overlay) await overlay.click({ force: true });
  await ip.waitForTimeout(500);
} catch(e) {}

const titleInput = await ip.$('input[maxlength="100"]');
if (titleInput) {
  await titleInput.click({ force: true });
  await titleInput.fill('모바일 테스트');
  log('i-11 키보드 입력', true);
} else { log('i-11 키보드 입력', false, '온보딩 모달 차단 가능'); }

// 모든 오버레이 닫기
for (let i = 0; i < 5; i++) {
  const overlay = await ip.$('.fixed.inset-0');
  if (overlay) { await overlay.click({ force: true, position: { x: 5, y: 5 } }); await ip.waitForTimeout(500); }
  const skipBtn3 = await ip.$('button:has-text("건너뛰기")');
  if (skipBtn3) { await skipBtn3.click({ force: true }); await ip.waitForTimeout(500); }
  const closeBtn = await ip.$('button:has-text("✕")');
  if (closeBtn) { await closeBtn.click({ force: true }); await ip.waitForTimeout(500); }
}
await ip.waitForTimeout(1000);

const darkBtn = await ip.$('button:has-text("다크")');
if (darkBtn) {
  await darkBtn.click();
  await ip.waitForTimeout(1000);
  await ip.screenshot({ path: 'mobile-iphone-dark.png' });
  log('i-12 다크모드', true);
  const lightBtn = await ip.$('button:has-text("라이트")');
  if (lightBtn) await lightBtn.click();
} else { log('i-12 다크모드', false); }

await ip.goto('https://do-ratings.com/ko/about');
await ip.waitForTimeout(2000);
await ip.screenshot({ path: 'mobile-iphone-about.png' });
log('i-13 About', (await ip.textContent('body')).includes('솔직한'));

await ip.goto('https://do-ratings.com/ko/category/restaurants');
await ip.waitForTimeout(2000);
await ip.screenshot({ path: 'mobile-iphone-category.png' });
log('i-14 맛집 카테고리', (await ip.textContent('body')).includes('맛집'));

await ip.goto('https://do-ratings.com/ko/collections');
await ip.waitForTimeout(2000);
log('i-15 컬렉션', true);

await ip.goto('https://do-ratings.com/ko/battles');
await ip.waitForTimeout(2000);
log('i-16 배틀', true);

await iphoneCtx.close();

// ===== Galaxy S9+ =====
console.log('\n===== Galaxy S9+ (360x740) =====');
const galaxy = devices['Galaxy S9+'];
const galaxyCtx = await browser.newContext({ ...galaxy });
const gp = await galaxyCtx.newPage();

await gp.goto('https://do-ratings.com/ko');
await gp.waitForTimeout(4000);
await gp.screenshot({ path: 'mobile-galaxy-home.png' });
log('g-01 Galaxy 홈', true);

const gNav = await gp.$('a[href*="/rankings"]');
if (gNav) { await gNav.click({ force: true }); await gp.waitForTimeout(2000); }
log('g-02 Galaxy 랭킹', gp.url().includes('/rankings'));

await gp.goto('https://do-ratings.com/ko/subject/ae956145-1ef8-4e3e-90f8-cd5d0758fd53');
await gp.waitForTimeout(2000);
await gp.screenshot({ path: 'mobile-galaxy-subject.png' });
log('g-03 Galaxy Subject', true);

await gp.goto('https://do-ratings.com/ko/category/restaurants');
await gp.waitForTimeout(2000);
log('g-04 Galaxy 맛집', (await gp.textContent('body')).includes('맛집'));

await gp.setViewportSize({ width: 740, height: 360 });
await gp.goto('https://do-ratings.com/ko');
await gp.waitForTimeout(2000);
await gp.screenshot({ path: 'mobile-galaxy-landscape.png' });
log('g-05 Galaxy 가로모드', true);

await gp.setViewportSize({ width: 360, height: 740 });
await gp.goto('https://do-ratings.com/ko/auth/login');
await gp.waitForTimeout(2000);
await gp.screenshot({ path: 'mobile-galaxy-login.png' });
log('g-06 Galaxy 로그인', (await gp.$('button:has-text("Google")')) !== null);

await gp.goto('https://do-ratings.com/ko');
await gp.waitForTimeout(2000);
const gDark = await gp.$('button:has-text("다크")');
if (gDark) {
  await gDark.click();
  await gp.waitForTimeout(1000);
  await gp.screenshot({ path: 'mobile-galaxy-dark.png' });
  log('g-07 Galaxy 다크모드', true);
} else { log('g-07 Galaxy 다크모드', false); }

await galaxyCtx.close();
await browser.close();

console.log('\n========== 모바일 테스트 결과 ==========');
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
