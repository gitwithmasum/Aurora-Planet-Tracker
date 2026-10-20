/* Aurora v4.6 — offline shell, lazily imported astronomy JS/CSS, safe updates.
   Scope-limited, same-origin assets only. Never cache user data or API keys. */
const VERSION='aurora-v4.6.0';
const SHELL=VERSION+'-shell';
const RUNTIME=VERSION+'-runtime';
const MAX_RUNTIME=70;
const scope=self.registration.scope;
const root=new URL('./',scope);
const ASSET_LIST=new URL('offline-assets.json',scope);
const isLocal=url=>url.origin===self.location.origin&&url.pathname.startsWith(root.pathname);
const safeAsset=value=>typeof value==='string'&&/^assets\/[a-zA-Z0-9._/-]+\.(?:js|css)$/.test(value)&&!value.includes('..');
const cached=async(cache,url)=>{try{const response=await fetch(url,{cache:'reload'});if(response.ok){await cache.put(url,response.clone());return true}}catch{}return false};
async function precache(){
 const cache=await caches.open(SHELL);
 const shellOk=await cached(cache,root);
 if(!shellOk)throw Error('App shell unavailable: preserve previous service worker');
 // Boot entries come from the current HTML as a backup when manifest generation fails.
 const html=await(await cache.match(root)).text();
 const entries=[...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g)]
  .map(match=>new URL(match[1],root)).filter(isLocal);
 const manifestResponse=await fetch(ASSET_LIST,{cache:'reload'}).catch(()=>null);
 let assets=[];
 if(manifestResponse?.ok){
  const raw=await manifestResponse.clone().json().catch(()=>null);
  if(raw?.format==='aurora-offline-assets-v1'&&raw.version==='4.6.0'&&Array.isArray(raw.assets)&&raw.assets.length<=180){
   assets=raw.assets.filter(safeAsset).map(name=>new URL(name,root));
   await cache.put(ASSET_LIST,manifestResponse.clone()).catch(()=>{});
  }
 }
 const all=[...new Map([...entries,...assets].filter(isLocal).map(url=>[url.href,url])).values()];
 // A partial optional pre-cache is acceptable: report status honestly in the UI.
 // Always prioritize the boot scripts. Cache each file independently for quota safety.
 let coreOk=0;
 for(const url of entries){if(await cached(cache,url))coreOk++}
 if(entries.length&&coreOk<entries.length)throw Error('Core scripts not cacheable');
 // Avoid loading a large burst of fetches in one install event on slow phones.
 for(const url of all){
  if(entries.some(boot=>boot.href===url.href))continue;
  await cached(cache,url);
 }
 for(const asset of ['manifest.webmanifest','planet-icon.svg']){
  await cached(cache,new URL(asset,root));
 }
}
self.addEventListener('install',event=>{event.waitUntil(precache())});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('aurora-')&&key!==SHELL&&key!==RUNTIME).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING'){self.skipWaiting();return}
 if(event.data?.type!=='OFFLINE_STATUS')return;
 event.waitUntil((async()=>{
  const shell=await caches.open(SHELL);
  const list=await shell.match(ASSET_LIST);
  const manifest=list?await list.json().catch(()=>null):null;
  const assets=Array.isArray(manifest?.assets)?manifest.assets.filter(safeAsset):[];
  let available=0;
  for(const name of assets){if(await shell.match(new URL(name,root)))available++}
  event.source?.postMessage({type:'OFFLINE_STATUS_RESULT',version:VERSION,
   shellReady:!!(await shell.match(root)),listedAssets:assets.length,cachedAssets:available,
   complete:assets.length>0&&available===assets.length,
   note:'Offline does not provide live weather or fresh satellite TLE feeds.'});
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(!isLocal(url))return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{
   try{
    const response=await fetch(request,{cache:'no-store'});
    if(response.ok){
     const shell=await caches.open(SHELL);
     await shell.put(root,response.clone()).catch(()=>{});
    }
    return response;
   }catch{
    return await caches.match(root)||Response.error();
   }
  })());
  return;
 }
 const path=url.pathname;
 const isBundled=/\/assets\/[^/]+\.(?:js|css)$/.test(path);
 if(isBundled){
  // Vite hashes asset filenames: cache-first is safe across deployments.
  event.respondWith((async()=>{
   const response=await caches.match(request);
   if(response)return response;
   try{
    const fresh=await fetch(request);
    if(fresh.ok){const cache=await caches.open(SHELL);await cache.put(request,fresh.clone()).catch(()=>{})}
    return fresh;
   }catch{return Response.error()}
  })());
  return;
 }
 const supported=/\.(?:json|svg|png|jpg|jpeg|webp|woff2?|webmanifest)$/.test(path);
 if(!supported)return;
 event.respondWith((async()=>{
  const cache=await caches.open(RUNTIME);
  try{
   const fresh=await fetch(request,{cache:'no-store'});
   if(fresh.ok){
    await cache.put(request,fresh.clone()).catch(()=>{});
    const keys=await cache.keys();
    if(keys.length>MAX_RUNTIME)await cache.delete(keys[0]).catch(()=>{});
   }
   return fresh;
  }catch{return await cache.match(request)||await caches.match(request)||Response.error()}
 })());
});
