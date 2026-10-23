// v4.7 production HTTP smoke test: exercise the generated files over a
// temporary loopback-only server for both root and GitHub Pages base paths.
// This is a static delivery check, not a real installed-PWA browser test.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,join,sep,extname} from 'node:path';
import assert from 'node:assert/strict';

const BASE=process.env.VERCEL||process.env.VERCEL_ENV||process.env.VERCEL_URL?'/':'/Aurora-Planet-Tracker/';
const dist=resolve('dist');
const mime={'.js':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html',
 '.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 try{
  if(req.method!=='GET'){res.writeHead(405);res.end();return}
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  if(!pathname.startsWith(BASE)){res.writeHead(404);res.end();return}
  const relative=pathname.slice(BASE.length)||'index.html';
  const file=resolve(dist,relative);
  if(!file.startsWith(dist+sep)){res.writeHead(403);res.end();return}
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(data);
 }catch{res.writeHead(404);res.end()}
});
let url;
try{
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok)});
 url='http://127.0.0.1:'+server.address().port+BASE;
 const get=async(name,{type}={})=>{
  const response=await fetch(url+name);
  assert.equal(response.status,200,'Missing built asset '+BASE+name);
  if(type)assert.match(response.headers.get('content-type')||'',type);
  return response;
 };
 const html=await(await get('index.html',{type:/text\/html/})).text();
 const list=await(await get('offline-assets.json',{type:/application\/json/})).json();
 assert.equal(list.format,'aurora-offline-assets-v1');
 assert.equal(list.version,'6.1.1');
 assert.ok(list.assets.length>0);
 assert.ok(list.assets.some(name=>name.endsWith('.js')));
 const sw=await(await get('sw.js')).text();
 assert.ok(sw.includes("aurora-v"+list.version),'Offline cache version and manifest disagree');
 const core=[...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g)]
  .map(m=>m[1]).filter(file=>!file.startsWith('http'));
 assert.ok(core.length>0,'No boot scripts in HTML');
 for(const asset of core){
  assert.ok(asset.startsWith(BASE),'Boot asset is not scoped to '+BASE+': '+asset);
  assert.ok(list.assets.includes(asset.slice(BASE.length)),'Boot asset absent from offline manifest: '+asset);
 }
 for(const item of list.assets){
  assert.match(item,/^assets\/[a-zA-Z0-9._/-]+\.(?:js|css)$/);
  const result=await get(item,{type:item.endsWith('.css')?/text\/css/:/javascript/});
  assert.ok(Number(result.headers.get('content-length')||1)>0);
  await result.arrayBuffer();
 }
 await get('manifest.webmanifest');
 console.log('Aurora v4.7 static HTTP smoke PASS:',BASE,
  'boot entries',core.length,'bundled assets',list.assets.length,'bytes',list.bytes);
}catch(error){
 console.error('Aurora static HTTP smoke FAILED:',error);
 process.exitCode=1;
}finally{
 await new Promise(resolve=>server.close(resolve));
}
