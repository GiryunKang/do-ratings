import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  const errors = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text().slice(0, 400))
    }
  })
  page.on('pageerror', err => {
    errors.push(`PAGE_ERROR: ${err.message.slice(0, 400)}`)
  })

  const testPages = ['/ko/auth/signup', '/ko/category/airlines', '/ko/explore']

  for (const url of testPages) {
    errors.length = 0
    await page.goto(`http://localhost:3001${url}`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)

    const filtered = errors.filter(e =>
      !e.includes('Base UI') && !e.includes('keyframes') && !e.includes('Failed to load resource')
    )

    if (filtered.length > 0) {
      console.log(`\n=== ${url} (${filtered.length} errors) ===`)
      for (const err of filtered) {
        console.log(err)
      }
    } else {
      console.log(`\n=== ${url}: CLEAN ===`)
    }
  }

  await browser.close()
}

main().catch(console.error)
