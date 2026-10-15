import type { MaterialId } from '../materials/templates'
import type { Side } from '../materials/state'
export type BackgroundKind='solid'|'dots'|'stripe'|'gingham'|'gradient'|'glow'
export type Ratio='3:4'|'1:1'|'9:16'
export type Layout='center'|'overlap'|'side'|'free'
export interface Artwork { id:string; label:string; kind:'material'|'image'; canvas:HTMLCanvasElement; materialId?:MaterialId; side?:Side }
export interface Layer { id:string; artwork:Artwork; x:number; y:number; scale:number; rotation:number; visible:boolean }
export interface Background { kind:BackgroundKind; mode:'clean'|'soft'; primary:string; secondary:string; dotSize:number; spacing:number; stripeWidth:number; horizontal:boolean; density:number; direction:number; glow:number }
export interface Board { ratio:Ratio; background:Background; layers:Layer[]; shadow:boolean; layout:Layout }
export const dimensions:Record<Ratio,[number,number]>={'3:4':[1500,2000],'1:1':[2000,2000],'9:16':[1080,1920]}
export const palettes=[['Baby Blue','#A9DDF5','#F6B8CD'],['Cherry Soda','#C84054','#FFF1E5'],['Butter Yellow','#F6E4A0','#A6BEE6'],['Matcha Cream','#B7CBA3','#F9F1DA'],['Grape Candy','#BDA9E5','#F5BEDA'],['Chocolate','#765447','#F3E4D2'],['Silver Blue','#C3D6E7','#F4F4F4'],['Black & Pink','#252525','#F4AEC8']] as const
let instanceId=0
// LAN previews on phones may use HTTP, where randomUUID is unavailable.
export const uid=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():`showcase-${Date.now().toString(36)}-${(++instanceId).toString(36)}`
export function layerFor(artwork:Artwork):Layer{return {id:uid(),artwork,x:.5,y:.5,scale:.78,rotation:0,visible:true}}
export function arrange(layers:Layer[],layout:Layout):Layer[]{
 if(layout==='free')return layers
 const n=layers.length
 return layers.map((l,i)=>{
  if(n===1)return {...l,x:.5,y:.5,scale:.78,rotation:0}
  if(layout==='overlap'&&n===2)return {...l,x:i?.66:.36,y:i?.69:.32,scale:i?.60:.64,rotation:i?10:-8}
  const cols=layout==='side'?Math.min(n,3):Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols)
  return {...l,x:(i%cols+.5)/cols,y:(Math.floor(i/cols)+.5)/rows,scale:Math.min(.78,.86/Math.max(cols,rows)),rotation:layout==='overlap'?(i%2?8:-8):0}
 })
}
export const newBoard=(art:Artwork):Board=>({ratio:'3:4',background:{kind:'dots',mode:'soft',primary:palettes[0][1],secondary:palettes[0][2],dotSize:12,spacing:130,stripeWidth:70,horizontal:false,density:8,direction:45,glow:.55},layers:[layerFor(art)],shadow:true,layout:'center'})
export function addArtwork(board:Board,art:Artwork):Board{
 const layers=[...board.layers,layerFor(art)]
 if(board.layout==='free')return {...board,layers}
 const layout=layers.length===2?'overlap':'side'
 return {...board,layout,layers:arrange(layers,layout)}
}
export const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value))
export const normalizeRotation=(r:number)=>((r+180)%360+360)%360-180
