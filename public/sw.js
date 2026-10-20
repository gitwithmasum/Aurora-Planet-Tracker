/* Aurora v4.7 — deployment-coherent offline shell and cache state.
   Only public static assets from this registration's origin and scope are cached.
   Local notes, auth responses, and real-time APIs must never enter CacheStorage. */
const VERSION='aurora-v4.7.0';
const SHELL=VERSION+'-shell';
const RUNTIME=VERSION+'-runtime';
const MAX_RUNTIME=70;
const scope=self.registration.scope;
const root=new URL('./',scope);
const ASSET_LIST=new URL('offline-assets.json',scope);
const isLocal=url=>url.origin===self.location.origin&&url.pathname.startsWith(root.pathname);
const safeAsset=value=>typeof value==='string'&&/^assets\/[a-zA-Z0-9._/-]+\.(?:js|css)$/.test(value)&&!value.includes('..');
const isBundle=url=>isLocal(url)&&/\/assets\/[a-zA-Z0-9._/-]+\.(?:js|css)$/.test(url.pathname)&&!url.pathname.includes('..')&&!url.search;
const isPublicRuntime=url=>{
 if(!isLocal(url)||url.search)return false;
 const path=url.pathname.slice(root.pathname.length);
 return /^(?:planet-textures|orbital-data|icons|images)\/[a-zA-Z0-9._/-]+\.(?:svg|png|jpe?g|webp|woff2?|json)$/.test(path)||
  /^(?:manifest\.webmanifest|planet-icon\.svg)$/.test(path);
};
const load=async(cache,url)=>{
 try{
  const response=await fetch(url,{cache:'reload'});
  if(response.ok&&response.type!=='opaque'){
   await cache.put(url,response.clone());
   return true;
  }
 }catch{}
 return false;
};
async function precache(){
 const cache=await caches.open(SHELL);
 const fresh=await fetch(root,{cache:'reload'});
 if(!fresh.ok||fresh.type==='opaque')throw Error('Offline app shell unavailable; keep old worker');
 const html=await fresh.clone().text();
 const boot=[...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g)]
  .map(match=>new URL(match[1],root))
  .filter(isBundle);
 if(!boot.length)throw Error('App shell has no safe bundled JavaScript; keep old worker');
 const manifestResponse=await fetch(ASSET_LIST,{cache:'reload'});
 if(!manifestResponse.ok||manifestResponse.type==='opaque')throw Error('Build offline asset list missing; keep old worker');
 const manifest=await manifestResponse.clone().json();
 if(manifest?.format!=='aurora-offline-assets-v1'||manifest.version!=='4.7.0'||
   !Array.isArray(manifest.assets)||manifest.assets.length>180||
   manifest.assets.some(path=>!safeAsset(path))){
  throw Error('Build asset list does not match offline worker');
 }
 const assets=manifest.assets.map(name=>new URL(name,root));
 if(!boot.every(entry=>assets.some(candidate=>candidate.href===entry.href))){
  throw Error('Offline manifest is missing core scripts; keep old worker');
 }
 // Stage executable files first; do not store a new HTML shell until every
 // referenced entry script and stylesheet can actually be read offline.
 for(const url of boot){
  if(!await load(cache,url))throw Error('Core app bundle not cacheable: '+url.pathname);
 }
 // Optional lazy-loaded routes are best-effort. Readiness reports all misses.
 for(const url of assets){
  if(boot.some(entry=>entry.href===url.href))continue;
  await load(cache,url);
 }
 await cache.put(ASSET_LIST,manifestResponse.clone());
 await cache.put(root,fresh.clone());
 for(const asset of ['manifest.webmanifest','planet-icon.svg']){
  await load(cache,new URL(asset,root));
 }
}
self.addEventListener('install',event=>event.waitUntil(precache()));
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  // Cache cleanup only occurs after a complete enough install succeeds.
  const keys=await caches.keys();
  await Promise.all(keys.filter(name=>name.startsWith('aurora-')&&name!==SHELL&&name!==RUNTIME).map(name=>caches.delete(name)));
  await self.clients.claim();
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING'){self.skipWaiting();return}
 if(event.data?.type!=='OFFLINE_STATUS')return;
 event.waitUntil((async()=>{
  const cache=await caches.open(SHELL);
  const response=await cache.match(ASSET_LIST);
  const manifest=response?await response.json().catch(()=>null):null;
  const assets=manifest?.version==='4.7.0'&&Array.isArray(manifest.assets)?manifest.assets.filter(safeAsset):[];
  let present=0;
  for(const path of assets){if(await cache.match(new URL(path,root)))present++}
  const shellReady=!!await cache.match(root);
  event.source?.postMessage({type:'OFFLINE_STATUS_RESULT',version:VERSION,
   shellReady,listedAssets:assets.length,cachedAssets:present,
   complete:shellReady&&assets.length>0&&present===assets.length,
   note:'Static JS/CSS only. No promise of cached imagery, live weather or fresh TLEs.'});
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
    // Never replace the pinned offline HTML with another deployment's HTML.
    return response;
   }catch{
    const shell=await caches.open(SHELL);
    return await shell.match(root)||Response.error();
   }
  })());
  return;
 }
 if(isBundle(url)){
  event.respondWith((async()=>{
   const cache=await caches.open(SHELL);
   const hit=await cache.match(request);
   if(hit)return hit;
   try{
    const response=await fetch(request);
    if(response.ok&&response.type!=='opaque')await cache.put(request,response.clone()).catch(()=>{});
    return response;
   }catch{return Response.error()}
  })());
  return;
 }
 if(!isPublicRuntime(url))return;
 event.respondWith((async()=>{
  const cache=await caches.open(RUNTIME);
  try{
   const response=await fetch(request,{cache:'no-store'});
   if(response.ok&&response.type!=='opaque'){
    await cache.put(request,response.clone()).catch(()=>{});
    const keys=await cache.keys();
    if(keys.length>MAX_RUNTIME)await cache.delete(keys[0]).catch(()=>{});
   }
   return response;
  }catch{return await cache.match(request)||Response.error()}
 })());
});
