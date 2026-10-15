import React from 'react';
export default class FeatureBoundary extends React.Component{
 constructor(props){super(props);this.state={error:null}}
 static getDerivedStateFromError(error){return {error}}
 componentDidCatch(error,info){console.error('Aurora feature failed:',this.props.name,error,info?.componentStack)}
 render(){
  if(!this.state.error)return this.props.children;
  return <section style={{background:'#0b1b34',border:'1px solid #487998',borderRadius:12,padding:20,margin:'16px 0',color:'#d5f3ff'}}>
   <strong>{this.props.name} is temporarily unavailable.</strong>
   <p style={{fontSize:13,color:'#a4c4d6'}}>The rest of Aurora remains available. This section may have encountered a loading or graphics error.</p>
   <details><summary>Technical details</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:12}}>{String(this.state.error?.message||this.state.error)}</pre></details>
   <button style={{marginTop:12,padding:'9px 14px',background:'#55cae0',border:0,borderRadius:6,color:'#051627',cursor:'pointer'}} onClick={()=>this.setState({error:null})}>Retry section</button>
  </section>
 }
}