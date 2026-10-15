// Open /tests/showcase.html for integrated checks, ?demo=bag for the screenshot fixture.
import { createRoot } from 'react-dom/client'
import App from '../src/App'
import '../src/styles.css'
import { loadStudioArt } from '../src/home/exampleArt'
import { inspectImage } from '../src/materials/transparency'
import { templates } from '../src/materials/templates'
import { initialStates } from '../src/materials/state'
import { materialArtwork, externalArtwork } from '../src/showcase/snapshots'
import { addArtwork, arrange, dimensions, newBoard, uid } from '../src/showcase/model'
import type { BackgroundKind, Ratio } from '../src/showcase/model'
import { renderBoard } from '../src/showcase/render'
const results:string[]=[],errors:string[]=[],demo=new URLSearchParams(location.search).has('demo')
const tick=()=>new Promise(r=>setTimeout(r,100))
function check(ok:unknown,label:string){if(!ok)throw new Error(label);results.push('PASS '+label);document.getElementById('test-results')!.textContent=results.join('\n')}
async function until(fn:()=>boolean){for(let i=0;i<150;i++){if(fn())return;await tick()}throw new Error('Timed out')}
async function click(text:string){const button=[...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.trim()===text||b.querySelector('h2')?.textContent===text||b.querySelector('strong')?.textContent===text);if(!button)throw new Error('Missing '+text);button.click();await tick()}
async function upload(label:string,file:File){const input=document.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!,files=new DataTransfer();files.items.add(file);input.files=files.files;input.dispatchEvent(new Event('change',{bubbles:true}));await tick();await until(()=>!document.querySelector('.studio-entry-actions button:disabled'));await tick()}
async function fixture(image:HTMLImageElement,name:string){const c=document.createElement('canvas');c.width=image.width;c.height=image.height;c.getContext('2d')!.drawImage(image,0,0);const blob=await new Promise<Blob>(r=>c.toBlob(b=>r(b!),'image/png'));return new File([blob],name,{type:'image/png'})}
function range(label:string,value:number){const el=document.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(el,String(value));el.dispatchEvent(new Event('input',{bubbles:true}))}
const pixel=(c:HTMLCanvasElement,x:number,y:number)=>[...c.getContext('2d')!.getImageData(x,y,1,1).data]
const stage=()=>document.querySelector<HTMLCanvasElement>('.showcase-artboard canvas')!
const editor=()=>document.querySelector<HTMLCanvasElement>('.editor-stage canvas')!
let exported:Blob|null=null;const nativeUrl=URL.createObjectURL.bind(URL),blobs=new Map<string,Blob>();URL.createObjectURL=(b:Blob)=>{const url=nativeUrl(b);blobs.set(url,b);return url};const nativeClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download){exported=blobs.get(this.href)??null;return}nativeClick.call(this)}
async function exportedImage(){await until(()=>!!exported);const image=new Image(),url=nativeUrl(exported!);image.src=url;await image.decode();URL.revokeObjectURL(url);return image}
async function saveBoard(ratio:Ratio){exported=null;await click('保存展示图');const image=await exportedImage();check(image.width===dimensions[ratio][0]&&image.height===dimensions[ratio][1],ratio+' studio PNG has exact dimensions');const down=document.createElement('canvas');down.width=stage().width;down.height=stage().height;down.getContext('2d')!.drawImage(image,0,0,down.width,down.height);const a=stage().getContext('2d')!.getImageData(0,0,down.width,down.height).data,b=down.getContext('2d')!.getImageData(0,0,down.width,down.height).data;let difference=0;for(let i=0;i<a.length;i++)difference+=Math.abs(a[i]-b[i]);check(difference/a.length<3,'Preview matches exported '+ratio+' PNG without selection frame')}
async function touchGesture(two=false){const c=stage(),box=c.getBoundingClientRect(),x=box.left+box.width/2,y=box.top+box.height/2,native=c.setPointerCapture;c.setPointerCapture=()=>{};const send=(type:string,id:number,dx:number,dy:number)=>c.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:id,pointerType:'touch',clientX:x+dx,clientY:y+dy}));send('pointerdown',1,two?-15:0,0);if(two)send('pointerdown',2,15,0);send('pointermove',1,two?-35:25,two?-20:20);if(two)send('pointermove',2,35,20);send('pointerup',1,0,0);if(two)send('pointerup',2,0,0);c.setPointerCapture=native;await tick()}
window.addEventListener('error',e=>errors.push(e.message));window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)))
createRoot(document.getElementById('root')!).render(<App/>);
async function run(){
 const uuid=crypto.randomUUID;Object.defineProperty(crypto,'randomUUID',{value:undefined,configurable:true});const idA=uid(),idB=uid();Object.defineProperty(crypto,'randomUUID',{value:uuid,configurable:true});check(idA!==idB,'Phone HTTP / LAN context has unique IDs without randomUUID');
 const [artA,artB]=await loadStudioArt(),source=inspectImage(artA),states=initialStates(),card=await materialArtwork(templates[0],source,states.photocard)
 check(pixel(card.canvas,0,0)[3]===0,'Material snapshot has real transparent corners')
 const b=newBoard(card),out=document.createElement('canvas')
 const cleanPrints=new Set<string>()
 for(const kind of ['solid','dots','stripe','gingham','gradient','glow'] as BackgroundKind[]){b.background.kind=kind;b.background.mode='clean';renderBoard(out,b,150);cleanPrints.add(out.toDataURL());const clean=out.toDataURL();b.background.mode='soft';renderBoard(out,b,150);check(clean!==out.toDataURL(),kind+' supports distinct Clean and Soft backgrounds');check(pixel(out,0,0)[3]===255,kind+' background exports opaque')}
 check(cleanPrints.size===6,'Six background types render distinct patterns')
 const red=document.createElement('canvas');red.width=red.height=20;red.getContext('2d')!.fillStyle='#ff0000';red.getContext('2d')!.fillRect(0,0,20,20)
 b.layers=[{...b.layers[0],artwork:{id:'red',label:'red',kind:'image',canvas:red},scale:.4}];b.shadow=false;b.background.mode='clean';renderBoard(out,b,150);const cleanCenter=pixel(out,75,100).join();b.background.mode='soft';renderBoard(out,b,150);check(cleanCenter===pixel(out,75,100).join()&&pixel(out,75,100)[0]===255,'Soft background does not blur or recolor artwork')
 const logo=document.createElement('canvas');logo.width=logo.height=120;const lc=logo.getContext('2d')!;lc.fillStyle='#252525';lc.beginPath();lc.arc(60,60,40,0,Math.PI*2);lc.fill();const blob=await new Promise<Blob>(r=>logo.toBlob(b=>r(b!),'image/png')),logoFile=new File([blob],'Logo.png',{type:'image/png'}),external=await externalArtwork(logoFile)
 check(pixel(external.canvas,0,0)[3]===0,'Imported PNG retains Alpha without white fill')
 for(const type of ['image/webp','image/jpeg']){const imageBlob=await new Promise<Blob>(r=>logo.toBlob(b=>r(b!),type));const imported=await externalArtwork(new File([imageBlob],'image.'+(type==='image/webp'?'webp':'jpg'),{type}));check(imported.canvas.width===120&&imported.canvas.height===120,type+' imports without changing aspect ratio');if(type==='image/webp')check(pixel(imported.canvas,0,0)[3]===0,'Imported WebP retains Alpha')}
 const person=new Image();person.src='/tests/fixtures/navy-transparent-person.png';await person.decode();const personSource=inspectImage(person)
 for(const template of templates){const snap=await materialArtwork(template,template.id==='standee'?personSource:source,states[template.id]);check(pixel(snap.canvas,0,0)[3]===0,template.id+' has a transparent full-material snapshot')}

 b.layers=arrange(addArtwork(newBoard(card),external).layers,'overlap');check(b.layers[0].rotation!==b.layers[1].rotation&&b.layers[0].x!==b.layers[1].x,'Overlap uses different angles and positions');const free=newBoard(card);free.layout='free';free.layers[0].x=.21;check(addArtwork(free,external).layers[0].x===.21,'Adding a layer preserves existing Free layout positions')
 await upload('选择照片',await fixture(artA,'Cover-A.png'));await click(demo?'杜邦袋':'小卡');await until(()=>!!editor())
 if(demo){await click('背面');await upload('选择背面图片',await fixture(artB,'Cover-B.png'));await click('正面')}
 const original=editor().toDataURL();await click('制作展示图');await until(()=>!!stage());check(document.querySelectorAll('.showcase-artboard canvas').length===1,'Editor opens populated studio')
 if(demo){await click('物料');await click('杜邦袋 · 背面');await click('排版');exported=null;await click('保存展示图');const saved=await exportedImage(),capture=document.createElement('canvas');capture.width=saved.width;capture.height=saved.height;capture.getContext('2d')!.drawImage(saved,0,0);const record=document.createElement('script');record.id='demo-png';record.type='application/json';record.textContent=capture.toDataURL('image/png');document.body.append(record);document.getElementById('test-results')!.remove();document.title='Merch Lab · Showcase Studio';window.scrollTo({top:0,behavior:'instant'});return}
 check(document.querySelector('.studio-backgrounds button[aria-pressed="true"]')?.textContent?.includes('波点'),'Default background is Polka Dot')
 const hex=document.querySelector<HTMLInputElement>('input[aria-label="背景颜色 HEX"]')!;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(hex,'#C3D6E7');hex.dispatchEvent(new Event('input',{bubbles:true}));await tick();check((document.querySelector('input[type=color]') as HTMLInputElement).value==='#c3d6e7','HEX edits update color picker and background')
 await click('Clean');await click('Soft');await saveBoard('3:4')
 const first=stage().toDataURL();await touchGesture();check(stage().toDataURL()!==first,'Single touch moves whole material');await touchGesture(true);check(Number(document.querySelector<HTMLInputElement>('input[aria-label="物料大小"]')!.value)>.78,'Two finger touch scales material');check(Math.abs(Number(document.querySelector<HTMLInputElement>('input[aria-label="旋转角度"]')!.value))>1,'Two finger touch rotates material')
 await click('返回物料编辑');check(editor().toDataURL()===original,'Studio gestures preserve original material crop and finish')
 exported=null;await click('保存物料 PNG');const png=await exportedImage(),c=document.createElement('canvas');c.width=png.width;c.height=png.height;c.getContext('2d')!.drawImage(png,0,0);check(pixel(c,0,0)[3]===0,'Transparent material PNG export keeps Alpha')
 await click('返回预览墙');await click('圆形徽章');await click('制作展示图');await until(()=>!!stage());await click('排版');check(document.querySelectorAll('.studio-layer-list>div').length===2,'Different edited materials combine without re-upload')
 for(const ratio of ['1:1','9:16','3:4'] as Ratio[]){await click(ratio);const box=stage().getBoundingClientRect();check(Math.abs(box.width/box.height-dimensions[ratio][0]/dimensions[ratio][1])<.002,'Displayed '+ratio+' canvas is not stretched');check(document.querySelectorAll('.studio-layer-list>div').length===2,'Ratio '+ratio+' retains layers');await saveBoard(ratio)}
 await click('图片');await upload('添加展示板图片',logoFile);await click('排版');check(document.querySelectorAll('.studio-layer-list>div').length===3,'External image becomes independent layer')
 range('物料大小',.35);range('旋转角度',25);await tick();check(Number(document.querySelector<HTMLInputElement>('input[aria-label="旋转角度"]')!.value)===25,'Desktop controls change selected layer rotation')
 await click('物料');await click('小卡 · 正面');await click('排版');check(document.querySelectorAll('.studio-layer-list>div').length===4,'Repeated material instances stay independent')
 const down=[...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.ariaLabel==='后移一层')!;down.click();await tick();check(document.querySelector('.studio-layer-list>div.selected')!==document.querySelector('.studio-layer-list>div'),'Layer can move backward');await saveBoard('3:4')
 document.querySelector<HTMLButtonElement>('button[aria-label="删除图层"]')!.click();await tick();check(document.querySelectorAll('.studio-layer-list>div').length===3,'Delete removes only selected instance')
 await click('返回物料编辑');await click('返回预览墙');await click('杜邦袋');await click('背面');await upload('选择背面图片',await fixture(artB,'Cover-B.png'));const bagBack=editor().toDataURL();await click('制作展示图');await until(()=>!!stage());await click('物料');await click('杜邦袋 · 正面');await click('排版');await click('错落重叠');await saveBoard('3:4');await click('返回物料编辑');check(editor().toDataURL()===bagBack,'Tyvek back photo and crop survive studio round trip')
 check(document.documentElement.scrollWidth<=innerWidth,'No mobile horizontal overflow');check(errors.length===0,'No uncaught app or Canvas errors');document.title='Showcase Studio · ALL PASS';document.getElementById('test-results')!.textContent=results.join('\n')+'\nALL PASS'
}
void run().catch(e=>{document.title='Showcase Studio · FAIL';document.getElementById('test-results')!.textContent=results.join('\n')+'\nFAIL '+e.message;console.error(e)})
