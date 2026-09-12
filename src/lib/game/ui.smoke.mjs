import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const base = process.env.GAME_TEST_BASE_URL ?? 'http://127.0.0.1:3107'
const browser = await chromium.launch({ headless: true })
const results = []
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*', route => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort())
  for (const [locale, width, dark] of [['ko', 375, false], ['en', 320, false], ['en', 414, true], ['ko', 768, false], ['en', 1440, false]]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`${base}/${locale}/play`, { waitUntil: 'domcontentloaded', timeout: 90000 })
    await page.locator('#journey-heading').waitFor()
    await page.waitForTimeout(800)
    if (dark) await page.evaluate(() => document.documentElement.classList.add('dark'))
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    assert.equal(overflow, false, `${locale} ${width}: horizontal overflow`)
    const filename = `docs/ux-game-refresh-20260912/astra-game-${locale}-${width}${dark ? '-dark' : ''}.png`
    await page.screenshot({ path: filename, fullPage: true })
    results.push({ locale, width, dark, overflow, screenshot: filename })
  }
  await page.close()

  assert.equal(errors.length, 0, JSON.stringify(errors))
  console.log(JSON.stringify({ results, browserErrors: errors }, null, 2))
} finally {
  await browser.close()
}
process.exit(0)
