import { inspectImage } from './transparency'
import type { ImageAsset } from './transparency'
const failure='未能可靠识别白底或主体。请调整识别容差；如果背景复杂，请改用透明 PNG 或 WebP 图片。'
export class WhiteRemovalCancelled extends Error {}
const pause=()=>new Promise<void>(resolve=>setTimeout(resolve,0))
/** Only edge-connected near-white pixels are removed; enclosed whites stay untouched.
 * The original decoded image is read-only. Work is bounded for mobile memory/latency. */
export async function removeWhiteBackground(source:ImageAsset,tolerance=32,cancelled=()=>false):Promise<ImageAsset>{
 if(source.transparent)return source
 const check=()=>{if(cancelled())throw new WhiteRemovalCancelled()}
 check();const image=source.image,scale=Math.min(1,1800/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas')
 canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale))
 const w=canvas.width,h=canvas.height,n=w*h,c=canvas.getContext('2d',{willReadFrequently:true})!;c.drawImage(image,0,0,w,h)
 const pixels=c.getImageData(0,0,w,h),data=pixels.data,threshold=Math.max(10,Math.min(80,tolerance))
 const edge:number[]=[];for(let x=0;x<w;x++){edge.push(x,(h-1)*w+x)}for(let y=1;y<h-1;y++){edge.push(y*w,y*w+w-1)}
 const samples:[number[],number[],number[]]=[[],[],[]];let white=0
 for(const i of edge){const p=i*4,r=data[p],g=data[p+1],b=data[p+2];if(data[p+3]<32||Math.min(r,g,b)>=220&&Math.max(r,g,b)-Math.min(r,g,b)<25){white++;if(data[p+3]>220){samples[0].push(r);samples[1].push(g);samples[2].push(b)}}}
 if(edge.length<8||white/edge.length<.75||samples[0].length<4)throw new Error(failure)
 const matte=samples.map(values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)])
 const eligible=new Uint8Array(n),outside=new Uint8Array(n),queue=new Uint32Array(n)
 for(let i=0;i<n;i++){const p=i*4,r=data[p],g=data[p+1],b=data[p+2],chroma=Math.max(r,g,b)-Math.min(r,g,b);eligible[i]=data[p+3]<32||255-Math.min(r,g,b)+chroma*.35<=threshold?1:0}
 let tail=0;const push=(i:number)=>{if(eligible[i]&&!outside[i]){outside[i]=1;queue[tail++]=i}}
 edge.forEach(push)
 for(let head=0;head<tail;head++){
  const i=queue[head],x=i%w;if(x)push(i-1);if(x<w-1)push(i+1);if(i>=w)push(i-w);if(i<n-w)push(i+w)
  if(head&&head%262144===0){await pause();check()}
 }
 const removed=tail/n
 if(removed<.12||removed>.985)throw new Error(failure)
 let minX=w,minY=h,maxX=0,maxY=0,foreground=0
 for(let i=0;i<n;i++)if(!outside[i]&&data[i*4+3]>64){foreground++;const x=i%w,y=Math.floor(i/w);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
 const bw=maxX-minX+1,bh=maxY-minY+1
 if(foreground<Math.max(32,n*.012)||bw<5||bh<5||foreground/(bw*bh)>.96&&bw>w*.85&&bh>h*.85)throw new Error(failure)
 const coarseScale=Math.min(128/w,128/h,1),cw=Math.max(1,Math.round(w*coarseScale)),ch=Math.max(1,Math.round(h*coarseScale)),coarse=new Uint8Array(cw*ch)
 for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const i=Math.min(h-1,Math.floor((y+.5)*h/ch))*w+Math.min(w-1,Math.floor((x+.5)*w/cw));coarse[y*cw+x]=!outside[i]&&data[i*4+3]>64?1:0}
 let total=0,largest=0;const seen=new Uint8Array(coarse.length)
 for(let i=0;i<coarse.length;i++)if(coarse[i]&&!seen[i]){const component=[i];seen[i]=1;for(let q=0;q<component.length;q++){const at=component[q],x=at%cw,y=Math.floor(at/cw);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,j=yy*cw+xx;if(xx>=0&&xx<cw&&yy>=0&&yy<ch&&coarse[j]&&!seen[j]){seen[j]=1;component.push(j)}}}total+=component.length;largest=Math.max(largest,component.length)}
 if(!total||largest/total<.65)throw new Error(failure)
 await pause();check()
 // A one-pixel boundary matte estimates coverage from nearby foreground. Never
 // feather the whole subject: this keeps enclosed clothes and eye highlights opaque.
 const deviation=(i:number)=>Math.max(Math.abs(data[i*4]-matte[0]),Math.abs(data[i*4+1]-matte[1]),Math.abs(data[i*4+2]-matte[2]))
 const result=new Uint8ClampedArray(data)
 for(let y=0;y<h;y++){
  if(y&&y%128===0){await pause();check()}
  for(let x=0;x<w;x++){
  const i=y*w+x,p=i*4;let touchesOutside=false,touchesInside=false,reference=0
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue
   const j=yy*w+xx;if(outside[j])touchesOutside=true;else if(data[j*4+3]>64){touchesInside=true;reference=Math.max(reference,deviation(j))}
  }
  if(outside[i]){
   result[p+3]=0
   if(!touchesInside||deviation(i)<6||reference<threshold+12)continue
  }else if(!touchesOutside||reference<threshold+12)continue
  const alpha=Math.min(1,deviation(i)/Math.max(reference,1))
  if(alpha<.015){result[p+3]=0;continue}
  result[p+3]=Math.round(data[p+3]*alpha)
  if(alpha<1)for(let ch=0;ch<3;ch++)result[p+ch]=Math.max(0,Math.min(255,(data[p+ch]-matte[ch]*(1-alpha))/alpha))
 }
 }
 pixels.data.set(result);c.putImageData(pixels,0,0);check()
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('去白底图片生成失败，请重试。')),'image/png'))
 const url=URL.createObjectURL(blob)
 try{
  const processed=new Image();processed.src=url;await processed.decode();check();const asset=inspectImage(processed)
  if(!asset.transparent||!asset.silhouette)throw new Error(failure)
  // Reject fragmented texture/background residue rather than inventing a contour.
  const bounds=asset.silhouette.bounds,coverage=(bounds.w*bounds.h)/(w*h)
  if(coverage>.98||coverage<.01)throw new Error(failure)
  return asset
 }finally{URL.revokeObjectURL(url)}
}
