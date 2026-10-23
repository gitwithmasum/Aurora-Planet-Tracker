import React,{useEffect,useRef,useState} from 'react';
import {Download,RefreshCcw,WifiOff,X,Smartphone} from 'lucide-react';
import {useLanguage} from './i18n.jsx';
import './PWAStatus.css';

// Install assistance works both with Chromium's native prompt and browsers
// (notably iOS Safari) that require the user to use their browser menu.
export default function PWAStatus(){
 const {t,language}=useLanguage();
 const [prompt,setPrompt]=useState(null),[online,setOnline]=useState(navigator.onLine);
 const [waiting,setWaiting]=useState(null);
 const [updating,setUpdating]=useState(false);
 const [message,setMessage]=useState('');
 const [helpOpen,setHelpOpen]=useState(false);
 const userApproved=useRef(false);
 const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent||'');
 useEffect(()=>{
  let live=true,registration=null,installedWorker=null,lastCheck=0;
  function checkForUpdate(){
   if(!live||!registration||!navigator.onLine||document.visibilityState!=='visible')return;
   const timestamp=Date.now();
   if(timestamp-lastCheck<5*60*1000)return;
   lastCheck=timestamp;
   registration.update().catch(()=>{});
  }
  const onPrompt=e=>{e.preventDefault();if(live)setPrompt(e)};
  const onInstalled=()=>{setPrompt(null);setHelpOpen(false);setMessage(language==='bn'?'অ্যাপ ইনস্টল হয়েছে।':'App installed.')};
  const onOnline=()=>{setOnline(true);checkForUpdate()};
  const onOffline=()=>setOnline(false);
  const onVisible=()=>{if(document.visibilityState==='visible')checkForUpdate()};
  window.addEventListener('beforeinstallprompt',onPrompt);
  window.addEventListener('appinstalled',onInstalled);
  window.addEventListener('online',onOnline);
  window.addEventListener('offline',onOffline);
  document.addEventListener('visibilitychange',onVisible);
  const onWorkerState=()=>{
   if(live&&installedWorker?.state==='installed'&&navigator.serviceWorker.controller)setWaiting(installedWorker);
  };
  const onUpdate=()=>{
   installedWorker?.removeEventListener('statechange',onWorkerState);
   installedWorker=registration?.installing||null;
   installedWorker?.addEventListener('statechange',onWorkerState);
  };
  const onController=()=>{
   if(userApproved.current)window.location.reload();
   else if(live)setWaiting(null);
  };
  if('serviceWorker'in navigator){
   navigator.serviceWorker.ready.then(reg=>{
    if(!live)return;
    registration=reg;
    if(reg.waiting&&navigator.serviceWorker.controller)setWaiting(reg.waiting);
    reg.addEventListener('updatefound',onUpdate);
    if(reg.installing)onUpdate();
    checkForUpdate();
   }).catch(()=>{});
   navigator.serviceWorker.addEventListener('controllerchange',onController);
  }
  return()=>{
   live=false;
   registration?.removeEventListener('updatefound',onUpdate);
   installedWorker?.removeEventListener('statechange',onWorkerState);
   window.removeEventListener('beforeinstallprompt',onPrompt);
   window.removeEventListener('appinstalled',onInstalled);
   window.removeEventListener('online',onOnline);
   window.removeEventListener('offline',onOffline);
   document.removeEventListener('visibilitychange',onVisible);
   navigator.serviceWorker?.removeEventListener('controllerchange',onController);
  };
 },[language]);
 async function install(){
  if(!prompt){setHelpOpen(true);return}
  try{await prompt.prompt();const choice=await prompt.userChoice;setPrompt(null);if(choice?.outcome==='accepted')setMessage(language==='bn'?'ইনস্টল শুরু হয়েছে।':'Installation started.')}
  catch{setMessage(language==='bn'?'ব্রাউজারের মেনু থেকে Install app বা Add to Home Screen বেছে নাও।':'Open your browser menu and choose Install app or Add to Home Screen.');setHelpOpen(true)}
 }
 function applyUpdate(){
  if(!waiting)return;
  const confirmText=language==='bn'?
   'অ্যাপ আপডেট হলে পেজ রিলোড হবে। আগে যেকোনো অসম্পূর্ণ নোট সেভ এবং প্রয়োজন হলে Recovery Center থেকে ব্যাকআপ নাও। এখন আপডেট করবে?':
   'The page will reload to update. Save unfinished notes and consider exporting a Recovery Center backup first. Update now?';
  if(!window.confirm(confirmText))return;
  userApproved.current=true;setUpdating(true);
  waiting.postMessage({type:'SKIP_WAITING'});
 }
 const bn=language==='bn';
 return <>
  <div className="pwaActions" aria-live="polite">
   {!online&&<span className="pwaOffline"><WifiOff size={14}/>{t('offline')}</span>}
   <button type="button" onClick={install}><Download size={14}/>{prompt?(bn?'ইনস্টল':'Install'):(bn?'মোবাইলে নিন':'Get mobile app')}</button>
   {waiting&&<button type="button" disabled={updating} onClick={applyUpdate}><RefreshCcw size={14}/>{updating?(bn?'আপডেট হচ্ছে':'Updating…'):t('update')}</button>}
   {message&&<span className="pwaOffline" role="status">{message}</span>}
  </div>
  {helpOpen&&<div className="pwaInstallBackdrop" onClick={()=>setHelpOpen(false)}>
   <section className="pwaInstallDialog" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title" onClick={e=>e.stopPropagation()}>
    <div className="pwaInstallTitle"><Smartphone size={20}/><h2 id="pwa-install-title">{bn?'মোবাইলে Aurora Planet Tracker ইনস্টল':'Install Aurora Planet Tracker'}</h2><button type="button" aria-label={bn?'বন্ধ করুন':'Close'} onClick={()=>setHelpOpen(false)}><X size={18}/></button></div>
    <p>{bn?'এটি ওয়েব অ্যাপ—ইনস্টল করলে ফোনের হোম স্ক্রিন থেকে অ্যাপের মতো খুলবে। প্রথমবার লোড করতে ইন্টারনেট লাগবে।':'This is an installable web app. Add it to your home screen to launch it like an app. Internet is needed for the first load.'}</p>
    {isIOS?<ol><li>{bn?'Safari-তে এই সাইটটি খোলো।':'Open this site in Safari.'}</li><li>{bn?'Share বোতাম চাপো।':'Tap the Share button.'}</li><li>{bn?'Add to Home Screen বেছে নিয়ে Add চাপো।':'Choose “Add to Home Screen”, then tap “Add”.'}</li></ol>:<ol><li>{bn?'Chrome-এ এই সাইটটি খোলো এবং অনলাইন থাকো।':'Open this site in Chrome while online.'}</li><li>{bn?'⋮ মেনু খোলো। Install app বা Add to Home screen বেছে নাও।':'Open the ⋮ menu and choose “Install app” or “Add to Home screen”.'}</li><li>{bn?'Install/Add নিশ্চিত করো। এরপর হোম স্ক্রিনের আইকন থেকে খুলো।':'Confirm Install/Add, then launch it from the home-screen icon.'}</li></ol>}
    <p className="pwaInstallNote">{bn?'Install অপশন না দেখালে Chrome/Safari-তে সাইটটি সরাসরি খোলো, ইন-অ্যাপ ব্রাউজার নয়।':'If Install is missing, open the site directly in Chrome/Safari rather than an in-app browser.'}</p>
    <button type="button" className="pwaInstallClose" onClick={()=>setHelpOpen(false)}>{bn?'বুঝেছি':'Got it'}</button>
   </section>
  </div>}
 </>;
}
