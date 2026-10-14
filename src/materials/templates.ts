export type MaterialId = 'photocard' | 'postcard' | 'polaroid' | 'strip' | 'ticket' | 'badge' | 'charm' | 'standee' | 'banner' | 'tyvek'
export type Finish = 'glossy' | 'matte' | 'holographic' | 'starlight' | 'glass' | 'default'
export interface Crop { x: number; y: number; zoom: number }
export interface Rect { x: number; y: number; w: number; h: number }
export interface MaterialTemplate {
  id: MaterialId; name: string; english: string; shape: 'rounded' | 'paper' | 'ticket' | 'circle' | 'acrylic' | 'bag';
  duplex?: boolean; backDefault?: 'front'; foilEnabled?: boolean; width: number; height: number; radius: number; regions: Rect[]; finishes: Finish[]; defaultFinish: Finish; rotation: number;
}
// Coordinates use a shared 600 × 600 artboard. Add a template and renderer to extend.
export const templates: MaterialTemplate[] = [
  { id:'photocard',name:'小卡',english:'Photocard',shape:'rounded',width:244,height:350,radius:13,regions:[{x:178,y:125,w:244,h:350}],duplex:true,finishes:['glossy','matte'],defaultFinish:'glossy',rotation:-0.06 },
  { id:'postcard',name:'明信片',english:'Postcard',shape:'paper',width:390,height:264,radius:1,regions:[{x:119,y:187,w:362,h:226}],duplex:true,finishes:['glossy','matte'],defaultFinish:'glossy',rotation:0.045 },
  { id:'polaroid',name:'拍立得',english:'Polaroid',shape:'paper',width:280,height:346,radius:3,regions:[{x:179,y:146,w:242,h:240}],finishes:['default'],defaultFinish:'default',rotation:-0.06 },
  { id:'strip',name:'人生四格',english:'Photo Strip',shape:'paper',width:158,height:452,radius:2,regions:[0,1,2,3].map(i=>({x:234,y:88+i*99,w:132,h:91})),finishes:['default'],defaultFinish:'default',rotation:0.055 },
  { id:'ticket',name:'票根',english:'Ticket',shape:'ticket',width:424,height:186,radius:7,regions:[{x:101,y:220,w:271,h:160}],finishes:['default'],defaultFinish:'default',rotation:-0.035 },
  { id:'badge',name:'圆形徽章',english:'Button Badge',shape:'circle',width:290,height:290,radius:145,regions:[{x:163,y:163,w:274,h:274}],finishes:['glossy','matte'],defaultFinish:'glossy',rotation:0 },
  { id:'charm',name:'亚克力挂件',english:'Acrylic Charm',shape:'acrylic',width:236,height:296,radius:55,regions:[{x:195,y:184,w:210,h:260}],finishes:['default'],defaultFinish:'default',rotation:0.06 },
  { id:'standee',name:'亚克力立牌',english:'Acrylic Standee',shape:'acrylic',width:270,height:370,radius:20,regions:[{x:185,y:108,w:230,h:344}],finishes:['default'],defaultFinish:'default',rotation:0 },
  { id:'banner',name:'应援手幅',english:'Slogan Banner',shape:'paper',width:480,height:160,radius:1,regions:[{x:62,y:222,w:476,h:156}],duplex:true,finishes:['default'],defaultFinish:'default',rotation:0 },
  { id:'tyvek',name:'杜邦袋',english:'Tyvek Tote Bag',shape:'bag',width:420,height:284,radius:0,regions:[{x:96,y:244,w:408,h:248}],duplex:true,backDefault:'front',finishes:['default'],defaultFinish:'default',rotation:0 },
]
export const defaultCrop = (): Crop => ({x:0,y:0,zoom:1})
export const finishLabels: Record<Finish,{name:string;english:string;description:string}> = {
 glossy:{name:'亮膜',english:'Glossy',description:'轻盈反光，让喜欢的瞬间更鲜亮。'},
 matte:{name:'哑膜',english:'Matte',description:'柔和纸感，安静收藏每个细节。'},
 holographic:{name:'彩虹镭射',english:'Holographic',description:'细微虹彩，像把一束光收藏起来。'},
 starlight:{name:'星光膜',english:'Starlight',description:'细小星形反射，随倾角闪烁。'},
 glass:{name:'碎玻璃镭射',english:'Crystal',description:'不规则碎片反射，轻轻转动观察虹彩。'},
 default:{name:'默认',english:'Original',description:'保留照片本来的美好。'},
}
