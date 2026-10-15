import React,{useMemo,useState} from 'react';
import {ClipboardCheck,Download,RotateCcw} from 'lucide-react';
import './FieldTest.css';
const ITEMS=[
 {id:'secure',title:'HTTPS / secure origin',detail:'Camera and device permission APIs require a secure context.'},
 {id:'camera',title:'Rear camera preview',detail:'Preview should show the environment camera without freezing or stretching.'},
 {id:'location',title:'Observer coordinates checked',detail:'Verify city and geographic coordinates before interpreting sky positions.'},
 {id:'heading',title:'Compass reading compared with a reference',detail:'Compare a known cardinal direction; note any bias or magnetic interference.'},
 {id:'rotation',title:'Portrait and landscape checked',detail:'Rotate device and confirm the on-screen markers remain stable relative to the intended heading.'},
 {id:'target',title:'Known target visually aligned',detail:'Compare with a clearly identified visible planet or distant terrestrial reference; this is a manual check.'},
 {id:'fallback',title:'Manual controls verified',detail:'With sensors unavailable, heading/elevation/roll/FOV controls should remain functional.'},
 {id:'lifecycle',title:'Camera restart tested',detail:'Stop/start camera and switch tabs; verify camera access recovers.'}
];
export default function FieldTest({data}){
 const [checks,setChecks]=useState({});
 const [notes,setNotes]=useState('');
 const [device,setDevice]=useState('');
 const [result,setResult]=useState('');
 const [message,setMessage]=useState('');
 const complete=ITEMS.filter(item=>checks[item.id]).length;
 const diagnostics=useMemo(()=>({version:'1.7.0',collectedAt:new Date().toISOString(),browser:typeof navigator==='undefined'?'unknown':navigator.userAgent,secureContext:typeof window!=='undefined'&&window.isSecureContext===true,screenAngle:data.screenAngle,cameraActive:data.camera,sensorFresh:data.sensorFresh,sensorAbsolute:data.sensorAbsolute,videoWidth:data.videoWidth,videoHeight:data.videoHeight,viewportWidth:data.viewportWidth,viewportHeight:data.viewportHeight,heading:data.heading,elevation:data.elevation,roll:data.roll,estimatedHfov:data.fov,deviceModel:device,manualChecklist:Object.fromEntries(ITEMS.map(item=>[item.id,!!checks[item.id]])),result,notes}),[data,checks,result,notes,device]);
 function exportReport(){
  try{
   const blob=new Blob([JSON.stringify(diagnostics,null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='aurora-ar-field-test.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);setMessage('Diagnostic report downloaded to this device.');
  }catch{setMessage('Report export is unavailable in this browser.')}
 }
 return <section className="fieldQa">
 <div className="fieldHead"><div><span className="eyebrow">AR QUALITY ASSURANCE / v1.7</span><h4><ClipboardCheck size={20}/> Mobile field-test console</h4><p>Record real-device testing before claiming AR alignment accuracy. No report is uploaded; download and share it yourself if needed.</p></div><strong>{complete}/{ITEMS.length} CHECKS</strong></div>
 <div className="fieldGrid">{ITEMS.map(item=><label key={item.id} className={'fieldCheck '+(checks[item.id]?'checked':'')}><input type="checkbox" checked={!!checks[item.id]} onChange={event=>setChecks(old=>({...old,[item.id]:event.target.checked}))}/><span><b>{item.title}</b><small>{item.detail}</small></span></label>)}</div>
 <div className="fieldInputs"><label>DEVICE / BROWSER MODEL<input value={device} onChange={e=>setDevice(e.target.value)} placeholder="e.g. Android Chrome / iPhone Safari"/></label><label>ALIGNMENT RESULT<select value={result} onChange={e=>setResult(e.target.value)}><option value="">Not measured yet</option><option value="aligned-manually">Aligned manually (unverified accuracy)</option><option value="noticeable-offset">Visible marker offset</option><option value="sensors-unavailable">Sensors not available</option><option value="camera-unavailable">Camera not available</option></select></label><label className="fieldNotes">TEST NOTES<textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Record approximate heading error, device orientation, reproducible bugs..."/></label></div>
 <div className="fieldTelemetry"><span>SECURE: <b>{diagnostics.secureContext?'YES':'NO'}</b></span><span>CAMERA: <b>{data.camera?'ACTIVE':'OFF'}</b></span><span>SENSOR: <b>{data.sensorFresh?'FRESH':'INACTIVE / STALE'}</b></span><span>VIDEO: <b>{data.videoWidth&&data.videoHeight?data.videoWidth+'×'+data.videoHeight:'UNKNOWN'}</b></span></div>
 <div className="fieldActions"><button onClick={exportReport}><Download size={16}/> EXPORT LOCAL QA REPORT</button><button onClick={()=>{setChecks({});setNotes('');setResult('');setDevice('');setMessage('Checklist reset.')}}><RotateCcw size={16}/> RESET CHECKLIST</button></div>
 {message&&<p className="fieldMessage" role="status">{message}</p>}
 <p className="fieldCaution">Technical limits: sensor APIs do not independently establish optical axis or camera intrinsic parameters. A checked box documents your manual test, not proof of precision astronomy guidance. Report omits GPS coordinates by design.</p>
 </section>
}
