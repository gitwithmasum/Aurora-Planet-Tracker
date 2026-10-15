import React from 'react';
export default class AppErrorBoundary extends React.Component {
 constructor(props){super(props);this.state={error:null}}
 static getDerivedStateFromError(error){return {error}}
 componentDidCatch(error,info){console.error('Aurora app render failed',error,info.componentStack)}
 render(){
  if(!this.state.error)return this.props.children;
  return <div style={{minHeight:'100vh',background:'#061126',color:'#e1f6ff',display:'grid',placeItems:'center',padding:24,fontFamily:'system-ui'}}>
   <section style={{maxWidth:650,width:'100%',border:'1px solid #3d7899',padding:24,borderRadius:14,background:'#10223d'}}>
    <h1 style={{marginTop:0}}>Aurora recovery mode</h1>
    <p>The app hit a browser rendering error. You can reset the offline cache and reload safely; your saved observations and preferences will not be cleared.</p>
    <details style={{marginBottom:18}}><summary>Technical error</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{String(this.state.error?.message||this.state.error)}</pre></details>
    <button style={{background:'#5fd9ed',color:'#061126',padding:'12px 18px',border:'none',cursor:'pointer',borderRadius:7,fontWeight:700}} onClick={async()=>{
      try{if('serviceWorker'in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.filter(r=>r.scope.startsWith(location.origin+import.meta.env.BASE_URL)).map(r=>r.unregister()))}
      if('caches'in window){const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('aurora-')).map(k=>caches.delete(k)));}
      }catch(e){console.warn('Cache recovery incomplete',e)}
      location.reload();
    }}>Reset cached app and reload</button>
   </section>
  </div>;
 }
}
