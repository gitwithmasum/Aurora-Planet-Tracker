import test from 'node:test';
import assert from 'node:assert/strict';
import {planObservationWindows,normalizeWatchlist,validPlannerCoordinates,observationCalendar,escapeCalendarText} from '../src/observationPlannerCore.mjs';

const base=Date.parse('2026-10-20T00:00:00Z');
const mars={id:'planet:Mars',name:'Mars',type:'planet'};
const m31={id:'galaxy:m31',name:'Andromeda Galaxy',type:'galaxy'};
const at=(time)=>Math.round((time-base)/(15*60000));
const criteria={targets:[mars],startMs:base,hours:2,stepMinutes:15,minAltitude:25,sunLimit:-12};
test('continuous qualified samples create conservative windows',()=>{
 const result=planObservationWindows({...criteria,getSunAltitude:()=>-17,getTargetPosition:(_,t)=>({alt:at(t)<3?36:8,az:75})});
 assert.equal(result.length,1);
 assert.equal(result[0].windows.length,1);
 assert.equal(result[0].next.startMs,base);
 assert.equal(result[0].next.endMs,base+2*15*60000);
 assert.equal(result[0].next.peakAzimuth,75);
});
test('daylight and twilight are excluded regardless of target elevation',()=>{
 const result=planObservationWindows({...criteria,getSunAltitude:t=>at(t)<=2?-8:-20,getTargetPosition:()=>({alt:50,az:180})});
 assert.equal(result[0].next.startMs,base+3*15*60000);
 assert.equal(result[0].next.endMs,base+8*15*60000);
});
test('single sample is not treated as a usable time interval',()=>{
 const result=planObservationWindows({...criteria,getSunAltitude:()=>-20,getTargetPosition:(_,t)=>({alt:at(t)===3?70:5,az:90})});
 assert.deepEqual(result,[]);
});
test('disjoint windows are retained and strongest sample is identified',()=>{
 const result=planObservationWindows({...criteria,getSunAltitude:()=>-20,getTargetPosition:(_,t)=>{
  const i=at(t);return {alt:i===1?60:[0,2,5,6].includes(i)?30:0,az:10+i};
 }});
 assert.equal(result[0].windows.length,2);
 assert.equal(result[0].windows[0].peakMs,base+15*60000);
 assert.equal(result[0].windows[0].peakAltitude,60);
});
test('missing positions, invalid model settings, and no targets fail safely',()=>{
 assert.deepEqual(planObservationWindows({...criteria,minAltitude:91,getSunAltitude:()=>-20,getTargetPosition:()=>({alt:30,az:3})}),[]);
 assert.deepEqual(planObservationWindows({...criteria,getSunAltitude:()=>-20,getTargetPosition:()=>null}),[]);
 assert.deepEqual(planObservationWindows({...criteria,targets:[],getSunAltitude:()=>-20,getTargetPosition:()=>({alt:30,az:3})}),[]);
});
test('results are sorted by next window before display',()=>{
 const targets=[mars,m31];
 const rows=planObservationWindows({...criteria,targets,getSunAltitude:()=>-20,getTargetPosition:(target,t)=>({
  alt:target.id===mars.id?at(t)>=4?40:0:45,az:180
 })});
 assert.equal(rows[0].id,m31.id);
 assert.equal(rows[1].id,mars.id);
});
test('coordinates and local shortlist reject invalid entries',()=>{
 assert.equal(validPlannerCoordinates({lat:23.8,lon:90.4}),true);
 assert.equal(validPlannerCoordinates({lat:0,lon:180}),true);
 assert.equal(validPlannerCoordinates({lat:'23.8',lon:90.4}),false);
 assert.equal(validPlannerCoordinates({lat:91,lon:0}),false);
 assert.deepEqual(normalizeWatchlist(['planet:Mars','bad','planet:Mars',1],['planet:Mars']),['planet:Mars']);
});
test('calendar output contains UTC events, escaped names and no remote reminders',()=>{
 const calendar=observationCalendar([{id:'planet:Mars',name:'Mars, red planet',startMs:base,endMs:base+30*60000}],{createdMs:base,observerLabel:'Observer; test'});
 assert.ok(calendar.startsWith('BEGIN:VCALENDAR\r\n'));
 assert.ok(calendar.includes('DTSTART:20261020T000000Z'));
 assert.ok(calendar.includes('DTEND:20261020T003000Z'));
 assert.ok(calendar.includes('SUMMARY:Observe Mars\\, red planet'));
 assert.ok(calendar.includes('Observer\\; test'));
 assert.ok(calendar.includes('END:VCALENDAR\r\n'));
 assert.equal(calendar.includes('BEGIN:VALARM'),false);
 assert.equal(observationCalendar([]),null);
 assert.equal(escapeCalendarText('A\\B, C; D\nE'),'A\\\\B\\, C\\; D\\nE');
});
