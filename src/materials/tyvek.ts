/** Flat, full-bleed Tyvek mockup. Shared by live previews and PNG export. */
type Ctx = CanvasRenderingContext2D
// The photo covers this whole contour, including the shallow bevels at the bottom.
const bodyPath=()=>new Path2D('M 92 230 Q 300 231 508 230 L 510 461 Q 510 474 503 482 L 472 510 Q 468 514 460 514 L 140 514 Q 133 514 129 510 L 98 482 Q 90 475 90 463 Z')
function stroke(c:Ctx,path:Path2D,color:string,width:number){c.strokeStyle=color;c.lineWidth=width;c.stroke(path)}
function strap(c:Ctx,rear:boolean){
 c.save()
 // Exactly two closed webbing ribbons, with different drapes and no stacked arc outlines.
 const band=new Path2D(rear
  ?'M 201 233 C 206 174 213 114 235 94 C 256 76 356 77 379 94 C 392 114 398 174 404 233 L 388 233 C 384 178 381 124 369 107 C 351 92 264 91 247 107 C 229 127 223 179 217 233 Z'
  :'M 183 245 C 185 194 194 138 212 103 C 228 73 339 79 359 105 C 381 143 390 196 394 245 L 376 245 C 373 196 369 152 344 117 C 330 96 241 92 228 116 C 212 149 205 199 201 245 Z')
 c.fillStyle='#222222';c.fill(band)
 c.save();c.clip(band)
 // Soft textile lighting stays within the ribbon, without a hard rim highlight.
 const shade=c.createLinearGradient(182,100,397,240);shade.addColorStop(0,'rgba(255,255,255,.035)');shade.addColorStop(.5,'rgba(255,255,255,0)');shade.addColorStop(1,'rgba(0,0,0,.09)');c.fillStyle=shade;c.fillRect(180,73,226,175)
 c.drawImage(webbing(),0,0,600,600);c.restore()
 if(!rear){
  // Short stitch lines attach the ribbon ends; there is no separate rectangular patch.
  c.strokeStyle='rgba(177,177,171,.25)';c.lineWidth=.55;c.setLineDash([1,1.8]);c.beginPath()
  c.moveTo(187,239);c.lineTo(198,239);c.moveTo(379,239);c.lineTo(391,239);c.stroke();c.setLineDash([])
 }
 c.restore()
}
let webbingTexture:HTMLCanvasElement|undefined
function webbing(){
 if(webbingTexture)return webbingTexture
 const tile=document.createElement('canvas');tile.width=600;tile.height=600;const c=tile.getContext('2d')!
 c.strokeStyle='rgba(255,255,255,.065)';c.lineWidth=.4;c.beginPath()
 for(let y=75;y<247;y+=2.1)for(let x=180;x<406;x+=5){c.moveTo(x,y);c.lineTo(x+2,y+.5)}c.stroke()
 webbingTexture=tile;return tile
}
let paperTexture:HTMLCanvasElement|undefined
function texture(){
 if(paperTexture)return paperTexture
 const tile=document.createElement('canvas');tile.width=600;tile.height=600;const c=tile.getContext('2d')!
 let seed=721;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
 // Sparse, nonwoven fibres. No global white veil, canvas grid or glossy reflection.
 for(let i=0;i<2300;i++){
  const x=90+random()*420,y=230+random()*284,angle=random()*Math.PI*2,length=.8+random()*5
  c.strokeStyle=i%3?'rgba(255,255,255,.045)':'rgba(48,42,31,.025)';c.lineWidth=.3+random()*.25;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(angle)*length*.5,y+Math.sin(angle)*length*.5+.4,x+Math.cos(angle)*length,y+Math.sin(angle)*length);c.stroke()
 }
 paperTexture=tile;return tile
}
function crease(c:Ctx,d:string,width:number,opacity:number){
 const p=new Path2D(d);c.save();c.translate(.6,-.5);stroke(c,p,`rgba(255,255,255,${opacity*.45})`,width);c.restore();stroke(c,p,`rgba(38,31,22,${opacity})`,width*.7)
}
export function renderTyvek(c:Ctx,drawPhoto:()=>void){
 const body=bodyPath()
 strap(c,true)
 // A shallow paper thickness and soft cast shadow sit behind the printed face.
 c.save();c.translate(.4,1);c.shadowColor='rgba(44,37,30,.18)';c.shadowBlur=15;c.shadowOffsetY=7;c.fillStyle='#b5afa4';c.fill(body);c.restore()
 c.save();c.clip(body)
 // White is only the substrate for transparent pixels / an explicitly contained image.
 // The full-bleed cover draw paints directly over it all the way to the silhouette.
 c.fillStyle='#ffffff';c.fillRect(90,230,420,284);drawPhoto()
 c.drawImage(texture(),0,0,600,600)
 // Local irregular paper folds, preserving colour and contrast over the rest of the print.
 crease(c,'M 98 321 Q 110 347 102 393',1.6,.055)
 crease(c,'M 496 293 Q 483 328 497 354',1.7,.045)
 crease(c,'M 205 455 Q 219 443 238 451',1.2,.025)
 // Printed bottom corners: subtle directional shade, never white triangles or a frame.
 const left=c.createLinearGradient(91,469,133,505);left.addColorStop(0,'rgba(31,25,19,.025)');left.addColorStop(1,'rgba(31,25,19,.095)');c.fillStyle=left;c.fill(new Path2D('M 90 463 L 135 491 L 129 513 L 98 482 Z'))
 const right=c.createLinearGradient(510,463,470,504);right.addColorStop(0,'rgba(31,25,19,.02)');right.addColorStop(1,'rgba(31,25,19,.075)');c.fillStyle=right;c.fill(new Path2D('M 510 461 L 469 490 L 472 513 L 503 482 Z'))
 crease(c,'M 91 463 L 135 491 M 509 462 L 469 490',.8,.085)
 // Only a fine dark hem at the opening; artwork underneath remains full bleed.
 stroke(c,new Path2D('M 93 231 Q 300 232 507 231'),'rgba(33,27,21,.14)',.65)
 c.restore()
 // No light-coloured outside stroke: the contour itself defines the printed edge.
 strap(c,false)
}
