import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

  await page.goto('http://localhost:3001/ko', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)

  const overflowing = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth
    const results = []

    function check(el, depth = 0) {
      if (depth > 15) return
      const rect = el.getBoundingClientRect()
      if (rect.right > docWidth + 2 || rect.left < -2) {
        const classes = el.className?.toString?.().slice(0, 100) || ''
        const tag = el.tagName.toLowerCase()
        const id = el.id ? `#${el.id}` : ''
        results.push({
          tag: `${tag}${id}`,
          classes,
          width: Math.round(rect.width),
          right: Math.round(rect.right),
          docWidth,
          overflow: Math.round(rect.right - docWidth),
          text: el.textContent?.slice(0, 50) || '',
        })
      }
      for (const child of el.children) {
        check(child, depth + 1)
      }
    }

    check(document.body)
    return results.slice(0, 20)
  })

  console.log('Overflowing elements:')
  for (const el of overflowing) {
    console.log(`  <${el.tag}> class="${el.classes}" width=${el.width} right=${el.right} overflow=${el.overflow}px`)
    if (el.text) console.log(`    text: "${el.text.slice(0, 60)}"`)
  }

  await browser.close()
}

main().catch(console.error)
