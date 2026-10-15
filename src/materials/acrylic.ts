import type { Crop, MaterialTemplate, Rect } from './templates'
import type { AcrylicShape, RenderOptions } from './state'
import type { ImageAsset } from './transparency'
import { renderHardware } from './hardware'
type Ctx=CanvasRenderingContext2D
export function acrylicRegion(shape:AcrylicShape):Rect{
 return shape==='rectangle'?{x:195,y:184,w:210,h:260}:{x:185,y:191,w:230,h:230}
}
export function needsSilhouette(t:MaterialTemplate,options:RenderOptions){return t.id==='standee'||(t.id==='charm'&&options.acrylicShape==='custom')}

function shell(c:Ctx,path:Path2D){
 c.save();c.shadowColor='rgba(52,65,70,.16)';c.shadowBlur=15;c.shadowOffsetY=10;c.fillStyle='rgba(218,237,241,.65)';c.fill(path);c.strokeStyle='rgba(217,235,239,.9)';c.lineWidth=17;c.lineJoin='round';c.stroke(path);c.restore()
 c.strokeStyle='rgba(255,255,255,.94)';c.lineWidth=17;c.stroke(path);c.strokeStyle='rgba(191,218,225,.7)';c.lineWidth=13;c.stroke(path);c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=9;c.stroke(path)
}
function edge(c:Ctx,path:Path2D){c.strokeStyle='rgba(106,153,167,.34)';c.lineWidth=.8;c.stroke(path)}
export function constrainSilhouetteCrop(t:MaterialTemplate,crop:Crop):Crop {
 return {...crop,zoom:Math.max(.5,Math.min(1.35,crop.zoom)),x:Math.max(-60,Math.min(60,crop.x)),y:Math.max(-45,Math.min(t.id==='standee'?0:45,crop.y))}
}
function customPath(asset:ImageAsset,standee:boolean,crop:Crop){
 const s=asset.silhouette!,maxW=standee?238:235,maxH=standee?332:292,initialScale=Math.min(maxW/s.bounds.w,maxH/s.bounds.h)
 const scale=initialScale*Math.min(crop.zoom,420/(s.bounds.w*initialScale),380/(s.bounds.h*initialScale))
 const w=s.bounds.w*scale,h=s.bounds.h*scale,x=300-w/2+crop.x,y=standee?438-h+crop.y:(600-h)/2+25+crop.y
 const path=new Path2D();s.points.forEach((p,i)=>i?path.lineTo(x+p.x*w,y+p.y*h):path.moveTo(x+p.x*w,y+p.y*h));path.closePath()
 const low=Math.max(...s.points.map(p=>p.y)),support=s.points.filter(p=>p.y>low-.01),contactPoint=support.reduce((best,p)=>Math.abs(p.x-.5)<Math.abs(best.x-.5)?p:best),contactX=contactPoint.x
 const top=Math.min(...s.points.map(p=>p.y)),upper=s.points.filter(p=>p.y<top+.035),hookX=upper.reduce((sum,p)=>sum+p.x,0)/upper.length
 return {path,target:{x,y,w,h},contact:{x:x+contactX*w,y:y+contactPoint.y*h},hook:{x:x+hookX*w,y:y+top*h}}
}
function base(c:Ctx,x:number){
 c.save();c.shadowColor='rgba(60,68,71,.18)';c.shadowBlur=13;c.shadowOffsetY=12
 c.beginPath();c.ellipse(300,480,139,32,0,0,Math.PI*2);c.fillStyle='rgba(192,215,224,.8)';c.fill();c.restore()
 c.beginPath();c.ellipse(300,470,139,30,0,0,Math.PI*2);const g=c.createLinearGradient(300,440,300,501);g.addColorStop(0,'rgba(246,254,255,.88)');g.addColorStop(1,'rgba(201,226,233,.8)');c.fillStyle=g;c.fill();c.strokeStyle='rgba(255,255,255,.94)';c.lineWidth=2;c.stroke()
 c.beginPath();c.roundRect(x-22,465,44,8,3);c.fillStyle='rgba(118,153,164,.36)';c.fill();c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1;c.stroke()
}
export function renderAcrylic(c:Ctx,t:MaterialTemplate,img:HTMLImageElement,crop:Crop,options:RenderOptions,drawPhoto:(r:Rect)=>void){
 if(needsSilhouette(t,options)){
  const asset=options.customAsset
  if(!asset?.silhouette){
   const path=new Path2D();path.roundRect(212,180,176,245,25);c.strokeStyle='#c6d7dc';c.setLineDash([6,7]);c.lineWidth=2;c.stroke(path);c.setLineDash([])
   if(t.id==='standee')base(c,300);else renderHardware(c,300,174,options.transparentBackground)
   c.fillStyle='#85959a';c.textAlign='center';c.font='13px sans-serif';c.fillText('需要透明底 PNG / WebP',300,291);c.font='10px sans-serif';c.fillText('在编辑页上传人物素材',300,316);return
  }
  const standee=t.id==='standee',{path,target,contact,hook}=customPath(asset,standee,constrainSilhouetteCrop(t,options.customCrop??{x:0,y:0,zoom:1}))
  if(standee){base(c,contact.x);c.beginPath();c.roundRect(contact.x-17,contact.y-9,34,Math.max(24,472-contact.y+9),5);c.fillStyle='rgba(211,233,239,.84)';c.fill();c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=2;c.stroke()}
  shell(c,path);c.save();c.clip(path);const b=asset.silhouette.bounds;c.drawImage(asset.image,b.x,b.y,b.w,b.h,target.x,target.y,target.w,target.h);c.restore();edge(c,path)
  if(!standee)renderHardware(c,hook.x,hook.y-5,options.transparentBackground)
  else{c.beginPath();c.ellipse(300,480,139,32,0,0,Math.PI);c.strokeStyle='rgba(255,255,255,.82)';c.lineWidth=2;c.stroke()}
 }else{
  const shape=options.acrylicShape??'rectangle',r=acrylicRegion(shape),path=new Path2D()
  if(shape==='circle')path.arc(r.x+r.w/2,r.y+r.h/2,r.w/2,0,Math.PI*2);else path.roundRect(r.x,r.y,r.w,r.h,shape==='square'?15:24)
  shell(c,path);c.save();c.clip(path);drawPhoto(r);c.restore();edge(c,path);renderHardware(c,300,r.y-7,options.transparentBackground)
 }
 // Narrow, neutral edge glint, kept separate from the original print.
 void img;void crop
}
