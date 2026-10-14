import type { MaterialId, MaterialTemplate } from './templates'
import { inspectImage } from './transparency'
import type { ImageAsset } from './transparency'
const cache=new Map<MaterialId,Promise<ImageAsset>>()
/** A local bitmap sized to the existing photo window; orientation and edge geometry stay unchanged. */
export function defaultBack(template:MaterialTemplate):Promise<ImageAsset>{
 const cached=cache.get(template.id);if(cached)return cached
 const result=(async()=>{
  const region=template.regions[0],scale=4,canvas=document.createElement('canvas');canvas.width=region.w*scale;canvas.height=region.h*scale
  const c=canvas.getContext('2d')!;c.scale(scale,scale);c.fillStyle='#FAF9F6';c.fillRect(0,0,region.w,region.h)
  const spacing=36,columns=Math.floor(region.w/spacing),rows=Math.floor(region.h/spacing),startX=(region.w-(columns-1)*spacing)/2,startY=(region.h-(rows-1)*spacing)/2
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   c.beginPath();c.arc(startX+col*spacing,startY+row*spacing,3.1,0,Math.PI*2);c.fillStyle=(row+col)%2?'#C9E6F5':'#F6DCE6';c.fill()
  }
  const image=new Image();image.src=canvas.toDataURL('image/png');await image.decode();return inspectImage(image)
 })();cache.set(template.id,result);return result
}
