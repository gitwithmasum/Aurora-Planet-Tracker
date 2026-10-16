import test from 'node:test';
import assert from 'node:assert/strict';
import {validateImagerySnapshot,imageryAssetUrl,NASA_IMAGERY_ATTRIBUTION} from '../src/earthImageryData.mjs';
test('valid NASA GIBS daily snapshot validates date and local JPEG filename',()=>{
 const row={date:'2026-10-14',file:'modis-terra-2026-10-14.jpg',width:1024,height:512};
 assert.equal(validateImagerySnapshot(row).date,row.date);
 assert.match(imageryAssetUrl(row.file),/earth-imagery\/modis-terra-2026-10-14\.jpg$/);
 assert.match(NASA_IMAGERY_ATTRIBUTION,/NASA/);
});
test('reject out-of-range dates and unsafe filenames',()=>{
 assert.equal(validateImagerySnapshot({date:'2026-13-43',file:'modis-terra-2026-13-43.jpg',width:1024,height:512}),null);
 assert.equal(imageryAssetUrl('../evil.jpg'),null);
 assert.equal(validateImagerySnapshot({date:'2026-10-14',file:'../secret.jpg',width:1024,height:512}),null);
});
