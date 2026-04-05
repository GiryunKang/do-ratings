import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const testPages = ['/ko/explore', '/ko/rankings', '/ko/about', '/ko/auth/login']

  for (const url of testPages) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    const errors = []
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('hydrat') || text.includes('Hydrat') || text.includes("didn't match") || text.includes('server rendered')) {
        errors.push(text.slice(0, 600))
      }
    })

    await page.goto(`http://localhost:3001${url}`, { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForTimeout(3000)

    if (errors.length > 0) {
      console.log(`\n=== ${url} ===`)
      for (const e of errors) console.log(e)
    } else {
      console.log(`${url}: CLEAN`)
    }
    await page.close()
  }

  await browser.close()
}

main().catch(console.error)
