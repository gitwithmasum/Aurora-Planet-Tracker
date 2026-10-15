import React,{useEffect,useState} from 'react';
import {Download,RefreshCcw,WifiOff} from 'lucide-react';
import {useLanguage} from './i18n.jsx';
import './PWAStatus.css';
export default function PWAStatus(){
 const {t}=useLanguage();const [prompt,setPrompt]=useState(null),[update,setUpdate]=useState(false),[online,setOnline]=useState(navigator.onLine),[waiting,setWaiting]=useState(null);
 useEffect(()=>{
  const onPrompt=e=>{e.preventDefault();setPrompt(e)},onInstalled=()=>setPrompt(null);
  const onOnline=()=>setOnline(true),onOffline=()=>setOnline(false);
  window.addEventListener('beforeinstallprompt',onPrompt);window.addEventListener('appinstalled',onInstalled);
  window.addEventListener('online',onOnline);window.addEventListener('offline',onOffline);
  let active=true;
  if('serviceWorker'in navigator){
   navigator.serviceWorker.ready.then(reg=>{
    if(!active)return;
    if(reg.waiting){setWaiting(reg.waiting);setUpdate(true)}
    reg.addEventListener('updatefound',()=>{
     const worker=reg.installing;
     worker?.addEventListener('statechange',()=>{
      if(worker.state==='installed'&&navigator.serviceWorker.controller){setWaiting(worker);setUpdate(true)}
     });
    });
   }).catch(()=>{});
   navigator.serviceWorker.addEventListener('controllerchange',onController);
  }
  function onController(){window.location.reload()}
  return()=>{active=false;window.removeEventListener('beforeinstallprompt',onPrompt);window.removeEventListener('appinstalled',onInstalled);window.removeEventListener('online',onOnline);window.removeEventListener('offline',onOffline);navigator.serviceWorker?.removeEventListener('controllerchange',onController)}
 },[]);
 async function install(){if(!prompt)return;await prompt.prompt();await prompt.userChoice;setPrompt(null)}
 return <div className="pwaActions" aria-live="polite">{!online&&<span className="pwaOffline"><WifiOff size={14}/>{t('offline')}</span>}{prompt&&<button onClick={install}><Download size={14}/>{t('install')}</button>}{update&&waiting&&<button onClick={()=>waiting.postMessage({type:'SKIP_WAITING'})}><RefreshCcw size={14}/>{t('reload')}</button>}</div>
}
