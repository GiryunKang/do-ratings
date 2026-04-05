import { chromium } from 'playwright'

const BASE = 'http://localhost:3001'
const issues = []

function log(msg) { console.log(`[QA] ${msg}`) }
function issue(severity, page, desc) {
  issues.push({ severity, page, desc })
  console.log(`[${severity}] ${page}: ${desc}`)
}

async function testPage(page, url, label, viewport) {
  log(`Testing ${label} @ ${viewport.width}x${viewport.height}...`)
  await page.setViewportSize(viewport)

  const consoleErrors = []
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('Base UI') && !msg.text().includes('keyframes')) {
      consoleErrors.push(msg.text().slice(0, 200))
    }
  })

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    if (!response || response.status() >= 400) {
      issue('CRITICAL', label, `HTTP ${response?.status()} on ${url}`)
      return
    }
  } catch (e) {
    issue('CRITICAL', label, `Navigation failed: ${e.message.slice(0, 100)}`)
    return
  }

  await page.waitForTimeout(2000)

  // Check for JS errors
  for (const err of consoleErrors) {
    if (err.includes('Hydration')) issue('HIGH', label, `Hydration error: ${err.slice(0, 150)}`)
    else if (err.includes('Failed to load resource')) issue('MEDIUM', label, `Resource error: ${err.slice(0, 150)}`)
    else issue('MEDIUM', label, `Console error: ${err.slice(0, 150)}`)
  }

  // Check for broken images
  const brokenImages = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img')
    const broken = []
    imgs.forEach(img => {
      if (img.naturalWidth === 0 && img.src && !img.src.includes('data:')) {
        broken.push(img.src.slice(0, 100))
      }
    })
    return broken
  })
  if (brokenImages.length > 0) {
    issue('MEDIUM', label, `${brokenImages.length} broken images: ${brokenImages[0]}`)
  }

  // Check for overflow (horizontal scroll)
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth
  })
  if (hasOverflow) {
    issue('HIGH', label, 'Horizontal overflow detected — content wider than viewport')
  }

  // Check for overlapping elements (z-index issues)
  const overlaps = await page.evaluate(() => {
    const problems = []
    const bottomNav = document.querySelector('nav[class*="fixed bottom"]')
    const adBanner = document.querySelector('[class*="Ad"]')
    if (bottomNav && adBanner) {
      const navRect = bottomNav.getBoundingClientRect()
      const adRect = adBanner.getBoundingClientRect()
      if (navRect.top < adRect.bottom && navRect.bottom > adRect.top) {
        problems.push('BottomNav overlaps with AdBanner')
      }
    }
    return problems
  })
  for (const o of overlaps) issue('HIGH', label, o)

  // Check text truncation / overflow
  const textIssues = await page.evaluate(() => {
    const problems = []
    document.querySelectorAll('h1, h2, h3, p, span, button').forEach(el => {
      const style = getComputedStyle(el)
      if (style.overflow === 'visible' && el.scrollWidth > el.clientWidth + 5 && el.textContent.length > 3) {
        problems.push(`Text overflow: "${el.textContent.slice(0, 40)}" in <${el.tagName.toLowerCase()}>`)
      }
    })
    return problems.slice(0, 5)
  })
  for (const t of textIssues) issue('LOW', label, t)

  // Take screenshot
  const filename = `qa-${label.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
  await page.screenshot({ path: filename, fullPage: true })
  log(`Screenshot saved: ${filename}`)
}

async function main() {
  const browser = await chromium.launch({ headless: true })

  const DESKTOP = { width: 1280, height: 800 }
  const MOBILE = { width: 390, height: 844 }
  const TABLET = { width: 768, height: 1024 }

  const pages = [
    ['/ko', 'Home KO'],
    ['/en', 'Home EN'],
    ['/ko/explore', 'Explore'],
    ['/ko/rankings', 'Rankings'],
    ['/ko/category/airlines', 'Category Airlines'],
    ['/ko/about', 'About'],
    ['/ko/auth/login', 'Login'],
    ['/ko/auth/signup', 'Signup'],
  ]

  // Find a subject to test
  const ctx0 = await browser.newContext()
  const p0 = await ctx0.newPage()
  await p0.goto(`${BASE}/ko/explore`, { waitUntil: 'networkidle', timeout: 30000 })
  const subjectLink = await p0.getAttribute('a[href*="/ko/subject/"]', 'href')
  await ctx0.close()

  if (subjectLink) {
    pages.push([subjectLink, 'Subject Detail'])
  }

  const viewports = [
    ['Desktop', DESKTOP],
    ['Mobile', MOBILE],
    ['Tablet', TABLET],
  ]

  for (const [vpName, vp] of viewports) {
    const context = await browser.newContext({ viewport: vp })
    const page = await context.newPage()

    for (const [path, label] of pages) {
      await testPage(page, `${BASE}${path}`, `${vpName}-${label}`, vp)
    }

    await context.close()
  }

  await browser.close()

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('QA SUMMARY')
  console.log('='.repeat(60))

  const critical = issues.filter(i => i.severity === 'CRITICAL')
  const high = issues.filter(i => i.severity === 'HIGH')
  const medium = issues.filter(i => i.severity === 'MEDIUM')
  const low = issues.filter(i => i.severity === 'LOW')

  console.log(`CRITICAL: ${critical.length}`)
  console.log(`HIGH: ${high.length}`)
  console.log(`MEDIUM: ${medium.length}`)
  console.log(`LOW: ${low.length}`)
  console.log()

  for (const i of [...critical, ...high, ...medium, ...low]) {
    console.log(`[${i.severity}] ${i.page}: ${i.desc}`)
  }
}

main().catch(console.error)
