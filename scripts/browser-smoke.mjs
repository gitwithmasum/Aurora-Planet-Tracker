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
 console.log('PASS: Chromium rendered Aurora root and dismissed loader');
}catch(e){
 console.error('CHROMIUM BOOT FAILURE',String(e));
 console.error('Browser issues:',errors.slice(0,25).join('\n'));
 await page.screenshot({path:'aurora-browser-failure.png',fullPage:true}).catch(()=>{});
 process.exitCode=1;
}finally{await browser.close()}
