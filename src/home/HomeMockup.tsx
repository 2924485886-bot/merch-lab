import { useEffect, useRef } from 'react'
import { renderMaterial } from '../materials/render'
import { templates, defaultCrop } from '../materials/templates'
import type { MaterialId } from '../materials/templates'
/** Homepage-only framing: render the existing template unchanged, then frame its body.
 * The DOM supplies a light display shadow outside the tight frame. User previews/export are untouched.
 */
export default function HomeMockup({id,image}:{id:MaterialId;image:HTMLImageElement}){
 const ref=useRef<HTMLCanvasElement>(null),t=templates.find(t=>t.id===id)!
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const sheet=document.createElement('canvas');renderMaterial(sheet,t,image,defaultCrop(),t.defaultFinish,1200,false);canvas.width=t.width*3;canvas.height=t.height*3;canvas.getContext('2d')!.drawImage(sheet,(600-t.width)/2*2,(600-t.height)/2*2,t.width*2,t.height*2,0,0,canvas.width,canvas.height);sheet.width=0;sheet.height=0},[t,image])
 return <div className={`studio-object object-${id}`}><canvas ref={ref} role="img" aria-label={`${t.name}原创字母图案样机`}/></div>
}
