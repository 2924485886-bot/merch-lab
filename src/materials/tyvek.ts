/** Local Canvas approximation: wide Tyvek body, gusset and fixed black webbing.
 * Artwork is clipped, never stretched. All detail is deterministic across export sizes.
 */
type Ctx = CanvasRenderingContext2D
const bodyPath=()=>new Path2D('M 96 230 Q 295 237 504 230 L 511 474 Q 513 494 499 504 L 111 514 Q 93 510 89 493 L 92 259 Q 92 243 96 230 Z')
const printPath=()=>new Path2D('M 102 246 Q 295 253 498 245 L 503 474 L 490 496 L 114 503 L 98 487 L 98 261 Z')
function stroke(c:Ctx,path:Path2D,color:string,width:number){c.strokeStyle=color;c.lineWidth=width;c.stroke(path)}
function strap(c:Ctx,rear:boolean){
 c.save();if(rear)c.transform(.96,0,0,1,25,-18)
 // Closed ribbon contours give the webbing actual width, rather than an oval stroke.
 const band=new Path2D('M 153 287 L 150 240 C 145 197 147 148 164 116 C 184 79 368 77 397 114 C 419 145 423 198 415 246 L 412 287 L 393 287 L 397 243 C 403 198 399 148 381 126 C 360 100 196 102 181 128 C 168 153 166 199 169 239 L 173 287 Z')
 c.save();c.translate(2,2);c.fillStyle='#161616';c.fill(band);c.restore()
 const shade=c.createLinearGradient(150,90,420,275);shade.addColorStop(0,'#393939');shade.addColorStop(.28,'#222222');shade.addColorStop(.6,'#303030');shade.addColorStop(1,'#222222');c.fillStyle=shade;c.fill(band)
 c.save();c.clip(band)
 // Dense, low-contrast thread dashes belong only to the black webbing.
 c.drawImage(webbing(),0,0,600,600)
 c.restore()
 stroke(c,new Path2D('M 156 283 L 154 240 C 150 196 151 150 168 119 C 187 85 367 83 393 118 C 414 146 419 198 411 244 L 408 283'),'rgba(255,255,255,.16)',.8)
 stroke(c,new Path2D('M 169 285 L 165 240 C 162 198 164 152 178 126 C 195 96 362 95 384 123 C 404 150 407 199 402 245 L 398 285'),'rgba(0,0,0,.32)',1)
 if(!rear)for(const x of [153,393]){
  // Sewn attachment tabs extend onto the bag and carry box-and-cross stitches.
  c.fillStyle='#222222';c.fillRect(x,251,19,36)
  c.strokeStyle='rgba(207,205,198,.4)';c.lineWidth=.7;c.setLineDash([1.4,1.6]);c.strokeRect(x+3,257,13,25);c.setLineDash([])
  c.beginPath();c.moveTo(x+3,258);c.lineTo(x+16,281);c.moveTo(x+16,258);c.lineTo(x+3,281);c.stroke()
 }
 c.restore()
}
let webbingTexture:HTMLCanvasElement|undefined
function webbing(){
 if(webbingTexture)return webbingTexture
 const tile=document.createElement('canvas');tile.width=600;tile.height=600;const c=tile.getContext('2d')!
 c.strokeStyle='rgba(255,255,255,.09)';c.lineWidth=.5;c.beginPath()
 for(let y=90;y<289;y+=2.2)for(let x=145;x<425;x+=5){c.moveTo(x,y);c.lineTo(x+2.5,y+.6)}c.stroke()
 webbingTexture=tile;return tile
}
let paperTexture:HTMLCanvasElement|undefined
function texture(){
 if(paperTexture)return paperTexture
 const tile=document.createElement('canvas');tile.width=600;tile.height=600;const c=tile.getContext('2d')!
 // Nonwoven irregular fibres, deliberately no repeating canvas weave or grid.
 let seed=721;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
 for(let i=0;i<3600;i++){
  const x=88+random()*428,y=228+random()*290,angle=random()*Math.PI*2,length=1+random()*8
  c.strokeStyle=i%3?'rgba(255,255,255,.11)':'rgba(80,71,53,.045)';c.lineWidth=.35+random()*.35;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(angle)*length*.5,y+Math.sin(angle)*length*.5+.7,x+Math.cos(angle)*length,y+Math.sin(angle)*length);c.stroke()
 }
 paperTexture=tile;return tile
}
function crease(c:Ctx,d:string,width:number,opacity:number){
 const p=new Path2D(d);c.save();c.translate(1,-1);stroke(c,p,`rgba(255,255,255,${opacity*.85})`,width);c.restore();stroke(c,p,`rgba(62,54,41,${opacity})`,width*.65)
}
export function renderTyvek(c:Ctx,drawPhoto:()=>void){
 const body=bodyPath()
 // The far strap is behind the opening; the near strap is stitched over the front.
 strap(c,true)
 c.save();c.shadowColor='rgba(50,43,35,.2)';c.shadowBlur=17;c.shadowOffsetY=10;c.fillStyle='#e3e0d7';c.fill(body);c.restore()
 c.save();c.translate(2,2);stroke(c,body,'#d1cdc1',2);c.restore()
 c.fillStyle='#f6f3ea';c.fill(body)
 c.save();c.clip(body);c.save();c.clip(printPath());drawPhoto();c.restore()
 const light=c.createLinearGradient(90,240,520,500);light.addColorStop(0,'rgba(255,255,255,.13)');light.addColorStop(.45,'rgba(255,255,255,0)');light.addColorStop(1,'rgba(55,44,26,.09)');c.fillStyle=light;c.fillRect(88,230,428,290)
 c.drawImage(texture(),0,0,600,600)
 // Sparse soft folds: broad ridges with narrow highlights, not heavy crumpling.
 crease(c,'M 110 284 Q 153 336 117 447',4,.055)
 crease(c,'M 474 267 Q 439 335 485 420',5,.05)
 crease(c,'M 249 253 Q 275 293 266 331 Q 261 349 280 377',3,.035)
 crease(c,'M 135 461 Q 243 444 331 474 Q 404 481 470 458',4,.045)
 crease(c,'M 198 395 Q 239 376 258 409',2,.04)
 // Bottom gusset and folded corners stay in the original body silhouette.
 c.fillStyle='rgba(94,83,63,.1)';c.fill(new Path2D('M 90 469 L 122 491 L 499 484 L 500 505 L 111 514 L 92 495 Z'))
 c.fillStyle='rgba(255,255,255,.17)';c.fill(new Path2D('M 90 469 L 120 491 L 111 514 L 92 495 Z'))
 crease(c,'M 92 471 L 120 491 L 110 513 M 503 471 L 481 491 L 499 504',1.8,.15)
 crease(c,'M 120 491 Q 300 498 481 491',1.3,.075)
 // A subtly raised folded opening hem and edge seam finish the paper body.
 c.fillStyle='rgba(255,255,255,.26)';c.fill(new Path2D('M 96 230 Q 295 237 504 230 L 501 244 Q 299 252 99 245 Z'))
 crease(c,'M 100 245 Q 300 253 501 244',1.2,.11)
 crease(c,'M 97 260 L 94 480 M 504 253 L 507 474',1,.09)
 c.restore()
 stroke(c,body,'rgba(88,78,60,.24)',.9)
 strap(c,false)
}
