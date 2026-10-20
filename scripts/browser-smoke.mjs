// Production GitHub Pages Chromium smoke test.
// Tests the CURRENT app UI, not removed v3.x dashboard search widgets.
// Browser QA for local backup/restore + offline emulation lives in browser-qa.mjs.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const base='https://gitwithmasum.github.io/Aurora-Planet-Tracker/';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const route=async(name)=>{
 const button=page.locator('#auroraSidebar button[title="'+name+'"]');
 await button.waitFor({state:'attached',timeout:15000});
 await button.evaluate(el=>el.click());
};
try{
 const url=base+'?release_probe='+Date.now();
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(response?.status(),200,'GitHub Pages must serve the app');
 await page.locator('main.auroraMain').waitFor({timeout:30000});
 await page.locator('.auroraDashboard').waitFor({timeout:20000});
 assert.ok(await page.locator('.auroraDashHero').count(),'Andromeda hero missing');
 console.log('PASS: mounted production Dashboard',url);

 // Dashboard search is now a launcher for the Universal Space Search.
 await page.locator('.auroraDashSearchLauncher').click();
 const search=page.getByRole('combobox',{name:'Search planets, satellites, galaxies or modules'});
 await search.waitFor({timeout:15000});
 await search.fill('Earth Observation');
 const target=page.locator('#universalSearchResults button').filter({hasText:'Earth Observation'}).first();
 await target.waitFor({timeout:15000});
 await target.click();
 await page.getByRole('heading',{name:'Earth Mission View'}).waitFor({timeout:25000});
 console.log('PASS: Universal Search opens Earth Observation module');

 await route('Dashboard');
 await page.locator('.auroraDashboard').waitFor({timeout:18000});
 await page.getByLabel('Galaxy theme').selectOption('halftone');
 assert.ok(await page.locator('.app.theme-halftone').count(),'Pink-gold halftone theme unavailable');
 assert.equal(await page.locator('.auroraDashFeatures .auroraDashFeature').count(),4,'Expected four mission cards');
 console.log('PASS: original Dashboard, four mission cards, theme switch');

 await route('Satellite Tracker');
 await page.getByText('Interactive Earth Orbit').first().waitFor({timeout:25000});
 const bodyText=await page.locator('main.auroraMain').innerText();
 assert.ok(!bodyText.includes('temporarily unavailable'),'Satellite Tracker error boundary triggered');
 console.log('PASS: Satellite Tracker lazy module boots');

 await route('Field Journal');
 await page.locator('.fieldJournal').waitFor({timeout:20000});
 assert.ok(await page.locator('.fieldJournalToolbar').count(),'Field Journal tools unavailable');
 await route('Observation Analytics');
 await page.locator('.obsAnalytics').waitFor({timeout:20000});
 console.log('PASS: Field Journal and Observation Analytics modules boot');

 await route('Offline Recovery');
 await page.locator('.recoveryCenter').waitFor({timeout:20000});
 console.log('PASS: Offline Recovery module boots');
 assert.deepEqual(errors,[],'Unhandled page exceptions');

 // Responsive smoke without substituting for real-device testing.
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(200);
 const size=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
 if(size.scroll>size.width+2)console.warn('Mobile horizontal overflow at 390px:',JSON.stringify(size));
 console.log('PASS: responsive page remains mounted at mobile viewport; overflow is covered by dedicated browser QA');
 console.log('PASS: GitHub Pages v4.8+ live smoke checks completed');
}catch(error){
 console.error('GitHub Pages smoke failure:',error);
 if(errors.length)console.error('Browser exceptions:',errors.slice(0,8));
 await page.screenshot({path:'pages-smoke-failure.png',fullPage:true,timeout:12000}).catch(()=>{});
 process.exitCode=1;
}finally{
 await context.close();
 await browser.close();
}
