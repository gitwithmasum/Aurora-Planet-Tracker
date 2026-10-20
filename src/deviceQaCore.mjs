// v4.9 — self-reported hardware QA, never automated device certification.
export const DEVICE_QA_KEY='aurora-device-qa-v1';
export const DEVICE_QA_FORMAT='aurora-device-qa-report-v1';
export const DEVICE_CHECKS=[
 {id:'install',en:'Install via browser and launch from home screen / Start menu',bn:'ব্রাউজার থেকে ইনস্টল করে অ্যাপ আইকন থেকে চালু করুন'},
 {id:'offline-reload',en:'Load once online, disconnect internet, close/reopen and navigate offline',bn:'অনলাইনে লোডের পর ইন্টারনেট বন্ধ করে পুনরায় খুলুন'},
 {id:'touch',en:'Test sidebar, taps, scroll and 320–393px layout on a touch device',bn:'Touch, scrolling ও mobile layout পরীক্ষা করুন'},
 {id:'journal',en:'Create a disposable journal record; reload and confirm it persists',bn:'একটি পরীক্ষামূলক journal record save করে reload করুন'},
 {id:'restore',en:'Export a backup and restore disposable data after a safe preview',bn:'পরীক্ষামূলক data backup ও restore করুন'},
 {id:'sky',en:'Check sky map interaction and reduced-motion rendering comfort',bn:'Sky map ও reduced-motion পরীক্ষা করুন'},
 {id:'permissions',en:'Check GPS/camera/compass permissions only if supported and wanted',bn:'প্রয়োজনে GPS, camera ও compass অনুমতি পরীক্ষা করুন'},
 {id:'upgrade',en:'Confirm pending PWA update asks permission and preserves journal',bn:'PWA update-এর অনুমতি ও journal data পরীক্ষা করুন'}
];
export const QA_STATUSES=['untested','pass','fail','blocked'];
export function devicePlatform(ua=''){
 const s=String(ua);
 if(/Android/i.test(s))return 'Android';
 if(/iPhone|iPad|iPod/i.test(s))return 'iOS/iPadOS';
 if(/Windows/i.test(s))return 'Windows';
 if(/Macintosh|Mac OS X/i.test(s))return 'macOS';
 if(/Linux/i.test(s))return 'Linux';
 return 'Other';
}
export function normalizeDeviceQa(value){
 const input=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const raw=input.checks&&typeof input.checks==='object'&&!Array.isArray(input.checks)?input.checks:{};
 const checks={};
 for(const {id}of DEVICE_CHECKS)checks[id]=QA_STATUSES.includes(raw[id])?raw[id]:'untested';
 return {checks};
}
export function qaSummary(qa){
 const current=normalizeDeviceQa(qa).checks;
 const stats={pass:0,fail:0,blocked:0,untested:0};
 for(const {id}of DEVICE_CHECKS)stats[current[id]]++;
 return {...stats,total:DEVICE_CHECKS.length,manualComplete:stats.pass===DEVICE_CHECKS.length};
}
export function qaReport({qa,probes,platform,createdAt,version}){
 const normalized=normalizeDeviceQa(qa);
 const evidence={};
 const supported=['standalone','online','serviceWorker','controller','cacheComplete','cachedAssets','listedAssets','storageWritable','storageBytes','storageQuota','touch','reducedMotion','screenWidth','screenHeight','frameCadence'];
 for(const key of supported){
  const val=probes?.[key];
  if(typeof val==='boolean'||typeof val==='number'&&Number.isFinite(val)||val===null)evidence[key]=val;
 }
 return {format:DEVICE_QA_FORMAT,appVersion:String(version||'unknown').slice(0,30),
  createdAt:String(createdAt||'').slice(0,40),
  platform:['Windows','Android','iOS/iPadOS','macOS','Linux','Other'].includes(platform)?platform:'Other',
  measuredIn:'This browser only; self-reported checklist is not independently validated',
  probeResults:evidence,
  checklist:normalized.checks,
  summary:qaSummary(normalized),
  disclaimer:'Browser frame cadence is NOT WebGL GPU FPS. Install, offline and sensor checks require physical-device verification. No notes, location, IP, account or user-agent string is exported.'};
}
