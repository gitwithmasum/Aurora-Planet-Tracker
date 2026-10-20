import React,{useEffect,useRef,useState} from 'react';
import {Download,RefreshCcw,WifiOff} from 'lucide-react';
import {useLanguage} from './i18n.jsx';
import './PWAStatus.css';

// v4.6: Never reload a working session just because a service worker changed
// in another tab. Only reload after an explicit user-approved update.
export default function PWAStatus(){
 const {t,language}=useLanguage();
 const [prompt,setPrompt]=useState(null),[online,setOnline]=useState(navigator.onLine);
 const [waiting,setWaiting]=useState(null);
 const [updating,setUpdating]=useState(false);
 const [message,setMessage]=useState('');
 const userApproved=useRef(false);
 useEffect(()=>{
  const onPrompt=e=>{e.preventDefault();setPrompt(e)};
  const onInstalled=()=>setPrompt(null);
  const onOnline=()=>setOnline(true),onOffline=()=>setOnline(false);
  window.addEventListener('beforeinstallprompt',onPrompt);
  window.addEventListener('appinstalled',onInstalled);
  window.addEventListener('online',onOnline);
  window.addEventListener('offline',onOffline);
  let live=true,registration=null,installedWorker=null;
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
   navigator.serviceWorker?.removeEventListener('controllerchange',onController);
  };
 },[]);
 async function install(){
  if(!prompt)return;
  try{await prompt.prompt();await prompt.userChoice;setPrompt(null)}
  catch{setMessage(language==='bn'?'ইনস্টল অনুরোধ করা যায়নি।':'Install prompt unavailable.')}
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
 return <div className="pwaActions" aria-live="polite">
  {!online&&<span className="pwaOffline"><WifiOff size={14}/>{t('offline')}</span>}
  {prompt&&<button type="button" onClick={install}><Download size={14}/>{t('install')}</button>}
  {waiting&&<button type="button" disabled={updating} onClick={applyUpdate}><RefreshCcw size={14}/>{updating?(language==='bn'?'আপডেট হচ্ছে':'Updating…'):t('update')}</button>}
  {message&&<span className="pwaOffline" role="status">{message}</span>}
 </div>;
}
