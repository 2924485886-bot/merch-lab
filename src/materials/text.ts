import type { MaterialId } from './templates'
import type { RenderOptions } from './state'
export const textFields:Partial<Record<MaterialId,{key:string;label:string;placeholder:string;max:number}[]>>={
 postcard:[{key:'caption',label:'装饰短句',placeholder:'A MOMENT TO KEEP.',max:32}],
 polaroid:[{key:'caption',label:'下方短句',placeholder:'my favorite moment',max:32}],
 strip:[{key:'caption',label:'底部短句',placeholder:'WITH LOVE · MERCH LAB',max:32}],
 ticket:[{key:'label',label:'顶部标签',placeholder:'ADMIT ONE',max:18},{key:'title',label:'主标题',placeholder:'Love',max:16},{key:'number',label:'编号',placeholder:'NO. 0520',max:18}],
}
/** Empty means no ink; fit within the existing text zone without changing product geometry. */
export function drawTemplateText(c:CanvasRenderingContext2D,options:RenderOptions,key:string,x:number,y:number,width:number){
 const value=options.texts?.[options.side??'front']?.[key]??''
 if(value.trim())c.fillText(value,x,y,width)
}
