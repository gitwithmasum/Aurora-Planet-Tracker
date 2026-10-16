/* Aurora Planet Tracker offline navigation and immutable build assets cache.
   Same-origin only; no user GPS, camera streams, tokens, or reports stored. */
const VERSION='aurora-v3.2.0';
const SHELL=VERSION+'-shell',RUNTIME=VERSION+'-runtime';
const scope=self.registration.scope;
const home=new URL('./',scope).pathname;
const maxRuntime=70;
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(SHELL).then(async cache=>{
  try {
   const documentResponse=await fetch(new URL('./',scope),{cache:'reload'});
   if(documentResponse.ok){
    await cache.put(new URL('./',scope),documentResponse.clone());
    const html=await documentResponse.text();
    const assetPaths=[...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g)].map(match=>match[1]);
    for(const path of assetPaths){
     try{const url=new URL(path,scope);if(url.origin===self.location.origin&&url.pathname.startsWith(home)){const response=await fetch(url);if(response.ok)await cache.put(url,response)}}catch{}
    }
   }
  }catch{}
  for(const name of ['manifest.webmanifest','planet-icon.svg']){
   try{const response=await fetch(new URL(name,scope),{cache:'reload'});if(response.ok)await cache.put(new URL(name,scope),response)}catch{}
  }
 }));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('aurora-')&&!([SHELL,RUNTIME].includes(k))).map(k=>caches.delete(k)));await self.clients.claim()})());
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(home))return;
 if(request.mode==='navigate'){
  // Always prefer the current deployment's HTML. Avoid pairing old cached HTML with deleted hashed JS chunks.
  event.respondWith((async()=>{
   try{
    const fresh=await fetch(request,{cache:'no-store'});
    if(fresh.ok){const cache=await caches.open(SHELL);await cache.put(request,fresh.clone());return fresh}
    return fresh;
   }catch{
    // Offline shell is only a fallback, never an online replacement for a failed deployment response.
    return await caches.match(request)||await caches.match(home)||Response.error();
   }
  })());return;
 }
 if(!/\.(?:js|css|svg|png|jpg|jpeg|webp|woff2?|webmanifest)$/.test(url.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(RUNTIME);
  // Network-first prevents an earlier JS/CSS chunk from being paired with newer HTML.
  try{
   const response=await fetch(request);
   if(response.ok){await cache.put(request,response.clone());const keys=await cache.keys();if(keys.length>maxRuntime)await cache.delete(keys[0])}
   return response;
  }catch{return await cache.match(request)||await caches.match(request)||Response.error()}
 })());
});
