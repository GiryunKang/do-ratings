import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  await page.goto('http://localhost:3001/ko', { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(3000)

  const broken = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img')
    const results = []
    imgs.forEach(img => {
      if (img.naturalWidth === 0 && img.src && !img.src.includes('data:') && img.style.display !== 'none') {
        results.push({
          src: img.src,
          alt: img.alt,
          visible: img.offsetParent !== null,
          parent: img.parentElement?.className?.slice(0, 60),
        })
      }
    })
    return results
  })

  console.log(`Broken images: ${broken.length}`)
  for (const img of broken) {
    console.log(`  src: ${img.src.slice(0, 120)}`)
    console.log(`  alt: ${img.alt}, visible: ${img.visible}`)
    console.log()
  }

  await browser.close()
}

main().catch(console.error)
