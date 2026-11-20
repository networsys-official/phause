import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('console',m=>console.log('console',m.type(),m.text()));
page.on('pageerror',e=>console.log('pageerror',e.message));
await page.goto('http://localhost:3000/subscription',{waitUntil:'networkidle'});
await page.waitForTimeout(3000);
console.log(await page.evaluate(()=>({cards:document.querySelectorAll('#pricing article').length,motionCards:document.querySelectorAll('#pricing [class*=group]').length,body:(document.body.innerText||'').includes('$29'),pricing:document.querySelector('#pricing')?.innerText?.slice(0,1000)})));
await browser.close();
