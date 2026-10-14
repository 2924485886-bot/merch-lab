import type { Finish, Rect } from './templates'
import type { Angle, Foil } from './state'
type Ctx=CanvasRenderingContext2D
function star(c:Ctx,x:number,y:number,r:number){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.4:r;i?c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):c.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}c.closePath()}
function softLight(c:Ctx,r:Rect,angle:Angle,matte=false){
 const x=r.x+r.w*(.24+angle.x*.45),y=r.y+r.h*(.2+angle.y*.4),radius=Math.max(r.w,r.h)*(matte?.95:.55)
 const glow=c.createRadialGradient(x,y,0,x,y,radius);glow.addColorStop(0,`rgba(255,255,255,${matte?.08:.2})`);glow.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=glow;c.fillRect(r.x,r.y,r.w,r.h)
}
export function renderFinish(c:Ctx,f:Finish,r:Rect,angle:Angle){
 if(f==='default')return;c.save();softLight(c,r,angle,f==='matte')
 if(f==='matte'){
  // Diffuse reflection has no sharp light band; the tiny fixed grain is neutral.
  c.fillStyle='rgba(255,255,255,.13)';for(let i=0;i<1500;i++)c.fillRect(r.x+(i*73%997)/997*r.w,r.y+(i*139%991)/991*r.h,.6,.6)
 }else{
  const shift=angle.x*r.w*.65+angle.y*r.h*.28,center=r.x+r.w*.46+shift
  c.save();c.translate(center,r.y+r.h/2);c.rotate(-.55+angle.y*.18)
  const g=c.createLinearGradient(-65,0,65,0);g.addColorStop(0,'transparent');g.addColorStop(.25,'rgba(255,255,255,.015)');g.addColorStop(.47,'rgba(255,255,255,.30)');g.addColorStop(.54,'rgba(255,255,255,.38)');g.addColorStop(.72,'rgba(255,255,255,.02)');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(-65,-650,130,1300);c.restore()
 }
 if(f==='holographic'){
  // Local diffraction lines move across the surface; no full-image rainbow wash.
  const phase=angle.x*92+angle.y*64
  for(let i=-5;i<20;i++){const x=r.x+i*29+phase;const hue=((i*37+angle.x*120+angle.y*85)%360+360)%360
   c.save();c.translate(x,r.y);c.rotate(.46+angle.y*.08);const g=c.createLinearGradient(-6,0,6,0);g.addColorStop(0,'transparent');g.addColorStop(.45,`hsla(${hue},85%,78%,.19)`);g.addColorStop(.52,'rgba(255,255,255,.16)');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(-6,-500,12,1000);c.restore()
  }
 }
 if(f==='starlight'){
  for(let i=0;i<70;i++){const x=r.x+((i*127)%997)/997*r.w,y=r.y+((i*241)%991)/991*r.h;const pulse=Math.pow(Math.max(0,Math.cos(i*1.7+angle.x*5+angle.y*4)),5);const radius=1.3+pulse*3.2
   star(c,x,y,radius);c.fillStyle=`rgba(255,255,255,${.08+pulse*.58})`;c.fill();if(pulse>.6){c.strokeStyle=`hsla(${i*41%360},70%,82%,.35)`;c.lineWidth=.55;c.stroke()}
  }
 }
 if(f==='glass'){
  // A deterministic irregular triangular mosaic, each face catches a different angle.
  const cell=42,cols=Math.ceil(r.w/cell)+1,rows=Math.ceil(r.h/cell)+1
  const vertex=(x:number,y:number)=>({x:r.x+x*cell+Math.sin(x*12.9+y*7.3)*13,y:r.y+y*cell+Math.cos(x*5.7+y*11.4)*12})
  for(let y=-1;y<rows;y++)for(let x=-1;x<cols;x++){
   const a=vertex(x,y),b=vertex(x+1,y),d=vertex(x,y+1),e=vertex(x+1,y+1)
   ;[[a,b,e],[a,e,d]].forEach((ps,k)=>{const n=x*7+y*13+k*3,pulse=Math.pow(Math.max(0,Math.cos(n+angle.x*4+angle.y*6)),4)
    c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=`hsla(${((n*47+angle.x*100)%360+360)%360},80%,82%,${pulse*.15})`;c.fill();c.strokeStyle=`rgba(255,255,255,${.035+pulse*.22})`;c.lineWidth=.7;c.stroke()
   })
  }
 }c.restore()
}
export function renderFoil(c:Ctx,foil:Foil,r:Rect,angle:Angle){
 if(foil==='none')return;c.save();const gold=c.createLinearGradient(r.x+angle.x*60,r.y,r.x+r.w,r.y+r.h+angle.y*80)
 gold.addColorStop(0,'#b18a3c');gold.addColorStop(.24,'#ead496');gold.addColorStop(.45,'#a67b31');gold.addColorStop(.55,'#fff0b8');gold.addColorStop(.78,'#c49b47');gold.addColorStop(1,'#e4ca81');c.strokeStyle=gold;c.fillStyle=gold;c.lineWidth=2.5
 if(foil==='border'){c.beginPath();c.roundRect(r.x+9,r.y+9,r.w-18,r.h-18,Math.min(7,r.w/20));c.stroke();c.lineWidth=.65;c.beginPath();c.roundRect(r.x+13,r.y+13,r.w-26,r.h-26,5);c.stroke()}
 else{[[.10,.12,8],[.88,.16,5],[.83,.87,8],[.12,.83,5],[.91,.78,3]].forEach(([x,y,size])=>{star(c,r.x+r.w*x,r.y+r.h*y,size);c.fill()})}c.restore()
}
