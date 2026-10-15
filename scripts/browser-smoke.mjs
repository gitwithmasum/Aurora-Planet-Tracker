import {chromium} from 'playwright';
const url='https://gitwithmasum.github.io/Aurora-Planet-Tracker/?ci_browser_probe='+Date.now();
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const page=await browser.newPage({viewport:{width:1366,height:768}});
const errors=[];
page.on('pageerror',error=>errors.push('JS: '+error.message));
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
 console.log('PASS: Satellite Tracker opened without recovery error');
 console.log('PASS: Chromium rendered Aurora root and dismissed loader');
}catch(e){
 console.error('CHROMIUM BOOT FAILURE',String(e));
 console.error('Browser issues:',errors.slice(0,25).join('\n'));
 await page.screenshot({path:'aurora-browser-failure.png',fullPage:true}).catch(()=>{});
 process.exitCode=1;
}finally{await browser.close()}
