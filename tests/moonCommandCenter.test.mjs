import test from 'node:test';
import assert from 'node:assert/strict';
import {searchMoonCommand} from '../src/moonCommandCenter.mjs';

test('v6.0 global moon command search matches exact moon names and mission context',()=>{
 assert.equal(searchMoonCommand('Europa')[0].id,'europa');
 assert.ok(searchMoonCommand('Europa Clipper').some(m=>m.id==='europa'));
 assert.ok(searchMoonCommand('Saturn').every(m=>m.planet==='Saturn'));
 assert.deepEqual(searchMoonCommand('   '),[]);
});

test('global command search supports discovery and geology terms without inventing records',()=>{
 assert.ok(searchMoonCommand('volcanic').some(m=>m.id==='io'));
 assert.equal(searchMoonCommand('nonexistent-moon-xyz').length,0);
});
