import React,{useEffect,useRef,useState} from 'react';
import {Menu,GripVertical,RotateCcw,ChevronUp,ChevronDown} from 'lucide-react';
import './Sidebar.css';
const KEY='aurora-sidebar-order-v2';
const GROUPS=[
 {id:'explore',title:'EXPLORATION',items:['Command Center','Solar System','Planet Intelligence']},
 {id:'observe',title:'OBSERVATION',items:['Sky Tonight','Sky Tracker','AR Scanner','Galaxy Observatory']}
];
const ALL=GROUPS.flatMap(g=>g.items);
export function normalizeSidebarOrder(input){
 const saved=Array.isArray(input)?input.filter(x=>ALL.includes(x)):[];
 return [...new Set([...saved,...ALL])];
}
export default function Sidebar({nav,navKey,t,tab,onSelect,collapsed,onCollapse,menu,onClose}){
 const [order,setOrder]=useState(()=>{try{return normalizeSidebarOrder(JSON.parse(localStorage.getItem(KEY)))}catch{return [...ALL]}});
 const [editing,setEditing]=useState(false);
 const dragged=useRef(null);
 const touch=useRef(null);
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(order))}catch{}},[order]);
 useEffect(()=>{
  // Start swipe-to-open only on the left screen edge to avoid stealing sky-map/canvas gestures.
  const start=e=>{if(e.touches.length!==1)return;const p=e.touches[0];if(p.clientX>26||window.innerWidth>768||menu)return;touch.current={x:p.clientX,y:p.clientY};};
  const end=e=>{const from=touch.current;touch.current=null;if(!from||!e.changedTouches.length)return;const p=e.changedTouches[0];if(p.clientX-from.x>85&&Math.abs(p.clientY-from.y)<65)onOpenFromSwipe();};
  function onOpenFromSwipe(){document.querySelector('.sidebarMobileToggle')?.click();}
  document.addEventListener('touchstart',start,{passive:true});document.addEventListener('touchend',end,{passive:true});
  return()=>{document.removeEventListener('touchstart',start);document.removeEventListener('touchend',end)};
 },[menu]);
 function move(name,delta){
  const group=GROUPS.find(g=>g.items.includes(name));const positions=order.map((x,i)=>group.items.includes(x)?i:null).filter(i=>i!==null);
  const index=positions.findIndex(i=>order[i]===name);const dest=index+delta;
  if(dest<0||dest>=positions.length)return;
  const updated=[...order];[updated[positions[index]],updated[positions[dest]]]=[updated[positions[dest]],updated[positions[index]]];setOrder(updated);
 }
 function drop(target){
  const source=dragged.current;dragged.current=null;
  if(!source||source===target)return;
  const group=GROUPS.find(g=>g.items.includes(source));
  if(!group||!group.items.includes(target))return; // keep navigation groups meaningful
  setOrder(previous=>{const next=[...previous];next.splice(next.indexOf(source),1);next.splice(next.indexOf(target),0,source);return next});
 }
 const touchStart=e=>{if(e.touches.length!==1)return;touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};};
 const touchEnd=e=>{if(!menu||!touch.current)return;const point=e.changedTouches[0],start=touch.current;touch.current=null;if(start.x-point.clientX>65&&Math.abs(point.clientY-start.y)<70)onClose();};
 return <aside id="auroraSidebar" className="auroraSidebar" aria-label="Main navigation" onTouchStart={touchStart} onTouchEnd={touchEnd}>
  <div className="sidebarHeading">
   <span className="sidebarHeadingText">MISSION NAVIGATION</span>
   <button className="sidebarCollapseToggle" type="button" title={collapsed?'Expand sidebar':'Collapse sidebar'} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} aria-expanded={!collapsed} onClick={onCollapse}><Menu size={18}/></button>
  </div>
  <div className="sidebarQuickTools">
   <button type="button" aria-pressed={editing} title="Customize navigation order" onClick={()=>setEditing(x=>!x)}><GripVertical size={16}/><span>REORDER</span></button>
   {editing&&<button type="button" title="Reset navigation order" onClick={()=>setOrder([...ALL])}><RotateCcw size={15}/><span>RESET</span></button>}
  </div>
  <nav className="sidebarLinks" aria-label="Pages">
   {GROUPS.map(group=><div className="sidebarGroup" key={group.id}>
    <div className="sidebarGroupLabel">{group.title}</div>
    {order.filter(name=>group.items.includes(name)).map(name=>{
     const match=nav.find(([n])=>n===name);if(!match)return null;
     const Icon=match[1],items=order.filter(x=>group.items.includes(x)),position=items.indexOf(name);
     return <div key={name} className="sidebarLinkRow" draggable={editing} onDragStart={e=>{dragged.current=name;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',name)}} onDragOver={e=>{if(editing)e.preventDefault()}} onDrop={e=>{e.preventDefault();drop(name)}} onDragEnd={()=>{dragged.current=null}}>
       <button type="button" title={name} aria-label={name} aria-current={tab===name?'page':undefined} className={tab===name?'active':''} onClick={()=>onSelect(name)}><Icon size={19}/><span className="sidebarLinkText">{t(navKey[name])}</span></button>
       {editing&&<div className="sidebarMove" aria-label={name+' navigation order'}><button type="button" disabled={position===0} aria-label={'Move '+name+' up'} onClick={()=>move(name,-1)}><ChevronUp size={14}/></button><button type="button" disabled={position===items.length-1} aria-label={'Move '+name+' down'} onClick={()=>move(name,1)}><ChevronDown size={14}/></button></div>}
     </div>;
    })}
   </div>)}
  </nav>
  <div className="sidebarFooter"><span className="sidebarPulse"/><span className="sidebarFooterText">AURORA SYSTEM / ONLINE</span></div>
 </aside>;
}
