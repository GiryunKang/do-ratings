import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const testPages = ['/ko/auth/signup', '/ko/category/airlines', '/en']

  for (const url of testPages) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    const errors = []
    page.on('console', msg => {
      const text = msg.text()
      if (msg.type() === 'error' && !text.includes('Base UI') && !text.includes('keyframes') && !text.includes('Failed to load')) {
        errors.push(text.slice(0, 600))
      }
    })

    await page.goto(`http://localhost:3001${url}`, { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForTimeout(3000)

    if (errors.length > 0) {
      console.log(`\n=== ${url} (${errors.length} errors) ===`)
      for (const e of errors) console.log(e.slice(0, 300))
    } else {
      console.log(`${url}: CLEAN`)
    }
    await page.close()
  }

  await browser.close()
}

main().catch(console.error)
