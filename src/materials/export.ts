import { faceCrop, frontAsset } from './state'
import type { MaterialState, RenderOptions, Side } from './state'
import type { MaterialTemplate } from './templates'
import type { ImageAsset } from './transparency'
import { defaultBack } from './backs'
import { renderMaterial } from './render'
/** Export only Canvas artwork. Both sides share product geometry, finish and viewing angle. */
export async function renderExport(canvas:HTMLCanvasElement,template:MaterialTemplate,source:ImageAsset,state:MaterialState){
 const front=frontAsset(state,source)
 const back=template.duplex?(state.backImage??(template.backDefault==='front'?front:await defaultBack(template))):null
 const customAsset=state.customAsset??(front.transparent?front:null)
 const renderSide=(target:HTMLCanvasElement,side:Side,size:number)=>{
  const image=side==='back'?back!:front,crop=faceCrop(template,state,side)
  const options:RenderOptions={...state,side,customAsset,sourceImage:source.image}
  renderMaterial(target,template,image.image,crop,state.finish,size,false,options)
 }
 if(!template.duplex||state.exportMode!=='both'){
  renderSide(canvas,template.duplex&&state.exportMode==='back'?'back':'front',1800);return
 }
 canvas.width=2400;canvas.height=1400;const c=canvas.getContext('2d')!;c.fillStyle='#f0efea';c.fillRect(0,0,2400,1400)
 for(const [index,side] of (['front','back'] as Side[]).entries()){
  const tile=document.createElement('canvas');renderSide(tile,side,1200);c.drawImage(tile,index*1200,40)
  c.fillStyle='#899085';c.font='22px sans-serif';c.textAlign='center';c.fillText(side==='front'?'正面':'背面',index*1200+600,1265)
 }
}
