import {chromium} from 'playwright';
const url='https://gitwithmasum.github.io/Aurora-Planet-Tracker/?ci_browser_probe='+Date.now();
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const page=await browser.newPage({viewport:{width:1366,height:768}});
const errors=[];
page.on('pageerror',error=>errors.push('JS: '+error.message));
page.on('response',r=>{if(r.url().includes('orbital-data/')||r.url().includes('celestrak.org'))console.log('ISS DATA HTTP',r.status(),r.url(),r.headers()['content-type'])});
page.on('requestfailed',request=>errors.push('NETWORK '+request.url()+' '+request.failure()?.errorText));
page.on('console',msg=>{if(msg.type()==='error')errors.push('CONSOLE '+msg.text())});
try{
 const res=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
 console.log('Navigation HTTP',res?.status(),url);
 await page.waitForFunction(()=>document.querySelector('#root')?.children.length>0,{timeout:25000});
 const snapshot=await page.evaluate(()=>({title:document.title,rootText:document.getElementById('root')?.innerText.slice(0,350),bootHidden:document.getElementById('aurora-boot')?.hidden}));
 console.log('Mounted app:',JSON.stringify(snapshot));
 if(/Aurora recovery mode|could not start|Some application files could not load/i.test(snapshot.rootText||''))throw Error('Recovery screen is still mounted');
 if(!snapshot.bootHidden)throw Error('Startup loader never dismissed');
 if(errors.length)console.warn('Browser issues:',errors.slice(0,12).join('\n'));
 // Smoke-test the navigation path that previously triggered Satellite Tracker recovery mode.
 const enter=page.getByText('ENTER THE GALAXY',{exact:true});
 if(await enter.count())await enter.first().click();
 const satellite=page.locator('.sidebarLinks button[title="Satellite Tracker"]');
 await satellite.waitFor({state:'attached',timeout:10000});
 // Activate the page's own button handler. Avoid hover overlays and canvas pointer capture
 // interfering with the regression check in headless Chromium.
 await satellite.evaluate(button=>button.click());
 await page.getByText('Interactive Earth Orbit').waitFor({state:'visible',timeout:20000});
 await page.waitForTimeout(1800);
 const section=await page.locator('body').innerText();
 if(section.includes('Satellite Tracker is temporarily unavailable')||section.includes('Aurora recovery mode'))throw Error('Satellite Tracker crashed inside feature error boundary');
 if(!section.includes('Interactive Earth Orbit'))throw Error('Satellite Tracker orbital UI did not render');
 // Also verify orbit telemetry really loads; simply rendering the globe controls is not enough.
 try{await page.waitForFunction(()=>{
  const panel=document.querySelector('.satTelemetry');
  if(!panel)return false;
  const text=panel.textContent||'';
  return /ALTITUDE/.test(text)&&/\d+(?:\.\d+)?\s*km/.test(text);
 },null,{timeout:16000});}catch(error){
  console.error('ISS data state:',await page.locator('.satGlobeViewport').innerText());
  console.error('Telemetry state:',await page.locator('.satTelemetry').innerText());
  throw error;
 }
 const telemetry=await page.locator('.satTelemetry').innerText();
 console.log('ISS telemetry:',telemetry.replace(/\n/g,' | ').slice(0,360));
 if(await page.getByText('Orbital data unavailable',{exact:true}).count())throw Error('ISS orbital data is still unavailable');
 console.log('PASS: Fresh ISS orbital dataset is loaded and telemetry populated');
 // Exercise v2.6 catalog selection, not just the historical ISS case.
 await page.getByRole('button',{name:/Hubble Space Telescope.*Hubble/i}).first().click();
 await page.waitForFunction(()=>document.querySelector('.satGlobeCorner')?.textContent?.includes('Hubble'),null,{timeout:12000});
 await page.waitForFunction(()=>/\d+(?:\.\d+)?\s*km/.test(document.querySelector('.satTelemetry')?.textContent||''),null,{timeout:12000});
 console.log('PASS: Hubble selection switches orbital globe and populates telemetry');
 await page.getByText('Orbital Mission Control',{exact:true}).waitFor({state:'visible',timeout:15000});
 const dashboard=page.locator('.missionControl');
 await dashboard.getByRole('button',{name:/International Space Station/}).first().click();
 await dashboard.getByRole('button',{name:/Hubble Space Telescope/}).first().click();
 if(await dashboard.locator('tbody tr').count()!==2)throw Error('Satellite comparison did not render two spacecraft');
 await dashboard.getByLabel('Observation journal note').fill('Hubble browser QA snapshot');
 await dashboard.getByRole('button',{name:'SAVE OBSERVATION'}).click();
 if(!(await dashboard.innerText()).includes('Hubble browser QA snapshot'))throw Error('Local observation history did not update');
 console.log('PASS: v2.9 mission dashboard, satellite comparison and local observation history');

 // Validate the v2.7 planner on the selected non-ISS satellite.
 await page.getByText('Hubble Space Telescope · Pass Calendar').waitFor({state:'visible',timeout:16000});
 await page.getByLabel('Pass prediction duration').selectOption('1');
 await page.getByLabel('Alert lead time').selectOption('15');
 await page.getByRole('button',{name:'ADD FAVORITE'}).click();
 const planner=await page.locator('.satPlanner').innerText();
 if(!planner.includes('FAVORITED')||!planner.includes('VISIBILITY'))throw Error('v2.7 calendar or favorites did not render');
 console.log('PASS: Hubble pass calendar, 15-minute lead option and favorite toggle rendered');
 await page.getByText('AR Satellite Finder',{exact:true}).waitFor({state:'visible',timeout:12000});
 await page.getByLabel('Satellite AR manual heading').focus();
 await page.keyboard.press('ArrowRight');
 await page.getByLabel('Satellite AR manual elevation').focus();
 await page.keyboard.press('ArrowUp');
 const arPanel=await page.locator('.satAR').innerText();
 if(!arPanel.includes('TARGET AZIMUTH')||!arPanel.includes('Hubble'))throw Error('Satellite AR guidance not rendered for selected Hubble target');
 if(await page.locator('.satARError').count())throw Error('Satellite AR unexpectedly reported an error without permission request');
 console.log('PASS: Satellite AR finder loads, manual calibration and selected target render without camera permission');
 await page.getByText('SENSOR STATUS: STALE / UNAVAILABLE').waitFor({state:'visible',timeout:8000});
 const experimentalPitch=page.getByLabel('EXPERIMENTAL SENSOR PITCH');
 if(await experimentalPitch.isEnabled())throw Error('Sensor pitch must stay disabled until fresh sensor data');
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(350);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
 if(overflow)console.warn('Mobile horizontal overflow detected — inspect UI containers');
 console.log('PASS: AR sensor fallback and mobile-width UI evaluated');




 console.log('PASS: Satellite Tracker opened without recovery error');
 console.log('PASS: Chromium rendered Aurora root and dismissed loader');
}catch(e){
 console.error('CHROMIUM BOOT FAILURE',String(e));
 console.error('Browser issues:',errors.slice(0,25).join('\n'));
 await page.screenshot({path:'aurora-browser-failure.png',fullPage:true}).catch(()=>{});
 process.exitCode=1;
}finally{await browser.close()}
