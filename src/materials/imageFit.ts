import type { Crop, Rect } from './templates'
export const cropRatios=['原始比例','1:1','3:4','2:3','4:3','3:2','3:1'] as const
export type CropRatio=typeof cropRatios[number]
export function ratioValue(ratio:string,image:HTMLImageElement){if(ratio==='原始比例')return image.naturalWidth/image.naturalHeight;const [w,h]=ratio.split(':').map(Number);return w/h}
export function sourceRegion(image:HTMLImageElement,crop:Crop):Rect {
 const s=crop.selection??{x:0,y:0,w:1,h:1}
 return {x:s.x*image.naturalWidth,y:s.y*image.naturalHeight,w:s.w*image.naturalWidth,h:s.h*image.naturalHeight}
}
export const zoomMinimum=(crop:Crop)=>crop.fit==='contain'?.25:1
export function imageGeometry(image:HTMLImageElement,region:Rect,crop:Crop){
 const source=sourceRegion(image,crop),zoom=Math.max(zoomMinimum(crop),Math.min(3,crop.zoom)),base=(crop.fit==='contain'?Math.min:Math.max)(region.w/source.w,region.h/source.h),scale=base*zoom
 return {source,zoom,scale,w:source.w*scale,h:source.h*scale}
}
export function constrainCrop(image:HTMLImageElement,region:Rect,crop:Crop):Crop {
 const g=imageGeometry(image,region,crop),maxX=Math.abs(g.w-region.w)/2,maxY=Math.abs(g.h-region.h)/2
 return {...crop,zoom:g.zoom,x:Math.max(-maxX,Math.min(maxX,crop.x)),y:Math.max(-maxY,Math.min(maxY,crop.y))}
}
export function drawPhoto(c:CanvasRenderingContext2D,image:HTMLImageElement,r:Rect,crop:Crop){
 const p=constrainCrop(image,r,crop),g=imageGeometry(image,r,p),s=g.source
 c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip()
 if(p.fit==='contain'){c.fillStyle='#FFFFFF';c.fillRect(r.x,r.y,r.w,r.h)}
 c.drawImage(image,s.x,s.y,s.w,s.h,r.x+(r.w-g.w)/2+p.x,r.y+(r.h-g.h)/2+p.y,g.w,g.h);c.restore()
}
export function visiblePhotoFraction(image:HTMLImageElement,region:Rect,crop:Crop){const g=imageGeometry(image,region,crop);return Math.min(1,region.w/g.w)*Math.min(1,region.h/g.h)}
