import { createRequire } from 'node:module'
const require = createRequire('D:/即设-毕设素材/jixian-gallery/')
const { chromium } = require('playwright-core')
const b = await chromium.launch({ executablePath: 'C:/Users/ZhuanZ1/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe', headless: true })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const p = await ctx.newPage()
await p.goto('https://daolingz46-tech.github.io/jixian-app/', { waitUntil: 'networkidle', timeout: 60000 })
await p.waitForTimeout(2700)
await p.fill('#phone','13812345678'); await p.click('#codeBtn'); await p.fill('#code','8888'); await p.click('#loginBtn')
await p.waitForTimeout(1000)
for (let i = 0; i < 8; i++) {
  await p.evaluate(() => { const el = document.querySelector('.body'); el.scrollTop = el.scrollHeight })
  await p.waitForTimeout(450)
}
const stat = await p.locator('.card img').evaluateAll((xs) => ({ loaded: xs.filter((x) => x.naturalWidth > 0).length, total: xs.length }))
console.log('滚动后图片:', JSON.stringify(stat))
await b.close()
