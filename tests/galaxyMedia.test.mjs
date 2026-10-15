import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const dir=new URL('../public/galaxy-images/',import.meta.url);
const source=JSON.parse(readFileSync(new URL('SOURCES.json',dir),'utf8'));
test('verified local Hubble images exist for Whirlpool and Sombrero',()=>{
 for(const id of ['m51','m104']){
  assert.ok(source[id]?.page?.startsWith('https://science.nasa.gov/asset/hubble/'));
  assert.ok(source[id]?.credit?.includes('NASA'));
  assert.ok(existsSync(new URL(id+'.jpg',dir)),id+' image must be committed');
  assert.ok(source[id]?.dimensions?.[0]>=800);
 }
});
