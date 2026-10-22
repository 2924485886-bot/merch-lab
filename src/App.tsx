import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, LockKeyhole, Sparkles, ImagePlus, X, LoaderCircle } from 'lucide-react'
import MaterialCanvas from './components/MaterialCanvas'
import Editor from './components/Editor'
import { templates, defaultCrop } from './materials/templates'
import type { MaterialId } from './materials/templates'
import { initialStates, frontAsset } from './materials/state'
import type { MaterialState } from './materials/state'
import { removeWhiteBackground, WhiteRemovalCancelled } from './materials/removeWhite'
import { readImage } from './materials/transparency'
import type { ImageAsset } from './materials/transparency'
import { renderExport } from './materials/export'
import { renderMaterial } from './materials/render'
import { defaultBack } from './materials/backs'
import Showcase from './showcase/Showcase'
import { addArtwork, newBoard } from './showcase/model'
import type { Artwork, Board } from './showcase/model'
import { downloadCanvas, materialArtwork } from './showcase/snapshots'
import Home, { HomeHeader } from './home/Home'
export default function App(){
 const [source,setSource]=useState<ImageAsset|null>(null),[page,setPage]=useState<'home'|'wall'|'edit'|'showcase'>('home'),[selected,setSelected]=useState<MaterialId>('photocard'),[states,setStates]=useState(initialStates),[error,setError]=useState(''),[busy,setBusy]=useState(false),[saving,setSaving]=useState(false),[saved,setSaved]=useState(false),[dragging,setDragging]=useState(false),[backs,setBacks]=useState<Partial<Record<MaterialId,ImageAsset>>>({}),[stripTarget,setStripTarget]=useState<number|'batch'>('batch')
 const [board,setBoard]=useState<Board|null>(null),[artworks,setArtworks]=useState<Artwork[]>([]),[studioBusy,setStudioBusy]=useState(false)
 const [whiteBusy,setWhiteBusy]=useState(false),whiteJob=useRef(0),whiteTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
 const visited=useRef(new Set<MaterialId>()),snapshotCache=useRef(new Map<MaterialId,{state:MaterialState;source:ImageAsset;artworks:Artwork[]}>())
 const input=useRef<HTMLInputElement>(null),stripInput=useRef<HTMLInputElement>(null),customInput=useRef<HTMLInputElement>(null),backInput=useRef<HTMLInputElement>(null),materialInput=useRef<HTMLInputElement>(null),t=templates.find(t=>t.id===selected)!,edit=states[selected],image=source?.image??null
 useEffect(()=>{for(const template of templates.filter(t=>t.duplex&&t.backDefault!=='front'))void defaultBack(template).then(asset=>setBacks(prev=>({...prev,[template.id]:asset})))},[])
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});setSaved(false)},[page,selected])
 useEffect(()=>{if(error)document.querySelector('.error')?.scrollIntoView({behavior:'smooth',block:'center'})},[error])
 useEffect(()=>{whiteJob.current++;if(whiteTimer.current)clearTimeout(whiteTimer.current);whiteTimer.current=null;setWhiteBusy(false);return()=>{whiteJob.current++;if(whiteTimer.current)clearTimeout(whiteTimer.current);whiteTimer.current=null}},[page,selected])
 const report=(e:unknown)=>setError(e instanceof Error?e.message:'这张照片未能读取，请重新选择。')
 const reportRenderError=useCallback((error:unknown)=>{const detail=error instanceof Error?error.message:'未知绘制错误';setError(`物料预览绘制失败，请重新上传图片。原因：${detail}`)},[])
 async function uploadMain(file?:File){if(!file)return;setBusy(true);setError('');try{setSource(await readImage(file));setStates(initialStates());setBoard(null);setArtworks([]);visited.current.clear();snapshotCache.current.clear();setPage('wall')}catch(e){report(e)}finally{setBusy(false);if(input.current)input.current.value=''}}
 async function uploadStrip(files:File[]){if(!files.length)return;setBusy(true);setError('');try{if(files.length>4)throw new Error('一次最多选择四张照片。');const assets=await Promise.all(files.map(readImage));setStates(prev=>{const state=prev.strip,stripImages=[...state.stripImages],stripCrops=[...state.stripCrops];if(stripTarget==='batch'){for(let i=0;i<4;i++){stripImages[i]=assets[i]??null;stripCrops[i]=defaultCrop()}}else{stripImages[stripTarget]=assets[0];stripCrops[stripTarget]=defaultCrop()}return {...prev,strip:{...state,stripImages,stripCrops}}});setSaved(false)}catch(e){report(e)}finally{setBusy(false);if(stripInput.current)stripInput.current.value=''}}
 async function uploadCustom(file?:File){
  if(!file)return;whiteJob.current++;if(whiteTimer.current)clearTimeout(whiteTimer.current);whiteTimer.current=null;setWhiteBusy(false);setBusy(true);setError('')
  try{
   // Yield to React before decoding/analysis so the loading status is visible.
   await new Promise(resolve=>setTimeout(resolve,0))
   const asset=await readImage(file)
   if(!asset.transparent){update({whiteSource:asset,whiteTolerance:32,whiteAppliedTolerance:null});return}
   // Exercise the actual material renderer before committing the new asset.
   // Errors here stay inside this upload transaction and preserve the previous preview.
   const preview=document.createElement('canvas')
   try{renderMaterial(preview,t,asset.image,edit.crop,edit.finish,600,false,{...edit,acrylicShape:'custom',customAsset:asset})}
   catch(cause){const detail=cause instanceof Error?cause.message:'未知绘制错误';throw new Error(`异形预览生成失败：${detail}`,{cause})}
   finally{preview.width=0;preview.height=0}
   update({customAsset:asset,customCrop:defaultCrop(),whiteSource:null,whiteTolerance:32,whiteAppliedTolerance:null})
  }catch(e){console.error('Merch Lab: cutout generation failed',e);report(e)}
  finally{setBusy(false);if(customInput.current)customInput.current.value=''}
 }

 async function processWhite(tolerance=edit.whiteTolerance){
  if(whiteTimer.current)clearTimeout(whiteTimer.current);whiteTimer.current=null
  if(!source||!(selected==='standee'||selected==='charm'&&edit.acrylicShape==='custom'))return
  const original=edit.whiteSource??(!frontAsset(edit,source).transparent?frontAsset(edit,source):null)
  if(!original)return
  const id=selected,job=++whiteJob.current;setWhiteBusy(true);setError('')
  try{
   await new Promise(resolve=>setTimeout(resolve,0))
   const asset=await removeWhiteBackground(original,tolerance,()=>whiteJob.current!==job)
   if(whiteJob.current!==job)return
   const preview=document.createElement('canvas')
   try{renderMaterial(preview,t,asset.image,edit.crop,edit.finish,600,false,{...edit,customAsset:asset})}finally{preview.width=0;preview.height=0}
   setSaved(false);setStates(prev=>({...prev,[id]:{...prev[id],customAsset:asset,whiteSource:original,whiteTolerance:tolerance,whiteAppliedTolerance:tolerance,customCrop:edit.whiteAppliedTolerance===null?defaultCrop():prev[id].customCrop}}))
  }catch(e){if(whiteJob.current===job&&!(e instanceof WhiteRemovalCancelled))report(new Error((e instanceof Error?e.message:'自动去白底失败，请改用透明 PNG 或 WebP 图片。')+' 原图和上次成功结果均已保留。'))}
  finally{if(whiteJob.current===job)setWhiteBusy(false)}
 }
 function changeWhiteTolerance(value:number){
  const reprocess=edit.whiteAppliedTolerance!==null||whiteBusy||!!whiteTimer.current
  whiteJob.current++;if(whiteTimer.current)clearTimeout(whiteTimer.current);whiteTimer.current=null;setWhiteBusy(false);update({whiteTolerance:value})
  if(reprocess)whiteTimer.current=setTimeout(()=>{whiteTimer.current=null;void processWhite(value)},300)
 }

 async function uploadMaterial(file?:File){if(!file)return;setBusy(true);setError('');try{const asset=await readImage(file);update(edit.side==='back'&&t.duplex?{backImage:asset,backCrop:defaultCrop()}:{frontImage:asset,crop:defaultCrop()})}catch(e){report(e)}finally{setBusy(false);if(materialInput.current)materialInput.current.value=''}}
 async function uploadBack(file?:File){if(!file)return;setBusy(true);setError('');try{const backImage=await readImage(file);update({backImage,backCrop:defaultCrop()})}catch(e){report(e)}finally{setBusy(false);if(backInput.current)backInput.current.value=''}}
 function update(change:Partial<MaterialState>){if((selected==='charm'||selected==='standee')&&('whiteSource' in change||'frontImage' in change||'acrylicShape' in change)){whiteJob.current++;if(whiteTimer.current)clearTimeout(whiteTimer.current);whiteTimer.current=null;setWhiteBusy(false)}setSaved(false);setStates(prev=>({...prev,[selected]:{...prev[selected],...change}}))}
 async function save(){if(!source)return;setSaving(true);setError('');try{const customAsset=edit.customAsset??(frontAsset(edit,source).transparent?frontAsset(edit,source):null);if((selected==='standee'||(selected==='charm'&&edit.acrylicShape==='custom'))&&!customAsset)throw new Error('请先上传透明底素材。');const canvas=document.createElement('canvas');await renderExport(canvas,t,source,edit);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('保存失败，请重试。')),'image/png'));const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`Merch-Lab-${t.id}-${t.id==='charm'?edit.acrylicShape+'-':''}${t.finishes.includes(edit.finish)?edit.finish:t.defaultFinish}${t.duplex?'-'+edit.exportMode:''}.png`;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),60000);setSaved(true)}catch(e){report(e)}finally{setSaving(false)}}
 async function openShowcase(){
  if(!source)return;setStudioBusy(true);setError('')
  try{
   await new Promise(resolve=>setTimeout(resolve,0));visited.current.add(selected)
   const catalog:Artwork[]=[]
   for(const id of visited.current){
    const template=templates.find(t=>t.id===id)!,state=states[id],front=frontAsset(state,source)
    if((id==='standee'||id==='charm'&&state.acrylicShape==='custom')&&!state.customAsset&&!front.transparent){if(id===selected)throw new Error('请先上传透明底素材。');continue}
    let entry=snapshotCache.current.get(id)
    if(!entry||entry.state!==state||entry.source!==source){const images=await Promise.all((template.duplex?['front','back'] as const:['front'] as const).map(side=>materialArtwork(template,source,state,side)));entry={state,source,artworks:images};snapshotCache.current.set(id,entry)}
    catalog.push(...entry.artworks)
   }
   const current=catalog.find(a=>a.materialId===selected&&a.side===(t.duplex?edit.side:'front'))!
   if(!current)throw new Error('当前物料尚未准备好，请稍后重试。')
   setArtworks(catalog);setBoard(previous=>{
    if(!previous)return newBoard(current)
    // Refresh material pixels while preserving the user's background, layering and transforms.
    const layers=previous.layers.map(layer=>{const next=layer.artwork.kind==='material'?catalog.find(a=>a.materialId===layer.artwork.materialId&&a.side===layer.artwork.side):undefined;return next?{...layer,artwork:next}:layer})
    const next={...previous,layers}
    return layers.some(l=>l.artwork.id===current.id)?next:addArtwork(next,current)
   });setPage('showcase')
  }catch(e){report(e)}finally{setStudioBusy(false)}
 }
 async function saveTransparent(){
  if(!source)return;setStudioBusy(true);setError('')
  try{
   await new Promise(resolve=>setTimeout(resolve,0))
   const sides=t.duplex&&edit.exportMode==='both'?['front','back'] as const:[t.duplex&&edit.exportMode==='back'?'back':'front'] as const
   const assets=await Promise.all(sides.map(side=>materialArtwork(t,source,edit,side)))
   const canvas=document.createElement('canvas'),gap=assets.length>1?100:0;canvas.width=assets.reduce((sum,a)=>sum+a.canvas.width,0)+gap;canvas.height=Math.max(...assets.map(a=>a.canvas.height))
   const c=canvas.getContext('2d')!;let x=0;for(const art of assets){c.drawImage(art.canvas,x,(canvas.height-art.canvas.height)/2);x+=art.canvas.width+gap}
   await downloadCanvas(canvas,`Merch-Lab-${t.id}-transparent.png`)
  }catch(e){report(e)}finally{setStudioBusy(false)}
 }
 const uploadButton=()=>input.current?.click()
 function selectStripUpload(slot:number|'batch'){setStripTarget(slot);if(stripInput.current){stripInput.current.multiple=slot==='batch';stripInput.current.click()}}
 return <div className={`app-shell ${page==='home'?'home-theme':''}`}>{page==='home'?<HomeHeader/>:<header className="site-header"><button className="brand" onClick={()=>setPage(image?'wall':'home')} aria-label="Merch Lab 首页"><span className="brand-icon"><Sparkles size={19}/></span>Merch Lab<span className="brand-dot">®</span></button><span className="header-note">FOR THE MOMENTS YOU LOVE</span><span className="local-note"><LockKeyhole size={13}/><span>照片仅在本地处理</span></span></header>}
 <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="选择照片" onChange={e=>void uploadMain(e.target.files?.[0])}/>
 <input ref={stripInput} type="file" accept="image/jpeg,image/png,image/webp" multiple={stripTarget==='batch'} className="sr-only" aria-label="选择四格照片" onChange={e=>void uploadStrip(Array.from(e.target.files??[]))}/>
 <input ref={customInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="选择透明底素材" onChange={e=>void uploadCustom(e.target.files?.[0])}/>
 <input ref={backInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="选择背面图片" onChange={e=>void uploadBack(e.target.files?.[0])}/>
 <input ref={materialInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="选择物料图片" onChange={e=>void uploadMaterial(e.target.files?.[0])}/>
 {error&&<div className="error" role="alert">{error}<button aria-label="关闭提示" onClick={()=>setError('')}><X size={16}/></button></div>}
 {page==='showcase'&&board?<Showcase board={board} artworks={artworks} onChange={setBoard} onBack={()=>setPage('edit')}/>:page==='home'?<Home busy={busy} dragging={dragging} onUpload={uploadButton} onFile={file=>void uploadMain(file)} onDragging={setDragging}/> :page==='wall'&&source?<main className="wall"><div className="page-heading"><div><div className="eyebrow">THE COLLECTION / 你的物料预览墙</div><h1>喜欢，有好多种样子<span className="pink-dot">。</span></h1><p>已为你准备好 {templates.length} 种小物件。点开一个，调整成你喜欢的样子。</p></div><button className="secondary" onClick={uploadButton} disabled={busy}>{busy?<LoaderCircle className="spin" size={17}/>:<ImagePlus size={17}/>}更换照片</button></div><div className="material-grid">{templates.map((item,i)=>{const state=states[item.id],front=frontAsset(state,source),customAsset=state.customAsset??(front.transparent?front:null);return <button className="material-item" key={item.id} onClick={()=>{visited.current.add(item.id);setSelected(item.id);setPage('edit')}}><div className="preview-tile"><span className="tile-number">{String(i+1).padStart(2,'0')}</span><MaterialCanvas template={item} image={front.image} crop={state.crop} finish={state.finish} options={{...state,customAsset,side:'front'}} onRenderError={reportRenderError}/><span className="tile-arrow"><ArrowUpRight size={20}/></span>{item.id==='standee'&&!customAsset&&<span className="finish-tag">需要透明底素材</span>}</div><div className="material-label"><h2>{item.name}</h2><span>{item.english}</span></div></button>})}</div><div className="wall-foot"><Sparkles size={15}/>每一种，都值得被收藏。</div></main>:source?<Editor whiteBusy={whiteBusy} onRemoveWhite={()=>void processWhite()} onWhiteTolerance={changeWhiteTolerance} onShowcase={()=>void openShowcase()} onTransparent={()=>void saveTransparent()} studioBusy={studioBusy} template={t} source={source} state={edit} onRenderError={reportRenderError} onImageUpload={()=>materialInput.current?.click()} defaultBack={backs[t.id]??null} onBackUpload={()=>backInput.current?.click()} update={update} onBack={()=>setPage('wall')} onSave={()=>void save()} saving={saving} saved={saved} busy={busy} onStripUpload={selectStripUpload} onCustomUpload={()=>customInput.current?.click()}/>:null}
 {page!=='home'&&<footer><span>Merch Lab · 为喜欢留一份纪念</span><span>MADE WITH A LITTLE LOVE</span></footer>}</div>
}
