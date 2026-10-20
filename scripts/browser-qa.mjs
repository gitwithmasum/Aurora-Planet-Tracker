// v4.8: real headless Chromium smoke tests for installed PWA-like browser
// behavior at desktop, mobile and both deployment base paths.
// Chromium emulation is NOT physical Android/iOS device validation.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium,devices} from 'playwright';

const BASE=process.env.VERCEL||process.env.VERCEL_ENV||process.env.VERCEL_URL?'/':'/Aurora-Planet-Tracker/';
const PORT=Number(process.env.AURORA_QA_PORT||4198);
const URL_ROOT='http://127.0.0.1:'+PORT+BASE;
const output='artifacts/browser-qa';
mkdirSync(output,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(PORT),'--strictPort'],{env:process.env,stdio:['ignore','pipe','pipe']});
let logs='';
server.stdout.on('data',data=>{logs+=String(data)});
server.stderr.on('data',data=>{logs+=String(data)});
let browser,failures=0;
const nap=ms=>new Promise(done=>setTimeout(done,ms));
async function waitForServer(){
 for(let i=0;i<70;i++){
  if(server.exitCode!==null)throw Error('Vite preview quit before starting: '+logs);
  try{const res=await fetch(URL_ROOT,{signal:AbortSignal.timeout(1000)});if(res.ok)return}catch{}
  await nap(300);
 }
 throw Error('Preview server did not respond: '+logs);
}
async function run(name,context,steps){
 const page=await context.newPage();
 const exceptions=[];
 page.on('pageerror',error=>exceptions.push(error.message));
 try{
  await page.goto(URL_ROOT,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('main.auroraMain').waitFor({timeout:30000});
  await steps(page);
  assert.deepEqual(exceptions,[],'Unhandled client exceptions: '+exceptions.join(' | '));
  console.log('PASS',name,'base',BASE);
 }catch(e){
  failures++;
  const safe=name.replace(/[^a-z0-9-]/gi,'-');
  await page.screenshot({path:output+'/'+safe+'.png',fullPage:true,timeout:15000}).catch(()=>{});
  console.error('FAIL',name,e.message);
 }finally{await page.close()}
}
const checkOverflow=async page=>{
 const data=await page.evaluate(()=>{
  const w=document.documentElement.clientWidth,scroll=document.documentElement.scrollWidth;
  const offenders=scroll>w+2?[...document.querySelectorAll('body *')].map(el=>{
   const r=el.getBoundingClientRect();
   return {tag:el.tagName.toLowerCase(),className:typeof el.className==='string'?el.className.slice(0,100):'',
    left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)};
  }).filter(el=>el.right>w+2&&el.width>0&&el.left<w+5)
   .sort((a,b)=>b.right-a.right).slice(0,12):[];
  return {w,scroll,offenders};
 });
 assert.ok(data.scroll<=data.w+2,'Horizontal overflow '+JSON.stringify(data));
};
async function navigate(page,title,mobile=false){
 if(mobile)await page.getByRole('button',{name:'Open sidebar'}).click();
 const button=page.locator('#auroraSidebar button[aria-label="'+title+'"]');
 await button.click();
 const ready=title==='Moonverse'?page.locator('.moonverse'):page.getByRole('heading',{name:title,exact:true}).first();
 await ready.waitFor({timeout:20000});
}
try{
 await waitForServer();
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
 const desktop=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true,reducedMotion:'reduce'});
 await run('desktop-layout-and-navigation',desktop,async page=>{
  await checkOverflow(page);
  await navigate(page,'Field Journal');
  await page.locator('.fieldJournal').waitFor({timeout:20000});
  await navigate(page,'Observation Analytics');
  await page.locator('.obsAnalytics').waitFor({timeout:20000});
  await checkOverflow(page);
 });
 await run('moonverse-core-and-planet-selection',desktop,async page=>{
  await navigate(page,'Moonverse');
  await page.locator('.moonverse').waitFor({timeout:20000});
  await page.getByRole('heading',{name:'Planetary Moon Systems'}).waitFor();
  await page.getByRole('button',{name:/Europa.*km radius/i}).click();
  await page.getByRole('heading',{name:'Europa',exact:true}).waitFor();
  await page.locator('.moonScienceLab').waitFor({timeout:20000});
  await page.getByRole('tab',{name:'PHYSICAL SCIENCE'}).click();
  await page.getByText('1.315',{exact:false}).first().waitFor({timeout:10000});
  await page.getByRole('tab',{name:'COMPARE MOONS'}).click();
  await page.locator('.moonLabComparisonPlots').waitFor({timeout:10000});
  await page.getByRole('tab',{name:'SURFACE & INTERIOR'}).click();
  await page.locator('.moonGeoExplorer').waitFor({timeout:15000});
  await page.getByRole('button',{name:/Conamara Chaos/}).first().click();
  await page.getByRole('link',{name:/NASA SCIENTIFIC SOURCE/}).waitFor();
  await page.getByRole('tab',{name:'INTERIOR CUTAWAY'}).click();
  await page.getByRole('button',{name:/Proposed salty ocean/}).click();
  await page.locator('.moonGeoInteriorDetail').getByText('INFERRED').waitFor();
  await checkOverflow(page);
  await page.getByRole('tab',{name:'NASA IMAGES'}).click();
  await page.getByRole('link',{name:/OPEN VERIFIED NASA IMAGE/}).waitFor({timeout:10000});
  await page.getByRole('button',{name:/Mars.*selected/i}).click();
  await page.getByRole('heading',{name:'Phobos',exact:true}).waitFor();
  await page.getByRole('button',{name:/Mercury.*none/i}).click();
  await page.getByRole('heading',{name:/No natural moons/}).waitFor();
  await checkOverflow(page);
 });
 const scientificFixtureContext=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block',reducedMotion:'reduce'});
 await run('horizons-jpl-synthetic-fixture-and-safe-fallback',scientificFixtureContext,async page=>{
  // Isolated browser fixture, NOT a NASA/JPL response and never written to dist.
  const hour=60*60*1000,baseline=Math.floor(Date.now()/hour)*hour-hour;
  const rows=Array.from({length:4},(_,i)=>[baseline+i*hour,
   [671100,10000+i*5000,5000+i*2000],[.01,.2,.02]]);
  const fixture={format:'aurora-horizons-v1',schema:1,createdAt:new Date().toISOString(),
   frame:'ICRF',timeScale:'UTC',units:'km',stepMinutes:60,
   targets:{europa:{naif:502,center:599,frame:'ICRF',rows}}};
  await page.route('**/orbital-data/horizons-v5.2.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)}));
  await navigate(page,'Moonverse');
  await page.locator('.moonverseEphemerisStatus').filter({hasText:/verified jpl snapshot captured/i}).waitFor({timeout:20000});
  const scientific=page.getByRole('button',{name:'JPL HORIZONS SNAPSHOT'});
  await scientific.waitFor({state:'visible'});
  assert.equal(await scientific.isDisabled(),false);
  await scientific.click();
  await page.getByText(/JPL SAMPLED VECTORS/).waitFor({timeout:20000});
  await page.getByRole('button',{name:/Europa.*km radius/i}).click();
  await page.getByText(/Planet-relative distance/).waitFor();
  await page.getByRole('button',{name:'EDUCATIONAL ORBITS'}).click();
  await page.getByText(/ILLUSTRATIVE MODEL/).waitFor();
  await checkOverflow(page);
 });
 await scientificFixtureContext.close();
 await run('earth-observation-return-dashboard-without-portal-errors',desktop,async page=>{
  await page.locator('#auroraSidebar button[title="Earth Observation"]').click();
  await page.getByRole('heading',{name:'Earth Mission View'}).waitFor({timeout:25000});
  await page.locator('#auroraSidebar button[title="Dashboard"]').click();
  await page.locator('.auroraDashboard').waitFor({timeout:20000});
  await page.waitForTimeout(350);
  await checkOverflow(page);
 });
 await run('field-journal-create-and-reload',desktop,async page=>{
  await navigate(page,'Field Journal');
  await page.locator('.fieldJournal').waitFor({timeout:20000});
  await page.getByRole('button',{name:'NEW SESSION'}).click();
  await page.locator('.fieldJournalForm input').first().fill('Browser QA Mars sighting');
  await page.locator('.fieldJournalForm button[type="submit"]').click();
  await page.getByRole('heading',{name:'Browser QA Mars sighting'}).waitFor({timeout:15000});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('main.auroraMain').waitFor();
  await navigate(page,'Field Journal');
  await page.getByRole('heading',{name:'Browser QA Mars sighting'}).waitFor({timeout:15000});
  await navigate(page,'Observation Analytics');
  await page.locator('.obsAnalyticsMetrics').waitFor({timeout:15000});
 });
 await run('recovery-backup-restore-and-reload',desktop,async page=>{
  await navigate(page,'Offline Recovery');
  await page.locator('.recoveryCenter').waitFor({timeout:15000});
  const [download]=await Promise.all([
   page.waitForEvent('download',{timeout:15000}),
   page.getByRole('button',{name:'EXPORT RECOVERY JSON'}).click()
  ]);
  assert.match(download.suggestedFilename(),/aurora-recovery-v4/);
  assert.equal(await download.failure(),null);
  const savedFile=await download.path();
  assert.ok(savedFile,'Recovery download not available to browser test');
  const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('aurora-field-sessions-v1')||'[]'));
  assert.ok(original.length>=1,'Expected the previously saved session');
  // Simulate cleared local journal data in this isolated CI browser profile.
  await page.evaluate(()=>localStorage.setItem('aurora-field-sessions-v1','[]'));
  await page.reload({waitUntil:'domcontentloaded'});
  await navigate(page,'Offline Recovery');
  await page.locator('input[aria-label="Choose Aurora recovery JSON"]').setInputFiles(savedFile);
  await page.locator('.recoveryPreview').waitFor({timeout:15000});
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'CONFIRM RESTORE'}).click();
  await page.getByRole('button',{name:'RELOAD APP TO APPLY RESTORED DATA'}).click();
  await page.locator('main.auroraMain').waitFor();
  await navigate(page,'Field Journal');
  await page.getByRole('heading',{name:'Browser QA Mars sighting'}).waitFor({timeout:15000});
 });
 await run('device-qa-checks-and-sanitized-report',desktop,async page=>{
  await navigate(page,'Device QA');
  await page.locator('.deviceQA').waitFor({timeout:20000});
  await page.getByRole('button',{name:'RUN DEVICE CHECKS'}).click();
  await page.locator('.deviceQAProbeGrid').waitFor({timeout:15000});
  await page.getByLabel('Verification status: install').selectOption('pass');
  const [download]=await Promise.all([
   page.waitForEvent('download',{timeout:15000}),
   page.getByRole('button',{name:'EXPORT PRIVACY-SAFE QA JSON'}).click()
  ]);
  assert.match(download.suggestedFilename(),/aurora-device-qa-v4/);
  const report=JSON.parse(await (await import('node:fs/promises')).readFile(await download.path(),'utf8'));
  assert.equal(report.format,'aurora-device-qa-report-v1');
  assert.equal(report.checklist.install,'pass');
  assert.equal(report.summary.manualComplete,false);
  assert.ok(!JSON.stringify(report).includes('Browser QA Mars sighting'),'QA report must exclude field notes');
 });
 const mobile=await browser.newContext({...devices['Pixel 7'],viewport:{width:393,height:851},acceptDownloads:true,reducedMotion:'reduce'});
 await run('mobile-drawer-keyboard-and-no-overflow',mobile,async page=>{
  await checkOverflow(page);
  await page.getByRole('button',{name:'Open sidebar'}).click();
  await page.locator('#auroraSidebar').waitFor({state:'visible'});
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Open sidebar'}).waitFor();
  await navigate(page,'Offline Recovery',true);
  await page.locator('.recoveryCenter').waitFor({timeout:20000});
  await checkOverflow(page);
  await navigate(page,'Field Journal',true);
  await page.locator('.fieldJournal').waitFor({timeout:20000});
  await checkOverflow(page);
 });
 await run('mobile-moonverse-catalog-and-layout',mobile,async page=>{
  await navigate(page,'Moonverse',true);
  await page.locator('.moonverse').waitFor({timeout:20000});
  await checkOverflow(page);
  await page.locator('.moonverseCatalogList').waitFor();
  await page.getByRole('button',{name:/Europa.*km radius/i}).click();
  await page.getByRole('heading',{name:'Europa',exact:true}).waitFor();
  await page.locator('.moonScienceLab').waitFor({timeout:20000});
  await page.getByRole('tab',{name:'SURFACE & INTERIOR'}).click();
  await page.locator('.moonGeoExplorer').waitFor({timeout:15000});
  await page.getByRole('tab',{name:'INTERIOR CUTAWAY'}).click();
  await checkOverflow(page);
  await page.getByRole('tab',{name:'COMPARE MOONS'}).click();
  await checkOverflow(page);
 });
 await run('mobile-pwa-service-worker-offline-reload',mobile,async page=>{
  const ready=await page.evaluate(async()=>{
   if(!('serviceWorker'in navigator))return false;
   const reg=await Promise.race([navigator.serviceWorker.ready,new Promise(resolve=>setTimeout(()=>resolve(null),15000))]);
   return !!reg;
  });
  assert.ok(ready,'Service worker installation did not become ready');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('main.auroraMain').waitFor({timeout:15000});
  assert.ok(await page.evaluate(()=>!!navigator.serviceWorker.controller),'Service worker is not controlling this tab');
  await mobile.setOffline(true);
  try{
   await page.reload({waitUntil:'domcontentloaded',timeout:20000});
   await page.locator('main.auroraMain').waitFor({timeout:20000});
   assert.ok(await page.locator('.app').count(),'Offline render failed');
  }finally{await mobile.setOffline(false)}
 });
 await desktop.close();await mobile.close();
}catch(e){failures++;console.error('Browser QA infrastructure:',e)}
finally{
 await browser?.close().catch(()=>{});
 server.kill('SIGTERM');
}
if(failures)process.exitCode=1;
else console.log('Aurora browser QA PASS for',BASE);
