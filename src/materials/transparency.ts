import type { Rect } from './templates'
export interface Point { x:number; y:number }
export interface Silhouette { points:Point[]; bounds:Rect }
export interface ImageAsset { image:HTMLImageElement; thumbnail:string; transparent:boolean; silhouette:Silhouette|null }
const assetCache=new WeakMap<HTMLImageElement,ImageAsset>()
const N=160
// Work on a small alpha mask once at upload. Close tiny gaps, retain the main connected
// subject and trace only the outside boundary, so holes and isolated pixels don't become cut lines.
function morphology(mask:Uint8Array,w:number,h:number,dilate:boolean,r=2){
 const out=new Uint8Array(mask.length)
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let value=dilate?0:1
  outer:for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   if(dx*dx+dy*dy>r*r)continue
   const xx=x+dx,yy=y+dy,v=xx>=0&&xx<w&&yy>=0&&yy<h?mask[yy*w+xx]:0
   if(dilate?v:!v){value=dilate?1:0;break outer}
  }out[y*w+x]=value
 }return out
}
function mainComponent(mask:Uint8Array,w:number,h:number){
 const seen=new Uint8Array(mask.length);let largest:number[]=[]
 for(let i=0;i<mask.length;i++){if(!mask[i]||seen[i])continue;const queue=[i];seen[i]=1
  for(let q=0;q<queue.length;q++){const p=queue[q],x=p%w,y=Math.floor(p/w);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,j=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&mask[j]&&!seen[j]){seen[j]=1;queue.push(j)}}}
  if(queue.length>largest.length)largest=queue
 }const result=new Uint8Array(mask.length);largest.forEach(i=>result[i]=1);return result
}
function simplify(points:Point[],tolerance:number):Point[]{
 if(points.length<3)return points
 const a=points[0],b=points[points.length-1];let max=0,index=0
 for(let i=1;i<points.length-1;i++){const p=points[i],dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;const t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den)):0;const d=Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);if(d>max){max=d;index=i}}
 return max>tolerance?[...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)]:[a,b]
}
function smooth(points:Point[]){let ps=points
 for(let iteration=0;iteration<2;iteration++){const next:Point[]=[];ps.forEach((p,i)=>{const q=ps[(i+1)%ps.length];next.push({x:p.x*.75+q.x*.25,y:p.y*.75+q.y*.25},{x:p.x*.25+q.x*.75,y:p.y*.25+q.y*.75})});ps=next}return ps
}
export function inspectImage(image:HTMLImageElement):ImageAsset{
 const cached=assetCache.get(image);if(cached)return cached
 const w=Math.max(1,Math.round(N*Math.min(1,image.naturalWidth/image.naturalHeight))),h=Math.max(1,Math.round(N*Math.min(1,image.naturalHeight/image.naturalWidth)))
 const pad=4,W=w+pad*2,H=h+pad*2,canvas=document.createElement('canvas');canvas.width=W;canvas.height=H
 const c=canvas.getContext('2d',{willReadFrequently:true})!;c.drawImage(image,pad,pad,w,h);const data=c.getImageData(0,0,W,H).data
 let clear=0,solid=0,edgeClear=0;let minX=W,minY=H,maxX=0,maxY=0;const raw=new Uint8Array(W*H)
 for(let y=pad;y<h+pad;y++)for(let x=pad;x<w+pad;x++){const a=data[(y*W+x)*4+3];if(a<32){clear++;if(x===pad||x===w+pad-1||y===pad||y===h+pad-1)edgeClear++}if(a>64){raw[y*W+x]=1;solid++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}}
 const transparent=edgeClear>1&&clear>=Math.max(4,w*h*.005)&&solid>16
 let silhouette:Silhouette|null=null
 if(transparent){
  const mask=mainComponent(morphology(morphology(raw,W,H,true),W,H,false),W,H)
  minX=W;minY=H;maxX=0;maxY=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(mask[y*W+x]){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
  const exterior=new Uint8Array(W*H),queue=[0];exterior[0]=1
  for(let q=0;q<queue.length;q++){const i=queue[q],x=i%W,y=Math.floor(i/W);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,j=yy*W+xx;if(xx>=0&&xx<W&&yy>=0&&yy<H&&!mask[j]&&!exterior[j]){exterior[j]=1;queue.push(j)}}}
  for(let i=0;i<mask.length;i++)if(!exterior[i])mask[i]=1
  const edges=new Map<string,Point>();const key=(x:number,y:number)=>`${x},${y}`
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!mask[y*W+x])continue
   if(!mask[(y-1)*W+x])edges.set(key(x,y),{x:x+1,y})
   if(!mask[y*W+x+1])edges.set(key(x+1,y),{x:x+1,y:y+1})
   if(!mask[(y+1)*W+x])edges.set(key(x+1,y+1),{x,y:y+1})
   if(!mask[y*W+x-1])edges.set(key(x,y+1),{x,y})
  }
  const first=edges.keys().next().value as string|undefined
  if(first){let current=first;const path:Point[]=[]
   for(let i=0;i<=edges.size;i++){const [x,y]=current.split(',').map(Number);path.push({x,y});const next=edges.get(current);if(!next)break;current=key(next.x,next.y);if(current===first)break}
   if(path.length>=4){const halfway=Math.floor(path.length/2);const simplified=[...simplify(path.slice(0,halfway+1),.75).slice(0,-1),...simplify([...path.slice(halfway),path[0]],.75).slice(0,-1)]
    const bw=maxX-minX+1,bh=maxY-minY+1
    silhouette={points:smooth(simplified).map(p=>({x:(p.x-minX)/bw,y:(p.y-minY)/bh})),bounds:{x:(minX-pad)/w*image.naturalWidth,y:(minY-pad)/h*image.naturalHeight,w:bw/w*image.naturalWidth,h:bh/h*image.naturalHeight}}
   }
  }
 }
 const asset={image,thumbnail:canvas.toDataURL('image/png'),transparent:transparent&&!!silhouette,silhouette};assetCache.set(image,asset);return asset
}
export async function readImage(file:File):Promise<ImageAsset>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('请选择 JPG、PNG 或 WebP 格式的照片。')
 if(file.size>40*1024*1024)throw new Error('照片超过 40 MB，请选择一张更小的图片。')
 const url=URL.createObjectURL(file)
 try{const image=new Image();image.src=url;await image.decode();if(!image.naturalWidth)throw new Error('这张照片未能读取，请重新选择。');return inspectImage(image)}catch{throw new Error('这张照片未能读取，请重新选择。')}finally{URL.revokeObjectURL(url)}
}
