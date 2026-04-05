import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  const hydrationErrors = []
  page.on('console', msg => {
    const text = msg.text()
    if (text.includes('hydrat') || text.includes('Hydrat') || text.includes('server rendered') || text.includes("didn't match")) {
      hydrationErrors.push(text.slice(0, 500))
    }
  })

  const testPages = ['/ko/auth/signup', '/ko/category/airlines', '/ko/explore']

  for (const url of testPages) {
    hydrationErrors.length = 0
    await page.goto(`http://localhost:3001${url}`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)

    if (hydrationErrors.length > 0) {
      console.log(`\n=== ${url} ===`)
      for (const err of hydrationErrors) {
        console.log(err.slice(0, 400))
      }
    }
  }

  await browser.close()
}

main().catch(console.error)
