import { createRequire } from 'node:module'
const require = createRequire('D:/即设-毕设素材/jixian-gallery/')
const { chromium } = require('playwright-core')
const b = await chromium.launch({ executablePath: 'C:/Users/ZhuanZ1/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe', headless: true })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const p = await ctx.newPage()
await p.goto('https://daolingz46-tech.github.io/jixian-app/', { waitUntil: 'networkidle', timeout: 60000 })
await p.waitForTimeout(2700)
await p.fill('#phone','13812345678'); await p.click('#codeBtn'); await p.fill('#code','8888'); await p.click('#loginBtn')
// 等网络完全空闲
await p.waitForLoadState('networkidle')
await p.waitForTimeout(1200)
const stat = await p.locator('.card img').evaluateAll((xs) => {
  const loaded = xs.filter((x) => x.naturalWidth > 0).length
  const zero = xs.filter((x) => x.naturalWidth === 0).map((x) => x.src.slice(-40))
  return { loaded, total: xs.length, zero: zero.slice(0, 5) }
})
console.log(JSON.stringify(stat, null, 1))
await p.screenshot({ path: 'shots/vf-home-idle.png' })
await b.close()
