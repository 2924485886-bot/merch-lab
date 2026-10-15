/** Real photographed cutout layer only; no drawn substitute is used when the asset is absent. */
export interface HardwareDefinition {
 url:string; width:number; height:number;
 /** The lower connector's normalized attachment point aligns with the acrylic hole. */
 attachment:{x:number;y:number}; source:string; author:string; license:string
}
// Reserved for a verified, reusable transparent PNG/WebP clasp + connector-ring cutout.
export const hardwareDefinition:HardwareDefinition|null=null
let image:HTMLImageElement|null=null
let loadedDefinition:HardwareDefinition|null=null
export async function prepareHardware(definition:HardwareDefinition|null=hardwareDefinition){
 if(!definition)return
 try{const loaded=new Image();loaded.src=definition.url;await loaded.decode();image=loaded;loadedDefinition=definition}catch{image=null;loadedDefinition=null}
}
export function hasHardwareAsset(){return image!==null}
export function renderHardware(c:CanvasRenderingContext2D,x:number,y:number,transparent=false){
 // This is the acrylic mounting tab and hole, not a simulated metal clasp.
 c.beginPath();c.arc(x,y,14,0,Math.PI*2);c.fillStyle='rgba(224,239,242,.9)';c.fill();c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=2;c.stroke()
 c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.save();if(transparent)c.globalCompositeOperation='destination-out';c.fillStyle='#f0efea';c.fill();c.restore();c.strokeStyle='rgba(135,171,182,.45)';c.lineWidth=1;c.stroke()
 const definition=loadedDefinition
 if(!image||!definition)return
 c.save();c.shadowColor='rgba(50,55,57,.16)';c.shadowBlur=4;c.shadowOffsetY=2
 c.drawImage(image,x-definition.attachment.x*definition.width,y-definition.attachment.y*definition.height,definition.width,definition.height);c.restore()
}
