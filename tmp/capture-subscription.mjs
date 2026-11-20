import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
for (const [name, url] of [['local','http://localhost:3000/subscription'],['live','https://phause.vercel.app/subscription']]) {
  for (const [width,height] of [[1440,1000],[390,844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const planRequests=[];
    page.on('response', r => { if (/\/api\/plans|\/api\/cms\/subscription-page/.test(r.url())) planRequests.push(`${r.status()} ${r.url()}`); });
    await page.goto(url,{waitUntil:'networkidle',timeout:120000});
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await page.screenshot({path:`tmp/subscription-compare/${name}-${width}.png`,fullPage:false});
    const text=await page.locator('body').innerText();
    console.log(name,width,JSON.stringify({hasDollar:text.includes('$'),hasMonth:text.includes('/ month'),hasTier:/Tier 0/i.test(text),hasTiles:text.includes('MAXIMUM CAMPAIGNS')||text.includes('Maximum Campaigns'),planRequests:[...new Set(planRequests)]}));
    await page.close();
  }
}
await browser.close();
