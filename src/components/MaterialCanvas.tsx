import { useEffect, useRef } from 'react'
import type { Crop, Finish, MaterialTemplate, Rect } from '../materials/templates'
import type { Angle, RenderOptions } from '../materials/state'
import { constrainCrop, renderMaterial } from '../materials/render'
import { acrylicRegion } from '../materials/acrylic'
interface Props { template:MaterialTemplate; image:HTMLImageElement; crop:Crop; finish:Finish; options?:RenderOptions; interactive?:boolean; mode?:'crop'|'angle'; region?:Rect; onRenderError?:(error:unknown)=>void; onChange?:(crop:Crop)=>void; onAngle?:(angle:Angle)=>void }
export default function MaterialCanvas({template,image,crop,finish,options,interactive=false,mode='crop',region,onChange,onAngle,onRenderError}:Props){
 const ref=useRef<HTMLCanvasElement>(null),points=useRef(new Map<number,{x:number;y:number}>()),latest=useRef(crop),angleRef=useRef(options?.angle??{x:0,y:0})
 latest.current=crop;angleRef.current=options?.angle??{x:0,y:0}
 const failure=useRef<{image:HTMLImageElement;message:string}|null>(null)
 const start=useRef({crop,angle:angleRef.current,center:{x:0,y:0},distance:0})
 useEffect(()=>{
  const frame=requestAnimationFrame(()=>{
   const canvas=ref.current;if(!canvas)return
   try{renderMaterial(canvas,template,image,crop,finish,interactive?900:600,!interactive,options);failure.current=null}
   catch(error){
    // rAF exceptions are outside React/upload try-catch. Reset any partial/failed draw.
    canvas.width=canvas.width;const c=canvas.getContext('2d')
    if(c){c.scale(canvas.width/600,canvas.height/600);c.fillStyle='#f0efea';c.fillRect(0,0,600,600);c.fillStyle='#85959a';c.font='13px sans-serif';c.textAlign='center';c.fillText('预览绘制失败，请重新上传图片。',300,300)}
    const message=error instanceof Error?error.message:String(error)
    if(failure.current?.image!==image||failure.current?.message!==message){failure.current={image,message};console.error('Merch Lab: Canvas render failed',error);onRenderError?.(error)}
   }
  });return()=>cancelAnimationFrame(frame)
 },[template,image,crop,finish,interactive,options,onRenderError])

 useEffect(()=>{points.current.clear()},[mode,template.id,image,region?.x,region?.y,region?.w,region?.h])
 function center(){const ps=[...points.current.values()];return {x:ps.reduce((n,p)=>n+p.x,0)/ps.length,y:ps.reduce((n,p)=>n+p.y,0)/ps.length}}
 function distance(){const ps=[...points.current.values()];return ps.length>=2?Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y):0}
 function rebase(){if(points.current.size)start.current={crop:latest.current,angle:angleRef.current,center:center(),distance:distance()}}
 function release(id:number){points.current.delete(id);rebase()}
 return <canvas ref={ref} className={interactive?'material-canvas editable':'material-canvas'} role="img" aria-label={`${template.name}效果预览${interactive?(mode==='angle'?'，拖动观察反光':'，拖动或双指缩放照片'):''}`}
 onPointerDown={e=>{if(!interactive)return;e.currentTarget.setPointerCapture(e.pointerId);points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});rebase()}}
 onPointerMove={e=>{if(!interactive||!points.current.has(e.pointerId))return;points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const mid=center(),s=start.current,rect=e.currentTarget.getBoundingClientRect(),factor=600/rect.width
  if(mode==='angle'){const angle={x:Math.max(-1,Math.min(1,s.angle.x+(mid.x-s.center.x)/rect.width*3)),y:Math.max(-1,Math.min(1,s.angle.y+(mid.y-s.center.y)/rect.height*3))};angleRef.current=angle;onAngle?.(angle);return}
  const zoom=s.distance?Math.max(1,Math.min(3,s.crop.zoom*distance()/s.distance)):s.crop.zoom,ratio=zoom/s.crop.zoom
  const r=region??(template.id==='charm'?acrylicRegion(options?.acrylicShape??'rectangle'):template.regions[0])
  // Convert screen gestures through the same affine transform used by the renderer.
  const a=angleRef.current,theta=a.x*.065,co=Math.cos(theta),si=Math.sin(theta),sx=1-a.x*a.x*.055,sy=1-a.y*a.y*.055,b=a.y*.018,c=a.x*.018,det=sx*sy-b*c
  const inverse=(x:number,y:number)=>{const u=co*x+si*y,v=-si*x+co*y;return {x:(sy*u-c*v)/det,y:(sx*v-b*u)/det}}
  const anchor=inverse((s.center.x-rect.left)*factor-300,(s.center.y-rect.top)*factor-300),delta=inverse((mid.x-s.center.x)*factor,(mid.y-s.center.y)*factor)
  const next=constrainCrop(image,r,{zoom,x:s.crop.x*ratio+(anchor.x+300-r.x-r.w/2)*(1-ratio)+delta.x,y:s.crop.y*ratio+(anchor.y+300-r.y-r.h/2)*(1-ratio)+delta.y});latest.current=next;onChange?.(next)
 }} onPointerUp={e=>release(e.pointerId)} onPointerCancel={e=>release(e.pointerId)} onLostPointerCapture={e=>release(e.pointerId)}/>
}
