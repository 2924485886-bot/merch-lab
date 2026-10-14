// Run `npm run dev`, then open /tests/transparent-upload.html. No external requests.
import { createRoot } from 'react-dom/client'
import App from '../src/App'
import '../src/styles.css'
import { readImage } from '../src/materials/transparency'
import type { ImageAsset } from '../src/materials/transparency'
import { renderMaterial } from '../src/materials/render'
import { templates,defaultCrop } from '../src/materials/templates'
const results:string[]=[],uncaught:string[]=[]
const tick=()=>new Promise(r=>setTimeout(r,100))
const log=(s:string)=>{results.push(s);document.getElementById('test-results')!.textContent=results.join('\n')}
function check(v:unknown,label:string){if(!v)throw new Error(label);log('PASS '+label)}
async function until(fn:()=>boolean,label:string){for(let i=0;i<100;i++){if(fn())return;await tick()}throw new Error('Timeout: '+label)}
window.addEventListener('error',e=>uncaught.push(e.message));window.addEventListener('unhandledrejection',e=>uncaught.push(String(e.reason)))
const buttons=()=>[...document.querySelectorAll<HTMLButtonElement>('button')]
async function click(text:string){const b=buttons().find(b=>b.textContent?.trim()===text||b.querySelector('h2')?.textContent===text||b.getAttribute('aria-label')===text);if(!b)throw new Error('Missing '+text);b.click();await tick()}
const canvas=()=>document.querySelector<HTMLCanvasElement>('.editor-stage canvas')!
// Observe actual image identity and draw coordinates, rather than comparing JPEG/PNG
// resampling pixels: browsers may change mipmap quality after a large image warms up.
const drawCalls=new WeakMap<HTMLCanvasElement,{image:CanvasImageSource;geometry:unknown[]}>(),nativeDraw=CanvasRenderingContext2D.prototype.drawImage
CanvasRenderingContext2D.prototype.drawImage=function(...args:Parameters<typeof nativeDraw>){if(this.canvas instanceof HTMLCanvasElement&&this.canvas.classList.contains('material-canvas'))drawCalls.set(this.canvas,{image:args[0],geometry:args.slice(1)});nativeDraw.apply(this,args)}
const drawSignature=()=>drawCalls.get(canvas())!
const sameDraw=(a:ReturnType<typeof drawSignature>,b:ReturnType<typeof drawSignature>)=>a.image===b.image&&JSON.stringify(a.geometry)===JSON.stringify(b.geometry)

async function upload(label:string,file:File){const input=document.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!,d=new DataTransfer();d.items.add(file);input.files=d.files;input.dispatchEvent(new Event('change',{bubbles:true}));await tick();await until(()=>!document.querySelector('.image-control button:disabled'),'processing ends');await tick()}
async function fileFromCanvas(c:HTMLCanvasElement,name:string,type='image/png'){const b=await new Promise<Blob>(r=>c.toBlob(b=>r(b!),type));c.width=0;c.height=0;return new File([b],name,{type:b.type})}
async function localFile(name:string){return new File([await(await fetch('./fixtures/'+name)).blob()],name,{type:'image/png'})}
async function derived(asset:ImageAsset,kind:'two'|'webp'|'opaque'|'margin'|'large'){
 const image=asset.image,c=document.createElement('canvas');c.width=kind==='two'?image.naturalWidth*2+64:kind==='large'?2048:image.naturalWidth+(kind==='margin'?2:0);c.height=kind==='large'?Math.round(image.naturalHeight/image.naturalWidth*2048):image.naturalHeight+(kind==='margin'?2:0)
 const g=c.getContext('2d')!;if(kind==='opaque'){g.fillStyle='#faf9f6';g.fillRect(0,0,c.width,c.height)}
 if(kind==='two'){g.drawImage(image,0,0);g.drawImage(image,image.naturalWidth+64,0)}else if(kind==='margin')g.drawImage(image,1,1);else g.drawImage(image,0,0,c.width,c.height)
 return fileFromCanvas(c,kind+(kind==='webp'?'.webp':'.png'),kind==='webp'?'image/webp':'image/png')
}
let exported:Blob|null=null;const originalUrl=URL.createObjectURL.bind(URL),urls=new Map<string,Blob>();URL.createObjectURL=(blob:Blob)=>{const url=originalUrl(blob);urls.set(url,blob);return url};const nativeClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download){exported=urls.get(this.href)??null;return}nativeClick.call(this)}
async function save(){exported=null;document.querySelector<HTMLButtonElement>('.save-button')!.click();await until(()=>!!exported,'PNG');const image=new Image();image.src=originalUrl(exported!);await image.decode();check(image.naturalWidth===1800&&image.naturalHeight===1800,'PNG decodes at 1800 × 1800');const c=document.createElement('canvas');c.width=900;c.height=900;c.getContext('2d')!.drawImage(image,0,0,900,900);const a=canvas().getContext('2d')!.getImageData(330,150,240,550).data,b=c.getContext('2d')!.getImageData(330,150,240,550).data;let sum=0;for(let i=0;i<a.length;i+=4)sum+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);check(sum/(a.length/4*3)<6,'PNG artwork and contour match the preview at the same angle')}
async function range(id:string,value:string){const e=document.getElementById(id) as HTMLInputElement;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));await tick()}
createRoot(document.getElementById('root')!).render(<App/>);
(async()=>{
 await until(()=>!!document.querySelector('input[aria-label="选择照片"]'),'app')
 const real=await localFile('navy-transparent-person.png'),start=performance.now(),asset=await readImage(real);log('REAL PNG analysis ms: '+Math.round(performance.now()-start));check(asset.transparent&&!!asset.silhouette,'Real photographic PNG alpha and contour are recognized')
 const alpha=document.createElement('canvas');alpha.width=asset.image.naturalWidth;alpha.height=asset.image.naturalHeight;const g=alpha.getContext('2d')!;g.drawImage(asset.image,0,0);const rgba=g.getImageData(0,0,alpha.width,alpha.height).data;let clear=0,partial=0;for(let i=3;i<rgba.length;i+=4){if(rgba[i]===0)clear++;else if(rgba[i]<255)partial++}check(clear>0&&partial>0,'Decoded original retains transparent and semitransparent pixels');alpha.width=0;alpha.height=0
 const two=await derived(asset,'two'),webp=await derived(asset,'webp'),opaque=await derived(asset,'opaque'),margin=await derived(asset,'margin'),large=await derived(asset,'large'),hair=await localFile('transparent-hair.png')
 check(webp.type==='image/webp','WebP fixture preserves its actual codec');const cases:[string,File][]=[['single PNG',real],['two subjects PNG',two],['semitransparent hair PNG',hair],['transparent WebP',webp],['one-pixel margin PNG',margin],['high resolution PNG',large]]
 for(const [label,file] of cases){const t0=performance.now(),a=await readImage(file);check(a.transparent&&!!a.silhouette,label+' analysis succeeds');log(label+' decode + contour ms: '+Math.round(performance.now()-t0));for(const id of ['charm','standee']){const c=document.createElement('canvas');renderMaterial(c,templates.find(t=>t.id===id)!,a.image,defaultCrop(),'default',600,false,{customAsset:a,acrylicShape:'custom'});check(c.toDataURL().length>10000,label+' renders as '+id);c.width=0;c.height=0}}
 await upload('选择照片',opaque);await click('小卡');await range('zoom','1.7');const cardSignature=drawSignature();await click('返回预览墙');await click('亚克力挂件');await click('异形')
 let loadingObserved=false;const observer=new MutationObserver(()=>{if(document.querySelector('.image-control')?.textContent?.includes('正在生成异形轮廓'))loadingObserved=true});observer.observe(document.getElementById('root')!,{childList:true,subtree:true,characterData:true})
 for(const [label,file] of cases){await upload('选择透明底素材',file);check(document.querySelector('.transparent-upload')?.textContent?.includes('已识别真实透明区域')&&!document.querySelector('[role="alert"]'),label+' updates React and the charm preview')}
 observer.disconnect();check(loadingObserved,'Generating-outline status is displayed while processing');await save()
 const before=drawSignature();await upload('选择透明底素材',opaque);check(document.querySelector('[role="alert"]')?.textContent?.includes('这张图片没有检测到透明背景，请上传已去背的 PNG 或 WebP 图片。'),'Opaque PNG shows requested guidance');check(sameDraw(drawSignature(),before),'Rejected upload preserves the previous custom preview');await click('关闭提示')
 // Fail only the new asset preflight; subsequent paints use the previous valid asset.
 const line=Path2D.prototype.lineTo,context=HTMLCanvasElement.prototype.getContext;let armed=true,isPreflight=false;HTMLCanvasElement.prototype.getContext=function(...args:Parameters<typeof context>){isPreflight=this.width===600&&!this.classList.contains('material-canvas');return context.apply(this,args)};Path2D.prototype.lineTo=function(...args:Parameters<typeof line>){if(armed&&isPreflight){armed=false;throw new Error('QA_DRAW_FAILURE')}line.apply(this,args)}
 await upload('选择透明底素材',real);Path2D.prototype.lineTo=line;HTMLCanvasElement.prototype.getContext=context;check(document.querySelector('[role="alert"]')?.textContent?.includes('异形预览生成失败：QA_DRAW_FAILURE'),'Renderer failure becomes an explicit upload error');check(sameDraw(drawSignature(),before),'Failed preflight does not commit or clear the previous image');await click('关闭提示')
 const get=CanvasRenderingContext2D.prototype.getImageData;armed=true;CanvasRenderingContext2D.prototype.getImageData=function(...args:Parameters<typeof get>){if(armed){armed=false;throw new Error('QA_ALPHA_FAILURE')}return get.apply(this,args)}
 await upload('选择透明底素材',real);CanvasRenderingContext2D.prototype.getImageData=get;check(document.querySelector('[role="alert"]')?.textContent?.includes('透明轮廓计算失败：QA_ALPHA_FAILURE'),'Alpha/contour exception keeps its precise error stage');await click('关闭提示')
 await upload('选择透明底素材',new File(['not a PNG'],'broken.png',{type:'image/png'}));check(document.querySelector('[role="alert"]')?.textContent?.includes('图片解码失败'),'Broken PNG produces a decode error and exits loading');await click('关闭提示')
 armed=true;Path2D.prototype.lineTo=function(...args:Parameters<typeof line>){if(armed){armed=false;throw new Error('QA_ASYNC_DRAW_FAILURE')}line.apply(this,args)};await click('角度归零');Path2D.prototype.lineTo=line;check(document.querySelector('[role="alert"]')?.textContent?.includes('物料预览绘制失败'),'Late animation-frame drawing error is reported to the UI');await click('关闭提示')
 await click('返回预览墙');await click('亚克力立牌');await upload('选择透明底素材',real);check(document.querySelector('.transparent-upload')?.textContent?.includes('已识别真实透明区域'),'Real PNG updates standee state and connected base preview');await save();await click('返回预览墙');await click('小卡');check((document.getElementById('zoom') as HTMLInputElement).value==='1.7'&&sameDraw(drawSignature(),cardSignature),'Other material crop and image state remain unchanged')
 await click('返回预览墙');await click('亚克力挂件');await click('圆形');await range('zoom','1.4');check((document.getElementById('zoom') as HTMLInputElement).value==='1.4','Regular acrylic shape editing still works');await upload('\u9009\u62e9\u7167\u7247',real);await click('\u4e9a\u514b\u529b\u7acb\u724c');check(document.querySelector('.transparent-upload')?.textContent?.includes('\u5df2\u8bc6\u522b\u771f\u5b9e\u900f\u660e\u533a\u57df'),'Already-uploaded transparent source is reused without a second upload');check(uncaught.length===0,'No uncaught exceptions or unhandled rejections');check(document.documentElement.scrollWidth<=innerWidth,'No horizontal overflow');log('ALL PASS');document.title='Merch Lab 透明上传回归 · ALL PASS'
})().catch(e=>{log('FAIL '+e.stack);document.title='Merch Lab 透明上传回归 · FAIL'})
