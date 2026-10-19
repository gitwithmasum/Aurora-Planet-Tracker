import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shouldAnimateScene,isSolarSceneTab,formatBrowserFrameRate} from '../src/performance.mjs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('WebGL scene animates only when foreground, in view, unpaused and motion permitted',()=>{
 assert.equal(shouldAnimateScene(),true);
 assert.equal(shouldAnimateScene({pageVisible:false}),false);
 assert.equal(shouldAnimateScene({sceneVisible:false}),false);
 assert.equal(shouldAnimateScene({paused:true}),false);
 assert.equal(shouldAnimateScene({reducedMotion:true}),false);
 assert.equal(shouldAnimateScene({pageVisible:true,sceneVisible:true,paused:false,reducedMotion:false}),true);
});
test('solar-only viewport observation does not run on Dashboard or science modules',()=>{
 assert.equal(isSolarSceneTab('Solar System'),true);
 assert.equal(isSolarSceneTab('Command Center'),true);
 assert.equal(isSolarSceneTab('Dashboard'),false);
 assert.equal(isSolarSceneTab('Observation Analytics'),false);
 assert.equal(isSolarSceneTab('Satellite Tracker'),false);
});
test('rAF cadence parser never mislabels missing samples as measured frame rate',()=>{
 assert.equal(formatBrowserFrameRate(60,1000),60);
 assert.equal(formatBrowserFrameRate(0,1000),0);
 assert.equal(formatBrowserFrameRate(5,200),null);
 assert.equal(formatBrowserFrameRate(-1,1000),null);
 assert.equal(formatBrowserFrameRate(10,Number.NaN),null);
 assert.equal(formatBrowserFrameRate(2000,1000),240);
});
test('WebGL libraries are not eagerly imported by the app shell',()=>{
 const app=source('src/App.jsx');
 assert.match(app,/SolarScene=lazy\(\(\)=>import\('\.\/SolarScene\.jsx'\)\)/);
 assert.doesNotMatch(app,/^import\s+.*from ['"](?:three|@react-three\/fiber|@react-three\/drei)['"]/m);
 assert.match(app,/<Suspense fallback=\{<p className="eyebrow" role="status">Loading Solar System scene/);
});
test('solar scene retains the original physically grounded visual modules',()=>{
 const scene=source('src/SolarScene.jsx');
 assert.match(scene,/export default function SolarScene/);
 assert.match(scene,/EarthEffects/);
 assert.match(scene,/SolarBloom/);
 assert.match(scene,/SolarRealism\.jsx/);
 assert.match(scene,/planets\.map/);
 assert.match(scene,/frameloop=\{active\?'always':'demand'\}/);
 assert.match(scene,/powerPreference:quality==='low'\?'low-power':'high-performance'/);
});
test('scroll offscreen pauses animation without disabling controls or breaking the observer',()=>{
 const app=source('src/App.jsx');
 assert.match(app,/new IntersectionObserver/);
 assert.match(app,/observer\.disconnect\(\)/);
 assert.match(app,/ref=\{sceneViewport\}/);
 assert.match(app,/sceneAnimated=shouldAnimateScene/);
 assert.match(app,/active=\{sceneAnimated\}/);
 assert.match(app,/paused=\{!sceneAnimated\}/);
 assert.match(app,/if\(!pageVisible\)return/);
});
test('performance HUD is opt-in and labels browser cadence, not WebGL FPS',()=>{
 const app=source('src/App.jsx');
 const perf=source('src/PerformanceDiagnostics.jsx');
 assert.match(app,/\{showPerf&&<Suspense fallback=\{null\}>/);
 assert.match(app,/aria-pressed=\{showPerf\}/);
 assert.match(perf,/requestAnimationFrame\(sample\)/);
 assert.match(perf,/cancelAnimationFrame\(raf\)/);
 assert.match(perf,/NOT a measured GPU draw FPS/);
});
test('scroll-performance CSS removes large sticky blur while preserving accessible buttons',()=>{
 const css=source('src/style.css');
 assert.match(css,/html\{scroll-behavior:auto\}/);
 assert.match(css,/\.app \.auroraSidebar/);
 assert.match(css,/backdrop-filter:none!important/);
 assert.match(css,/content-visibility:auto/);
 assert.match(css,/\.auroraPerfToggle:focus-visible/);
});
