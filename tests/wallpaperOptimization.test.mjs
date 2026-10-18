import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';

const sourcePath=new URL('../src/assets/aurora-halftone.svg',import.meta.url);
const wallpaperPath=new URL('../src/assets/aurora-halftone.webp',import.meta.url);

test('lightweight wallpaper remains bundled and preserves editable SVG source',()=>{
 const image=readFileSync(wallpaperPath);
 assert.equal(image.toString('ascii',0,4),'RIFF');
 assert.equal(image.toString('ascii',8,12),'WEBP');
 assert.ok(image.length<statSync(sourcePath).size*.5,'Raster wallpaper should be substantially smaller than SVG');
 const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
 assert.match(app,/import halftoneArtwork from '\.\/assets\/aurora-halftone\.webp'/);
});

test('halftone scrolling avoids fixed-background and transparent blur compositing',()=>{
 const css=readFileSync(new URL('../src/HalftoneTheme.css',import.meta.url),'utf8');
 assert.match(css,/background-attachment:scroll,scroll/);
 assert.doesNotMatch(css,/background-attachment:fixed,fixed/);
 assert.match(css,/\.theme-halftone \.noise\{display:none\}/);
 assert.match(css,/backdrop-filter:none/);
});
