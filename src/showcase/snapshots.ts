import { renderMaterial } from '../materials/render'
import { faceCrop, frontAsset } from '../materials/state'
import type { MaterialState, Side } from '../materials/state'
import type { ImageAsset } from '../materials/transparency'
import type { MaterialTemplate } from '../materials/templates'
import { defaultBack } from '../materials/backs'
import { uid } from './model'
import type { Artwork } from './model'
/** Trim only empty outside space; keep the original material pixels, edges and shadows. */
export function trimCanvas(original:HTMLCanvasElement){
 const {width:w,height:h}=original,c=original.getContext('2d')!,data=c.getImageData(0,0,w,h).data
 let x0=w,y0=h,x1=-1,y1=-1
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>2){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
 if(x1<0)throw new Error('物料图像为空，请返回编辑页检查图片。')
 const pad=8;x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(w-1,x1+pad);y1=Math.min(h-1,y1+pad)
 const target=document.createElement('canvas');target.width=x1-x0+1;target.height=y1-y0+1;target.getContext('2d')!.drawImage(original,x0,y0,target.width,target.height,0,0,target.width,target.height);return target
}
export async function materialArtwork(template:MaterialTemplate,source:ImageAsset,state:MaterialState,side:Side=state.side):Promise<Artwork>{
 const front=frontAsset(state,source),customAsset=state.customAsset??(front.transparent?front:null)
 if((template.id==='standee'||template.id==='charm'&&state.acrylicShape==='custom')&&!customAsset)throw new Error('请先为异形物料上传透明底素材。')
 const asset=side==='back'&&template.duplex?(state.backImage??(template.backDefault==='front'?front:await defaultBack(template))):front
 const canvas=document.createElement('canvas')
 renderMaterial(canvas,template,asset.image,faceCrop(template,state,side),state.finish,1800,false,{...state,side,sourceImage:source.image,customAsset,transparentBackground:true})
 return {id:uid(),kind:'material',label:template.name+(template.duplex?(side==='back'?' · 背面':' · 正面'):''),materialId:template.id,side,canvas:trimCanvas(canvas)}
}
export async function downloadCanvas(canvas:HTMLCanvasElement,name:string){
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('图片生成失败，请重试。')),'image/png'))
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),60000)
}
export async function externalArtwork(file:File):Promise<Artwork>{
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('请选择 JPG、PNG 或 WebP 图片。')
 if(file.size>40*1024*1024)throw new Error('图片过大，请选择小于 40 MB 的图片。')
 const url=URL.createObjectURL(file)
 try{const image=new Image();image.src=url;await image.decode();const scale=Math.min(1,3000/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);return {id:uid(),kind:'image',label:file.name,canvas}}
 finally{URL.revokeObjectURL(url)}
}
