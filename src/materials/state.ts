import type { ImageAsset } from './transparency'
import { defaultCrop } from './templates'
import type { Crop, Finish, MaterialId, MaterialTemplate } from './templates'
import { templates } from './templates'
export type Side = 'front' | 'back'
export type ExportMode = 'both' | Side
export type Foil = 'none' | 'border' | 'stars'
export type AcrylicShape = 'rectangle' | 'square' | 'circle' | 'custom'
export interface Angle { x:number; y:number }
export interface MaterialState {
 frontImage:ImageAsset|null; customCrop:Crop; side:Side; backImage:ImageAsset|null; backCrop:Crop; exportMode:ExportMode;
 crop:Crop; finish:Finish; foil:Foil; angle:Angle; acrylicShape:AcrylicShape;
 whiteSource:ImageAsset|null; whiteTolerance:number; whiteAppliedTolerance:number|null;
 stripImages:(ImageAsset|null)[]; stripCrops:Crop[]; customAsset:ImageAsset|null
}
export const initialStates=()=>Object.fromEntries(templates.map(t=>[t.id,{
 frontImage:null,customCrop:defaultCrop(),side:'front',backImage:null,backCrop:defaultCrop(),exportMode:'both',
 crop:defaultCrop(),finish:t.defaultFinish,foil:'none',angle:{x:0,y:0},acrylicShape:'rectangle',
 whiteSource:null,whiteTolerance:32,whiteAppliedTolerance:null,
 stripImages:[null,null,null,null],stripCrops:[0,1,2,3].map(i=>({...defaultCrop(),zoom:1+i*.075})),customAsset:null,
}])) as Record<MaterialId,MaterialState>
export interface RenderOptions {
 transparentBackground?:boolean; customCrop?:Crop; side?:Side; surfaceFinish?:Finish; sourceImage?:HTMLImageElement; angle?:Angle; foil?:Foil; acrylicShape?:AcrylicShape; customAsset?:ImageAsset|null;
 stripImages?:(ImageAsset|null)[]; stripCrops?:Crop[]; presentation?:boolean
}
export const foilLabels:Record<Foil,string>={none:'无烫金',border:'金色边框',stars:'金色星星'}
export const shapeLabels:Record<AcrylicShape,string>={rectangle:'长方形',square:'正方形',circle:'圆形',custom:'异形'}

/** Linked bags have one live crop until a separate back photo is uploaded. */
export const backFollowsFront=(template:MaterialTemplate,state:MaterialState)=>template.backDefault==='front'&&!state.backImage
export const faceCrop=(template:MaterialTemplate,state:MaterialState,side:Side)=>side==='back'&&!backFollowsFront(template,state)?state.backCrop:state.crop

export const frontAsset=(state:MaterialState,source:ImageAsset)=>state.frontImage??source
