import {useState} from 'react'
import {createRoot} from 'react-dom/client'
import Showcase from '../src/showcase/Showcase'
import {newBoard,dimensions} from '../src/showcase/model'
import type {Board,Ratio} from '../src/showcase/model'
import '../src/styles.css'
import '../src/home/home.css'
const art=document.createElement('canvas');art.width=360;art.height=500;const g=art.getContext('2d')!;g.fillStyle='#AFE3FA';g.fillRect(0,0,360,500);g.fillStyle='#F9CAD5';g.fillRect(0,0,180,500);g.fillStyle='#252525';g.font='bold 40px sans-serif';g.fillText('MERCH LAB',40,250)
const artwork={id:'demo',kind:'image' as const,label:'示例图片',canvas:art}
let current:Board=newBoard(artwork);function Host(){const [board,setBoard]=useState(current);current=board;return <Showcase board={board} artworks={[artwork]} onChange={setBoard} onBack={()=>{}}/>}
createRoot(document.getElementById('root')!).render(<div className="app-shell"><header className="site-header">Merch Lab</header><Host/><footer>Merch Lab</footer></div>)
const checks:string[]=[],errors:string[]=[],tick=()=>new Promise(r=>setTimeout(r,80))
function check(ok:unknown,label:string){if(!ok)throw Error(label);checks.push('PASS '+label);document.getElementById('test-results')!.textContent=checks.join('\n')}
window.addEventListener('error',e=>errors.push(e.message));window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)))
const panel=()=>document.querySelector<HTMLDivElement>('.studio-parameter-scroll')!,canvas=()=>document.querySelector<HTMLCanvasElement>('.showcase-artboard canvas')!,rect=()=>canvas().getBoundingClientRect()
function visible(){const r=rect();return r.top>=0&&r.bottom<=window.innerHeight&&r.left>=0&&r.right<=window.innerWidth}
async function click(name:string){const b=[...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.trim()===name||b.querySelector('strong')?.textContent===name);if(!b)throw Error(name);b.click();await tick()}
async function range(label:string,value:number){const e=document.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;e.scrollIntoView({block:'nearest'});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(e,String(value));e.dispatchEvent(new Event('input',{bubbles:true}));await tick()}
let exported:Blob|null=null;const urls=new Map<string,Blob>(),native=URL.createObjectURL.bind(URL);URL.createObjectURL=b=>{const u=native(b);urls.set(u,b);return u};HTMLAnchorElement.prototype.click=function(){if(this.download)exported=urls.get(this.href)??null}
async function run(){await tick();await tick();const mobile=window.innerWidth<=640
 if(mobile){check(getComputedStyle(document.querySelector('.showcase')!).position==='fixed','Mobile viewport shell is fixed');check(panel().scrollHeight>panel().clientHeight,'Settings have their own scroll range');check(getComputedStyle(panel()).overflowY==='auto','Only parameter body owns vertical scrolling');check(visible(),'Full artwork visible before scrolling');const start=rect(),scroll=window.scrollY;panel().scrollTop=panel().scrollHeight;await tick();check(panel().scrollTop>0,'Long parameter panel scrolls');check(Math.abs(rect().top-start.top)<1&&Math.abs(rect().height-start.height)<1,'Preview geometry stays fixed during scrolling');check(window.scrollY===scroll,'Document does not scroll with settings');const layer=JSON.stringify(current.layers),before=canvas().toDataURL();await range('圆点大小',26);check(canvas().toDataURL()!==before,'Dot size updates visible preview live');check(visible(),'Preview remains visible at dot-size control');const next=canvas().toDataURL();await range('圆点间距',180);check(canvas().toDataURL()!==next,'Dot spacing updates preview live');check(JSON.stringify(current.layers)===layer,'Parameter scrolling and input do not move, scale or rotate artwork');for(const name of ['排版','物料','图片','背景']){await click(name);check(visible()&&Math.abs(rect().top-start.top)<1,'Tab '+name+' keeps preview stationary');check(panel().scrollTop===0,'Tab '+name+' resets only internal scroll')}
 }else check(getComputedStyle(document.querySelector('.showcase')!).position!=='fixed','Desktop layout remains in normal document flow')
 await click('排版');for(const ratio of ['1:1','9:16','3:4'] as Ratio[]){await click(ratio);const r=rect(),[w,h]=dimensions[ratio];check(Math.abs(r.width/r.height-w/h)<.005,ratio+' preview retains original ratio');if(mobile)check(visible(),ratio+' fits available preview height');exported=null;await click('保存展示图');for(let i=0;i<100&&!exported;i++)await tick();const img=new Image();img.src=native(exported!);await img.decode();check(img.width===w&&img.height===h,ratio+' PNG retains original export dimensions')}
 await click('背景');check(errors.length===0,'No browser exceptions');document.getElementById('test-results')!.textContent+='\nALL PASS';document.title='Showcase scrolling · ALL PASS'
}
void run().catch(e=>{document.title='FAIL';document.getElementById('test-results')!.textContent+='\nFAIL '+e.stack})
