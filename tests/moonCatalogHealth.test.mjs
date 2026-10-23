import test from 'node:test';
import assert from 'node:assert/strict';
import {MOONS,MOON_PLANETS} from '../src/moonCatalog.mjs';
import {auditMoonCatalog} from '../src/moonCatalogHealth.mjs';

test('v6.1 curated moon catalog passes integrity audit',()=>{
 const report=auditMoonCatalog();
 assert.equal(report.total,MOONS.length);
 assert.equal(report.invalid,0,JSON.stringify(report.issues));
 assert.equal(report.issues.length,0);
});

test('catalog audit detects duplicate ids, missing missions, invalid physics and unsafe source URLs',()=>{
 const sample={...MOONS[0],id:'test-moon',missions:[],radiusKm:-1,source:'http://unsafe.example',dataSource:'',orbitSource:'https://example.test/orbit'};
 const report=auditMoonCatalog([sample,{...sample}],MOON_PLANETS);
 assert.ok(report.issues.some(issue=>issue.code==='duplicate-id'));
 assert.ok(report.issues.some(issue=>issue.code==='invalid-missions'));
 assert.ok(report.issues.some(issue=>issue.code==='invalid-physical-data'));
 assert.ok(report.issues.some(issue=>issue.code==='missing-source'));
 assert.ok(report.issues.some(issue=>issue.code==='missing-physical-source'));
 assert.equal(report.invalid,1);
});
