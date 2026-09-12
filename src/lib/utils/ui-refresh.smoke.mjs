import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const base = process.env.UI_TEST_BASE_URL ?? 'http://127.0.0.1:3107'
const browser = await chromium.launch({ headless: true })
const results = []

async function checkPage(page, path, name, width) {
  await page.setViewportSize({ width, height: 900 })
  const response = await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded', timeout: 90000 })
  assert.equal(response?.status(), 200, `${path} status`)
  await page.locator('main').waitFor({ timeout: 30000 })
  if (path.includes('/explore')) {
    await page.waitForFunction(() => document.querySelector('a[href*="/ko/subject/"]') || document.body.innerText.includes('일치하는 대상이 없어요'), null, { timeout: 30000 })
  }
  await page.waitForTimeout(700)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  const text = await page.locator('body').innerText()
  const screenshot = `docs/ux-game-refresh-20260912/${name}-${width}.png`
  await page.screenshot({ path: screenshot, fullPage: true })
  assert.equal(overflow, false, `${path} horizontal overflow`)
  if (text.includes('???')) {
    const index = text.indexOf('???')
    throw new Error(`${path} contains mojibake placeholder near: ${JSON.stringify(text.slice(Math.max(0, index - 80), index + 120))}`)
  }
  results.push({ path, width, overflow, screenshot })
}

try {
  const page = await browser.newPage({ reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*', route => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort())

  await checkPage(page, '/ko', 'astra-home-ko', 375)
  await checkPage(page, '/ko/explore', 'astra-explore-ko', 375)
  const subjectHref = await page.locator('a[href*="/ko/subject/"]').first().getAttribute('href')
  assert.ok(subjectHref, 'subject link exists')

  const categoryHref = await page.locator('a[href*="/ko/category/"]').first().getAttribute('href')
  assert.ok(categoryHref, 'category link exists')
  await checkPage(page, categoryHref, 'astra-category-ko', 375)

  await checkPage(page, subjectHref, 'astra-subject-ko', 375)

  const subjectId = subjectHref.split('/').filter(Boolean).at(-1)
  assert.ok(subjectId, 'subject id exists')
  await checkPage(page, `/ko/write/${subjectId}`, 'astra-write-ko', 375)

  await checkPage(page, '/en', 'astra-home-en', 1440)
  assert.equal(errors.length, 0, JSON.stringify(errors))
  console.log(JSON.stringify({ results, browserErrors: errors }, null, 2))
} finally {
  await browser.close()
}
process.exit(0)
