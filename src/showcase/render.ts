import { dimensions } from './model'
import type { Board, Background, Layer } from './model'
export function drawBackground(c:CanvasRenderingContext2D,w:number,h:number,b:Background){
 const unit=Math.min(w,h)/1000;c.fillStyle=b.primary;c.fillRect(0,0,w,h)
 if(b.kind==='dots'){
  const step=Math.max(b.dotSize*2+8,b.spacing)*unit;c.fillStyle=b.secondary
  for(let row=-1;row<h/step+1;row++)for(let col=-1;col<w/step+1;col++){c.beginPath();c.arc(col*step+(row%2?step/2:0),row*step,b.dotSize*unit,0,Math.PI*2);c.fill()}
 }else if(b.kind==='stripe'){
  const step=b.stripeWidth*unit;c.fillStyle=b.secondary
  for(let p=0;p<(b.horizontal?h:w);p+=step*2)c.fillRect(b.horizontal?0:p,b.horizontal?p:0,b.horizontal?w:step,b.horizontal?step:h)
 }else if(b.kind==='gingham'){
  const step=Math.min(w,h)/b.density;c.fillStyle=b.secondary;c.save();c.globalAlpha=.45
  for(let x=0;x<w;x+=step*2)c.fillRect(x,0,step,h)
  for(let y=0;y<h;y+=step*2)c.fillRect(0,y,w,step)
  c.restore()
 }else if(b.kind==='gradient'){
  const a=b.direction*Math.PI/180,dx=Math.cos(a)*w/2,dy=Math.sin(a)*h/2,g=c.createLinearGradient(w/2-dx,h/2-dy,w/2+dx,h/2+dy);g.addColorStop(0,b.primary);g.addColorStop(1,b.secondary);c.fillStyle=g;c.fillRect(0,0,w,h)
 }else if(b.kind==='glow'){
  const g=c.createRadialGradient(w*.54,h*.45,0,w*.54,h*.45,Math.max(w,h)*.7);g.addColorStop(0,b.secondary);g.addColorStop(1,b.primary);c.save();c.globalAlpha=b.glow;c.fillStyle=g;c.fillRect(0,0,w,h);c.restore()
 }
 if(b.mode==='soft'){
  // These overlays are drawn before any artwork: products never receive blur or glow.
  const radius=Math.hypot(w,h)*.48,g=c.createRadialGradient(w*.5,h*.48,radius*.1,w*.5,h*.48,radius);g.addColorStop(0,'#FFFFFF00');g.addColorStop(.52,'#FFFFFF0A');g.addColorStop(1,'#FFFFFFC2');c.fillStyle=g;c.fillRect(0,0,w,h)
  const light=c.createLinearGradient(0,0,w,h);light.addColorStop(0,'#FFFFFF20');light.addColorStop(.5,'#FFFFFF00');light.addColorStop(1,'#24344C08');c.fillStyle=light;c.fillRect(0,0,w,h)
 }
}
export function layerDimensions(l:Layer,w:number,h:number){const ratio=l.scale*Math.min(w,h)/Math.max(l.artwork.canvas.width,l.artwork.canvas.height);return {w:l.artwork.canvas.width*ratio,h:l.artwork.canvas.height*ratio}}
export function renderBoard(canvas:HTMLCanvasElement,board:Board,width=dimensions[board.ratio][0]){
 const [ew,eh]=dimensions[board.ratio],height=Math.round(width*eh/ew)
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
 const c=canvas.getContext('2d')!;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,width,height);drawBackground(c,width,height,board.background)
 for(const l of board.layers){if(!l.visible)continue;const d=layerDimensions(l,width,height);c.save();c.translate(l.x*width,l.y*height);c.rotate(l.rotation*Math.PI/180)
  if(board.shadow){c.shadowColor='rgba(32,35,45,.18)';c.shadowBlur=Math.min(width,height)*.018;c.shadowOffsetY=Math.min(width,height)*.009}
  c.drawImage(l.artwork.canvas,-d.w/2,-d.h/2,d.w,d.h);c.restore()
 }
}
export function hitLayer(l:Layer,x:number,y:number,w:number,h:number){
 if(!l.visible)return false
 const a=-l.rotation*Math.PI/180,dx=x-l.x*w,dy=y-l.y*h,d=layerDimensions(l,w,h),u=(dx*Math.cos(a)-dy*Math.sin(a))/d.w+.5,v=(dx*Math.sin(a)+dy*Math.cos(a))/d.h+.5
 if(u<0||u>=1||v<0||v>=1)return false
 return l.artwork.canvas.getContext('2d')!.getImageData(Math.floor(u*l.artwork.canvas.width),Math.floor(v*l.artwork.canvas.height),1,1).data[3]>12
}
