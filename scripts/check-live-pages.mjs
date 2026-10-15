#!/usr/bin/env node
// Real deployment smoke test: request HTML and check every local JS/CSS asset served.
const origin=process.argv[2]||'https://gitwithmasum.github.io/Aurora-Planet-Tracker/';
const base=new URL(origin);
async function request(url){
 const res=await fetch(url,{redirect:'follow',headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(25000)});
 const text=await res.text();
 if(!res.ok)throw Error(url+' HTTP '+res.status);
 return {res,text};
}
const {res,text:html}=await request(base.href+'?aurora_smoke='+Date.now());
if(!html.includes('id="root"'))throw Error('Missing root element in served HTML');
const js=[...html.matchAll(/<script[^>]+src=["']([^"']+\.js)["']/g)].map(m=>m[1]);
const css=[...html.matchAll(/<link[^>]+href=["']([^"']+\.css)["']/g)].map(m=>m[1]);
if(!js.length)throw Error('No built JS asset in published index');
const paths=[...js,...css];
for(const path of paths){
 const url=new URL(path,base).href;
 const asset=await request(url);
 const mime=asset.res.headers.get('content-type')||'';
 const isJs=path.includes('.js');
 if(!mime.includes(isJs?'javascript':'css'))throw Error('Invalid MIME '+mime+' for '+url);
 if(asset.text.trim().startsWith('<!doctype html'))throw Error('HTML returned instead of asset: '+url);
 console.log('OK',url,asset.res.status,mime,asset.text.length+' bytes');
}
console.log('PASS: GitHub Pages HTML, '+paths.length+' JS/CSS assets');
