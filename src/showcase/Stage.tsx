import { useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import type { Board, Layer } from './model'
import { clamp, dimensions, normalizeRotation } from './model'
import { hitLayer, layerDimensions, renderBoard } from './render'
interface Props { board:Board; selected:string|null; onSelect:(id:string|null)=>void; onLayer:(id:string,change:Partial<Layer>)=>void }
export default function Stage({board,selected,onSelect,onLayer}:Props){
 const canvas=useRef<HTMLCanvasElement>(null),points=useRef(new Map<number,{x:number;y:number}>()),latest=useRef(board),active=useRef(selected)
 latest.current=board;active.current=selected
 const start=useRef<{layer:Layer;mid:{x:number;y:number};distance:number;angle:number}|null>(null)
 useEffect(()=>{const frame=requestAnimationFrame(()=>{if(canvas.current)renderBoard(canvas.current,board,750)});return()=>cancelAnimationFrame(frame)},[board])
 function geometry(){const ps=[...points.current.values()],r=canvas.current!.getBoundingClientRect();return {mid:{x:ps.reduce((s,p)=>s+p.x,0)/ps.length-r.left,y:ps.reduce((s,p)=>s+p.y,0)/ps.length-r.top},distance:ps.length>1?Math.hypot(ps[1].x-ps[0].x,ps[1].y-ps[0].y):0,angle:ps.length>1?Math.atan2(ps[1].y-ps[0].y,ps[1].x-ps[0].x):0}}
 function rebase(){const layer=latest.current.layers.find(l=>l.id===active.current);start.current=points.current.size&&layer?{layer:{...layer},...geometry()}:null}
 function release(id:number){points.current.delete(id);rebase()}
 const [ew,eh]=dimensions[board.ratio],height=1000*eh/ew,layer=board.layers.find(l=>l.id===selected),d=layer?layerDimensions(layer,1000,height):null
 function down(e:PointerEvent<HTMLCanvasElement>){
  const r=e.currentTarget.getBoundingClientRect()
  if(!points.current.size){const found=[...latest.current.layers].reverse().find(l=>hitLayer(l,e.clientX-r.left,e.clientY-r.top,r.width,r.height));active.current=found?.id??null;onSelect(active.current);if(!found)return}
  e.currentTarget.setPointerCapture(e.pointerId);points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});rebase()
 }
 return <div className="showcase-artboard" style={{aspectRatio:board.ratio.replace(':',' / '),width:`min(100%, calc(var(--studio-max-height) * ${ew/eh}))`}}><canvas ref={canvas} aria-label="展示板画布，单指拖动，双指缩放和旋转" onPointerDown={down} onPointerMove={e=>{
  if(!points.current.has(e.pointerId)||!start.current)return
  points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const g=geometry(),s=start.current,r=e.currentTarget.getBoundingClientRect(),scale=clamp(s.layer.scale*(s.distance&&g.distance?g.distance/s.distance:1),.1,1.8),factor=scale/s.layer.scale,turn=s.distance&&g.distance?normalizeRotation((g.angle-s.angle)*180/Math.PI):0,a=turn*Math.PI/180,dx=s.mid.x-s.layer.x*r.width,dy=s.mid.y-s.layer.y*r.height
  onLayer(s.layer.id,{scale,rotation:normalizeRotation(s.layer.rotation+turn),x:clamp((g.mid.x-factor*(dx*Math.cos(a)-dy*Math.sin(a)))/r.width,0,1),y:clamp((g.mid.y-factor*(dx*Math.sin(a)+dy*Math.cos(a)))/r.height,0,1)})
 }} onPointerUp={e=>release(e.pointerId)} onPointerCancel={e=>release(e.pointerId)} onLostPointerCapture={e=>release(e.pointerId)}/>{layer&&d&&layer.visible&&<div className="showcase-selection" aria-hidden="true" style={{left:`${layer.x*100}%`,top:`${layer.y*100}%`,width:`${d.w/10}%`,height:`${d.h/height*100}%`,transform:`translate(-50%,-50%) rotate(${layer.rotation}deg)`}}><i/><i/><i/><i/></div>}{!board.layers.length&&<span className="showcase-empty">添加物料或图片，开始布置。</span>}</div>
}
