import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 768, height: 1024 } })

  await page.goto('http://localhost:3001/en', { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(3000)

  const docWidth = await page.evaluate(() => document.documentElement.clientWidth)
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  console.log(`docWidth: ${docWidth}, scrollWidth: ${scrollWidth}`)

  if (scrollWidth > docWidth) {
    const overflowing = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth
      const results = []
      function check(el, depth = 0) {
        if (depth > 12) return
        const rect = el.getBoundingClientRect()
        if (rect.right > docWidth + 2) {
          results.push({
            tag: el.tagName.toLowerCase(),
            classes: el.className?.toString?.().slice(0, 80) || '',
            right: Math.round(rect.right),
            overflow: Math.round(rect.right - docWidth),
          })
        }
        for (const child of el.children) check(child, depth + 1)
      }
      check(document.body)
      return results.slice(0, 10)
    })
    for (const el of overflowing) {
      console.log(`<${el.tag}> class="${el.classes}" overflow=${el.overflow}px`)
    }
  }

  await browser.close()
}

main().catch(console.error)
