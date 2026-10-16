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
 await page.getByRole('button',{name:/Hubble Space Telescope.*Hubble/i}).first().evaluate(button=>button.click());
 await page.waitForFunction(()=>document.querySelector('.satGlobeCorner')?.textContent?.includes('Hubble'),null,{timeout:12000});
 await page.waitForFunction(()=>/\d+(?:\.\d+)?\s*km/.test(document.querySelector('.satTelemetry')?.textContent||''),null,{timeout:12000});
 console.log('PASS: Hubble selection switches orbital globe and populates telemetry');
 await page.getByText('Orbital Mission Control',{exact:true}).waitFor({state:'visible',timeout:15000});
 const dashboard=page.locator('.missionControl');
 await dashboard.getByRole('button',{name:/International Space Station/}).first().evaluate(button=>button.click());
 await dashboard.getByRole('button',{name:/Hubble Space Telescope/}).first().evaluate(button=>button.click());
 if(await dashboard.locator('tbody tr').count()!==2)throw Error('Satellite comparison did not render two spacecraft');
 await dashboard.getByLabel('Observation journal note').fill('Hubble browser QA snapshot');
 await dashboard.getByRole('button',{name:'SAVE OBSERVATION'}).evaluate(button=>button.click());
 if(!(await dashboard.innerText()).includes('Hubble browser QA snapshot'))throw Error('Local observation history did not update');
 console.log('PASS: v2.9 mission dashboard, satellite comparison and local observation history');

 // Validate the v2.7 planner on the selected non-ISS satellite.
 await page.getByText('Hubble Space Telescope · Pass Calendar').waitFor({state:'visible',timeout:16000});
 await page.getByLabel('Pass prediction duration').selectOption('1');
 await page.getByLabel('Alert lead time').selectOption('15');
 await page.getByRole('button',{name:'ADD FAVORITE'}).evaluate(button=>button.click());
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




 // Earth Observation must be a separate page from the existing tracker.
 const earthNav=page.locator('.sidebarLinks button[title="Earth Observation"]');
 await earthNav.waitFor({state:'attached',timeout:12000});
 await earthNav.evaluate(button=>button.click());
 await page.getByRole('heading',{name:'Earth Mission View'}).waitFor({state:'visible',timeout:18000});
 await page.getByLabel('Search Earth Observation satellites').fill('Hubble');
 await page.getByRole('button',{name:/Hubble Space Telescope.*NORAD 20580/}).last().evaluate(button=>button.click());
 if(!(await page.locator('.earthMissionFocused').innerText()).includes('Hubble'))throw Error('Earth Observation satellite selection did not work');
 await page.getByRole('button',{name:'FOLLOW SATELLITE'}).evaluate(button=>button.click());
 if(!(await page.locator('.earthMissionPanel').innerText()).includes('STOP FOLLOWING'))throw Error('Follow camera control failed');
 console.log('PASS: standalone Earth Observation navigation, satellite selection and follow-camera toggle');
 await page.getByRole('heading',{name:'Location & Weather Intelligence'}).waitFor({state:'visible',timeout:16000});
 await page.waitForFunction(()=>document.querySelector('.earthIntelligenceCities')?.textContent?.includes('Dhaka'),null,{timeout:16000});
 await page.getByLabel('Search Earth cities').fill('Dhaka');
 await page.locator('.earthIntelligenceCities button').filter({hasText:'Dhaka'}).first().evaluate(button=>button.click());
 await page.getByText('FOCUS EARTH ON DHAKA').evaluate(button=>button.click());
 if(!(await page.locator('.earthIntelligence').innerText()).includes('EXIT CITY FOCUS'))throw Error('v3.5 city focus failed');
 await page.getByLabel('Compare city weather history').evaluate(input=>input.click());
 await page.getByLabel('Comparison Earth city').selectOption('Tokyo');
 if(!(await page.locator('.earthIntelligenceTwoCities').innerText()).includes('Tokyo'))throw Error('v3.5 city history comparison failed');
 await page.getByLabel('Filter Earth country').selectOption('Bangladesh');
 if(!(await page.locator('.earthIntelligenceCities').innerText()).includes('Dhaka'))throw Error('v3.5 country filter failed');
 console.log('PASS: v3.5 curated city lookup, globe focus, weather history comparison and country filtering');

 await page.getByRole('heading',{name:'Earth Data Layers'}).waitFor({state:'visible',timeout:18000});
 await page.waitForFunction(()=>document.querySelector('.earthScienceMeta')?.textContent?.includes('DATA: AVAILABLE'),null,{timeout:15000});
 const weatherChoice=page.getByRole('button',{name:'CLOUD COVERAGE'});
 await weatherChoice.evaluate(button=>button.click());
 const science=page.locator('.earthSciencePanel');
 if(!(await science.innerText()).includes('North America'))throw Error('Weather sample locations not rendered');
 await page.getByRole('button',{name:'NASA EARTH EVENTS'}).evaluate(button=>button.click());
 if(!(await science.innerText()).includes('NASA EVENTS'))throw Error('NASA EONET event control missing');
 await page.getByLabel('Filter Earth event date range').selectOption('365');
 await page.getByLabel('Filter Earth event category').selectOption('All');
 const list=page.locator('.earthScienceEvents button');
 await list.first().evaluate(button=>button.click());
 await page.getByText(/CAMERA FOCUSED:/).waitFor({state:'visible',timeout:8000});
 const link=page.getByRole('link',{name:/NASA EONET SOURCE/});
 if(!(await link.count()))throw Error('Event source link is absent');
 await page.getByRole('button',{name:'EXIT EVENT FOCUS'}).evaluate(button=>button.click());
 await page.getByLabel('Search Earth events').fill('not-a-real-event-search-phrase-123456789');
 if(!(await science.innerText()).includes('No matching recent events'))throw Error('Event search empty state is not working');
 console.log('PASS: v3.2 event camera focus, NASA source, time filter and search empty state');
 await page.getByRole('heading',{name:'NASA Worldview Imagery'}).waitFor({state:'visible',timeout:16000});
 await page.getByLabel('NASA imagery date',{exact:true}).waitFor({state:'visible',timeout:12000});
 await page.getByLabel('Enable NASA Earth imagery overlay').evaluate(input=>input.click());
 await page.waitForFunction(()=>document.querySelector('.earthImageryMeta')?.textContent?.includes('TEXTURE: READY'),null,{timeout:22000});
 await page.getByLabel('NASA imagery date',{exact:true}).selectOption({index:1});
 await page.waitForFunction(()=>document.querySelector('.earthImageryMeta')?.textContent?.includes('TEXTURE: READY'),null,{timeout:22000});
 if(await page.locator('.earthImageryError').count())throw Error('NASA GIBS imagery reported an error');
 console.log('PASS: NASA GIBS Earth imagery loads, overlays and switches date on the 3D globe');
 // v3.4: verify timeline, two dated mosaics, before/after split and cloud marker controls.
 await page.getByLabel('NASA imagery timeline').evaluate(input=>{input.value='0';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))});
 await page.getByRole('button',{name:'NEXT ▶'}).evaluate(button=>button.click());
 await page.getByLabel('Compare NASA imagery dates').evaluate(input=>input.click());
 await page.getByLabel('NASA before imagery date').waitFor({state:'visible',timeout:8000});
 const dates=await page.getByLabel('NASA imagery date',{exact:true}).locator('option').allTextContents();
 if(dates.length<2)throw Error('v3.4 comparison needs two NASA imagery dates');
 await page.getByLabel('NASA before imagery date').selectOption({index:0});
 await page.getByLabel('NASA after imagery date').selectOption({index:dates.length-1});
 const compare=page.getByLabel('NASA imagery before and after comparison');
 await compare.waitFor({state:'visible',timeout:12000});
 if(await compare.locator('img').count()!==2)throw Error('Missing before/after NASA imagery snapshots');
 await page.getByLabel('NASA imagery before after comparison split').evaluate(input=>{input.value='65';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))});
 await page.getByRole('button',{name:'CLOUD COVERAGE'}).evaluate(button=>button.click());
 await page.getByLabel('Cloud coverage marker size').waitFor({state:'visible',timeout:8000});
 console.log('PASS: v3.4 NASA date comparison and cloud control rendering');


 console.log('PASS: Earth science first-party data, weather layer and NASA events switch correctly');

 console.log('PASS: Satellite Tracker opened without recovery error');
 console.log('PASS: Chromium rendered Aurora root and dismissed loader');
}catch(e){
 console.error('CHROMIUM BOOT FAILURE',String(e));
 console.error('Browser issues:',errors.slice(0,25).join('\n'));
 await page.screenshot({path:'aurora-browser-failure.png',fullPage:true}).catch(()=>{});
 process.exitCode=1;
}finally{await browser.close()}
