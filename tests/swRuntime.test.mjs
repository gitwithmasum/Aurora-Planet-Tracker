import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const code=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
const origin='https://example.test';
const base=origin+'/Aurora-Planet-Tracker/';
const prefix=base+'assets/';
const initialHTML='<html><head><link href="/Aurora-Planet-Tracker/assets/style-a.css" rel="stylesheet"></head><body><script type="module" src="/Aurora-Planet-Tracker/assets/index-a.js"></script></body></html>';
const changedHTML='<html><body><script type="module" src="/Aurora-Planet-Tracker/assets/index-b.js"></script></body></html>';
const list={format:'aurora-offline-assets-v1',version:'5.4.0',
 assets:['assets/index-a.js','assets/style-a.css','assets/SolarScene-a.js']};

function swHarness({missing=[],manifest=list}={}){
 const listeners=new Map(),cacheData=new Map(),sources=new Map();
 const fails=new Set(missing.map(path=>new URL(path,base).href));
 let offline=false,claimed=0,skipWaiting=0,fetchCalls=[];
 const text=(body,type='text/plain')=>new Response(body,{status:200,headers:{'Content-Type':type}});
 const set=(path,body,type)=>sources.set(new URL(path,base).href,text(body,type));
 set('',initialHTML,'text/html');
 set('offline-assets.json',JSON.stringify(manifest),'application/json');
 set('assets/index-a.js','console.log("version a")','application/javascript');
 set('assets/index-b.js','console.log("version b")','application/javascript');
 set('assets/style-a.css','.app{display:block}','text/css');
 set('assets/SolarScene-a.js','export default function scene(){}','application/javascript');
 set('manifest.webmanifest','{}','application/manifest+json');
 set('planet-icon.svg','<svg/>','image/svg+xml');
 set('planet-textures/earth.jpg','jpeg','image/jpeg');
 set('api/private.json','{"token":"never-cache"}','application/json');
 function id(resource){return new URL(resource?.url||resource.href||resource,base).href}
 function getCache(name){
  if(!cacheData.has(name))cacheData.set(name,new Map());
  const map=cacheData.get(name);
  return {
   match:async r=>map.get(id(r))?.clone(),
   put:async(r,response)=>{map.set(id(r),response.clone())},
   keys:async()=>[...map.keys()].map(url=>({url})),
   delete:async r=>map.delete(id(r))
  };
 }
 const caches={
  open:async name=>getCache(name),
  keys:async()=>[...cacheData.keys()],
  delete:async name=>cacheData.delete(name),
  match:async resource=>{
   for(const name of cacheData.keys()){const result=await getCache(name).match(resource);if(result)return result}
  }
 };
 const fetch=async(resource,opts)=>{
  const key=id(resource);
  fetchCalls.push({url:key,opts:opts||{}});
  if(offline||fails.has(key)||!sources.has(key))throw Error('Network offline: '+key);
  return sources.get(key).clone();
 };
 const self={
  location:{origin},registration:{scope:base},clients:{claim:async()=>{claimed++}},
  skipWaiting:()=>{skipWaiting++},
  addEventListener:(name,listener)=>listeners.set(name,listener)
 };
 vm.runInNewContext(code,{self,caches,fetch,URL,Response,console},{filename:'sw.js'});
 async function dispatch(name,{url=base,mode='same-origin',method='GET',data,source}={}){
  const waits=[];let response;
  const event={
   request:{url,mode,method},
   data,source,
   waitUntil:task=>waits.push(Promise.resolve(task)),
   respondWith:task=>{response=Promise.resolve(task)}
  };
  const listener=listeners.get(name);
  assert.ok(listener,'missing handler '+name);
  listener(event);
  if(response)return response;
  await Promise.all(waits);
 }
 return {dispatch,caches,cacheData,sources,set,text,getCalls:()=>fetchCalls,
  offline:value=>{offline=value},get claimed(){return claimed},
  get skipped(){return skipWaiting}};
}
test('install caches a version-coherent shell and all listed lazy JS/CSS',async()=>{
 const env=swHarness();
 await env.dispatch('install');
 const shell=await env.caches.open('aurora-v5.4.0-shell');
 assert.equal((await (await shell.match(base)).text()),initialHTML);
 for(const path of list.assets)assert.ok(await shell.match(new URL(path,base)));
 await env.dispatch('activate');
 assert.equal(env.claimed,1);
});
test('offline navigation uses pinned old shell even after a newer online HTML',async()=>{
 const env=swHarness();
 await env.dispatch('install');
 env.set('',changedHTML,'text/html');
 const online=await env.dispatch('fetch',{mode:'navigate'});
 assert.equal(await online.text(),changedHTML);
 env.offline(true);
 const offline=await env.dispatch('fetch',{mode:'navigate'});
 assert.equal(await offline.text(),initialHTML);
});
test('preloaded lazy modules work offline without remote requests',async()=>{
 const env=swHarness();
 await env.dispatch('install');
 env.offline(true);
 const result=await env.dispatch('fetch',{url:prefix+'SolarScene-a.js'});
 assert.match(await result.text(),/function scene/);
});
test('when connection returns, a missing static asset can be fetched and cached',async()=>{
 const env=swHarness();
 await env.dispatch('install');
 env.set('assets/new-module-b.js','export const online=true','application/javascript');
 const live=await env.dispatch('fetch',{url:prefix+'new-module-b.js'});
 assert.match(await live.text(),/online=true/);
 env.offline(true);
 const restored=await env.dispatch('fetch',{url:prefix+'new-module-b.js'});
 assert.match(await restored.text(),/online=true/);
});
test('scope and private JSON APIs are bypassed and never cached',async()=>{
 const env=swHarness();
 await env.dispatch('install');
 assert.equal(await env.dispatch('fetch',{url:origin+'/Aurora-Planet-Tracker-evil/assets/x.js'}),undefined);
 assert.equal(await env.dispatch('fetch',{url:base+'api/private.json'}),undefined);
 assert.equal(await env.dispatch('fetch',{url:origin+'/other/assets/x.js'}),undefined);
 assert.equal(await env.dispatch('fetch',{url:base+'api/private.json?token=1'}),undefined);
 const shell=await env.caches.open('aurora-v5.4.0-shell');
 const runtime=await env.caches.open('aurora-v5.4.0-runtime');
 assert.equal(await shell.match(base+'api/private.json'),undefined);
 assert.equal(await runtime.match(base+'api/private.json'),undefined);
});
test('install rejects incomplete core bundle and retains previous caches',async()=>{
 const env=swHarness({missing:['assets/index-a.js']});
 const previous=await env.caches.open('aurora-v4.6.0-shell');
 await previous.put(base,new Response('old-working-shell'));
 await assert.rejects(env.dispatch('install'),/Core app bundle not cacheable/);
 assert.equal(await (await previous.match(base)).text(),'old-working-shell');
 assert.equal((await env.caches.keys()).includes('aurora-v4.6.0-shell'),true);
});
test('install rejects wrong-version manifest before activation',async()=>{
 const env=swHarness({manifest:{...list,version:'4.6.0'}});
 await assert.rejects(env.dispatch('install'),/does not match offline worker/);
});
test('activation removes obsolete Aurora caches but leaves unrelated cache namespaces',async()=>{
 const env=swHarness();
 await env.dispatch('install');
 await env.caches.open('aurora-v4.6.0-shell');
 await env.caches.open('another-app-cache');
 await env.dispatch('activate');
 assert.equal((await env.caches.keys()).includes('aurora-v4.6.0-shell'),false);
 assert.equal((await env.caches.keys()).includes('another-app-cache'),true);
});
test('offline cache diagnostic reports real completeness and distinguishes misses',async()=>{
 const env=swHarness({missing:['assets/SolarScene-a.js']});
 await env.dispatch('install');
 const messages=[];
 await env.dispatch('message',{data:{type:'OFFLINE_STATUS'},source:{postMessage:data=>messages.push(data)}});
 assert.equal(messages.length,1);
 assert.equal(messages[0].shellReady,true);
 assert.equal(messages[0].listedAssets,3);
 assert.equal(messages[0].cachedAssets,2);
 assert.equal(messages[0].complete,false);
});
test('public planet textures work offline after a prior online fetch',async()=>{
 const env=swHarness();
 await env.dispatch('install');
 const url=base+'planet-textures/earth.jpg';
 await env.dispatch('fetch',{url});
 env.offline(true);
 assert.equal(await (await env.dispatch('fetch',{url})).text(),'jpeg');
});

test('pre-cached manifest and PWA icon survive a first offline launch',async()=>{
 const env=swHarness();
 await env.dispatch('install');
 env.offline(true);
 const manifest=await env.dispatch('fetch',{url:base+'manifest.webmanifest'});
 assert.equal(await manifest.text(),'{}');
 const icon=await env.dispatch('fetch',{url:base+'planet-icon.svg'});
 assert.match(await icon.text(),/svg/);
});
