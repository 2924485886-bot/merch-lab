import type { Crop, Finish, MaterialTemplate, Rect } from './templates'
import type { RenderOptions } from './state'
import { renderFinish, renderFoil } from './finishes'
import { renderAcrylic } from './acrylic'
import { renderTyvek } from './tyvek'
type Ctx = CanvasRenderingContext2D
const rounded = (c:Ctx,x:number,y:number,w:number,h:number,r:number) => {c.beginPath();c.roundRect(x,y,w,h,r)}
export function constrainCrop(image: HTMLImageElement, region:Rect, crop:Crop):Crop {
 const zoom=Math.max(1,Math.min(3,crop.zoom)); const scale=Math.max(region.w/image.naturalWidth,region.h/image.naturalHeight)*zoom
 return {zoom,x:Math.max(-(image.naturalWidth*scale-region.w)/2,Math.min((image.naturalWidth*scale-region.w)/2,crop.x)),y:Math.max(-(image.naturalHeight*scale-region.h)/2,Math.min((image.naturalHeight*scale-region.h)/2,crop.y))}
}
/** Fraction of the original photo visible after an aspect-preserving cover crop. */
export function visiblePhotoFraction(image:HTMLImageElement,region:Rect,crop:Crop):number {
 const p=constrainCrop(image,region,crop),scale=Math.max(region.w/image.naturalWidth,region.h/image.naturalHeight)*p.zoom
 return region.w*region.h/(image.naturalWidth*image.naturalHeight*scale*scale)
}
function photo(c:Ctx,img:HTMLImageElement,r:Rect,crop:Crop){
 const p=constrainCrop(img,r,crop);const scale=Math.max(r.w/img.naturalWidth,r.h/img.naturalHeight)*p.zoom
 const w=img.naturalWidth*scale,h=img.naturalHeight*scale
 c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();c.drawImage(img,r.x+(r.w-w)/2+p.x,r.y+(r.h-h)/2+p.y,w,h);c.restore()
}
function shadow(c:Ctx,draw:()=>void){c.save();c.shadowColor='rgba(54,48,40,.18)';c.shadowBlur=22;c.shadowOffsetY=12;draw();c.restore()}
function body(c:Ctx,t:MaterialTemplate){const x=(600-t.width)/2,y=(600-t.height)/2
 rounded(c,x,y,t.width,t.height,t.radius);c.fillStyle='#fffefb';c.fill(); c.strokeStyle='rgba(100,90,75,.12)';c.lineWidth=1;c.stroke()}
const renderers:Record<MaterialTemplate['id'],(c:Ctx,t:MaterialTemplate,img:HTMLImageElement,p:Crop,options:RenderOptions)=>void>={
 tyvek(c,t,img,p){renderTyvek(c,()=>photo(c,img,t.regions[0],p))},
 photocard(c,t,img,p){shadow(c,()=>body(c,t));c.save();rounded(c,178,125,244,350,13);c.clip();photo(c,img,t.regions[0],p);c.restore();rounded(c,178,125,244,350,13);c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=2;c.stroke()},
 banner(c,t,img,p){
  // A flat paper edge and shallow lower thickness, using the same artwork in export.
  shadow(c,()=>{rounded(c,60,222,480,160,1);c.fillStyle='#d7d4cd';c.fill();body(c,t)})
  photo(c,img,t.regions[0],p)
  rounded(c,60,220,480,160,1);c.strokeStyle='rgba(255,255,255,.65)';c.lineWidth=.8;c.stroke()
 },
 postcard(c,t,img,p,options){shadow(c,()=>body(c,t));photo(c,img,t.regions[0],p);c.fillStyle='#9c9990';c.font='7px Georgia';if(options.side!=='back')c.fillText('A MOMENT TO KEEP.',120,424)},
 polaroid(c,t,img,p){shadow(c,()=>body(c,t));photo(c,img,t.regions[0],p);c.fillStyle='#88867e';c.font='italic 15px Georgia';c.textAlign='center';c.fillText('my favorite moment',300,436)},
 strip(c,t,img,p,options){shadow(c,()=>body(c,t));t.regions.forEach((r,i)=>photo(c,options.stripImages?.[i]?.image??options.sourceImage??img,r,options.stripCrops?.[i]??p));c.fillStyle='#74766f';c.font='8px sans-serif';c.textAlign='center';c.fillText('WITH LOVE · MERCH LAB',300,507)},
 ticket(c,t,img,p){shadow(c,()=>body(c,t));photo(c,img,t.regions[0],p);c.save();c.strokeStyle='#b4b5af';c.setLineDash([4,5]);c.beginPath();c.moveTo(390,207);c.lineTo(390,393);c.stroke();c.restore();c.fillStyle='#f0efea';[207,393].forEach(y=>{c.beginPath();c.arc(390,y,10,0,Math.PI*2);c.fill()});c.fillStyle='#4c5352';c.textAlign='center';c.font='9px sans-serif';c.fillText('ADMIT ONE',450,243);c.font='italic 19px Georgia';c.fillText('Love',450,275);c.font='8px sans-serif';c.fillText('NO. 0520',450,301);for(let i=0;i<25;i++){c.fillRect(422+i*2.3,324,i%3===0?2:1,35)}},
 badge(c,t,img,p,options){shadow(c,()=>{c.beginPath();c.arc(300,300,145,0,Math.PI*2);const g=c.createLinearGradient(160,160,440,440);g.addColorStop(0,'#fbfcfc');g.addColorStop(.35,'#b0b5b9');g.addColorStop(.55,'#f5f5f2');g.addColorStop(1,'#959b9f');c.fillStyle=g;c.fill()});c.save();c.beginPath();c.arc(300,300,137,0,Math.PI*2);c.clip();photo(c,img,t.regions[0],p);const g=c.createRadialGradient(246,221,15,300,300,175);g.addColorStop(0,`rgba(255,255,255,${options.surfaceFinish==='matte'?.065:.25})`);g.addColorStop(.65,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(15,20,25,.24)');c.fillStyle=g;c.fillRect(155,155,290,290);c.restore();c.beginPath();c.arc(300,300,140,Math.PI*1.1,Math.PI*1.65);c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=3;c.stroke()},
 charm(c,t,img,p,options){renderAcrylic(c,t,img,p,options,r=>photo(c,img,r,p))},
 standee(c,t,img,p,options){renderAcrylic(c,t,img,p,options,r=>photo(c,img,r,p))},
}
export function renderMaterial(canvas:HTMLCanvasElement,t:MaterialTemplate,img:HTMLImageElement,crop:Crop,f:Finish,size=800,rotate=true,options:RenderOptions={}){
 if(canvas.width!==size||canvas.height!==size){canvas.width=size;canvas.height=size}
 const c=canvas.getContext('2d');if(!c)return;c.setTransform(size/600,0,0,size/600,0,0);c.clearRect(0,0,600,600);c.fillStyle='#f0efea';c.fillRect(0,0,600,600)
 const activeFinish=t.finishes.includes(f)?f:t.defaultFinish
 const angle=options.angle??{x:0,y:0};c.save();c.translate(300,300);c.rotate((rotate?t.rotation:0)+angle.x*.065);c.transform(1-angle.x*angle.x*.055,angle.y*.018,angle.x*.018,1-angle.y*angle.y*.055,0,0);c.translate(-300,-300)
 renderers[t.id](c,t,img,crop,{...options,surfaceFinish:activeFinish})
 if(t.finishes.length>1){c.save();const r=t.id==='badge'?t.regions[0]:{x:(600-t.width)/2,y:(600-t.height)/2,w:t.width,h:t.height}
 c.beginPath();if(t.id==='badge')c.arc(300,300,137,0,Math.PI*2);else c.roundRect(r.x,r.y,r.w,r.h,t.radius);c.clip();renderFinish(c,activeFinish,r,angle);if(t.foilEnabled)renderFoil(c,options.foil??'none',r,angle);c.restore()}
 c.restore()
}
