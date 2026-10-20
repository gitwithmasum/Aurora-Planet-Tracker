// Convert Vite's emitted manifest into a conservative, portable offline asset list.
// Only JS/CSS bundles are eagerly cached. Large imagery remains on-demand.
import {readFileSync,writeFileSync,statSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const OFFLINE_MAX_BYTES=24*1024*1024;
export const OFFLINE_MAX_FILES=180;
export function buildOfflineList(manifest,root,{maxBytes=OFFLINE_MAX_BYTES,maxFiles=OFFLINE_MAX_FILES}={}){
 if(!manifest||typeof manifest!=='object'||Array.isArray(manifest))throw Error('Missing Vite build manifest');
 const files=new Map();
 for(const entry of Object.values(manifest)){
  if(!entry||typeof entry!=='object')continue;
  const names=[entry.file,...(entry.css||[])];
  for(const name of names){
   if(typeof name!=='string'||!/^assets\/[a-zA-Z0-9._/-]+\.(?:js|css)$/.test(name)||name.includes('..'))continue;
   if(files.has(name))continue;
   const size=statSync(join(root,...name.split('/'))).size;
   files.set(name,{path:name,size,critical:entry.isEntry===true&&name===entry.file});
  }
 }
 const sorted=[...files.values()].sort((a,b)=>Number(b.critical)-Number(a.critical)||a.path.localeCompare(b.path));
 let bytes=0;
 const entries=[];
 for(const file of sorted){
  if(entries.length>=maxFiles||bytes+file.size>maxBytes){
   if(file.critical)throw Error('Core entrypoint exceeded offline budget');
   continue;
  }
  entries.push(file.path);bytes+=file.size;
 }
 if(!entries.some(x=>sorted.some(y=>y.path===x&&y.critical)))throw Error('No main JS entrypoint found in offline manifest');
 return {format:'aurora-offline-assets-v1',version:'4.7.0',generatedFor:'Vite static bundles',assets:entries,bytes,omitted:sorted.length-entries.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const root=join(process.cwd(),'dist');
 const manifest=JSON.parse(readFileSync(join(root,'.vite','manifest.json'),'utf8'));
 const list=buildOfflineList(manifest,root);
 mkdirSync(root,{recursive:true});
 writeFileSync(join(root,'offline-assets.json'),JSON.stringify(list,null,2)+'\n');
 console.log('Aurora offline manifest:',list.assets.length,'JS/CSS assets,',list.bytes,'bytes,',list.omitted,'omitted');
}
