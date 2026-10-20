import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildOfflineList} from '../scripts/build-offline-manifest.mjs';
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'aurora-offline-test-'));
 mkdirSync(join(root,'assets'));
 for(const [file,value] of [['main-abc.js','entry'],['planner-def.js','dynamic'],['style-abc.css','css']])
  writeFileSync(join(root,'assets',file),value);
 return root;
}
const manifest={
 'src/main.jsx':{file:'assets/main-abc.js',isEntry:true,css:['assets/style-abc.css'],imports:['dynamic']},
 'src/RecoveryCenter.jsx':{file:'assets/planner-def.js',isDynamicEntry:true}
};
test('offline asset list includes entry, CSS and dynamically imported route',()=>{
 const root=fixture();
 try{
  const m=buildOfflineList(manifest,root);
  assert.equal(m.version,'5.3.0');
  assert.equal(m.assets.length,3);
  assert.ok(m.assets.includes('assets/main-abc.js'));
  assert.ok(m.assets.includes('assets/planner-def.js'));
  assert.ok(m.assets.includes('assets/style-abc.css'));
  assert.equal(m.omitted,0);
 }finally{rmSync(root,{recursive:true,force:true})}
});
test('max file count limits optional chunks but always retains the main entry',()=>{
 const root=fixture();
 try{
  const m=buildOfflineList(manifest,root,{maxFiles:1});
  assert.deepEqual(m.assets,['assets/main-abc.js']);
  assert.equal(m.omitted,2);
 }finally{rmSync(root,{recursive:true,force:true})}
});
test('a zero budget that excludes main app bundle fails closed',()=>{
 const root=fixture();
 try{assert.throws(()=>buildOfflineList(manifest,root,{maxBytes:1}),/Core entrypoint exceeded/)}
 finally{rmSync(root,{recursive:true,force:true})}
});
test('malformed manifests and paths are rejected or ignored safely',()=>{
 const root=fixture();
 try{
  assert.throws(()=>buildOfflineList(null,root));
  const x=buildOfflineList({...manifest,malicious:{file:'../secrets.js'}},root);
  assert.equal(x.assets.length,3);
 }finally{rmSync(root,{recursive:true,force:true})}
});
