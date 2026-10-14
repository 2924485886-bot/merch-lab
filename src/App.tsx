import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, LockKeyhole, Sparkles, ImagePlus, X, LoaderCircle } from 'lucide-react'
import MaterialCanvas from './components/MaterialCanvas'
import Editor from './components/Editor'
import { templates, defaultCrop } from './materials/templates'
import type { MaterialId } from './materials/templates'
import { initialStates, frontAsset } from './materials/state'
import type { MaterialState } from './materials/state'
import { readImage } from './materials/transparency'
import type { ImageAsset } from './materials/transparency'
import { renderExport } from './materials/export'
import { renderMaterial } from './materials/render'
import { defaultBack } from './materials/backs'
import Home from './home/Home'
export default function App(){
 const [source,setSource]=useState<ImageAsset|null>(null),[page,setPage]=useState<'home'|'wall'|'edit'>('home'),[selected,setSelected]=useState<MaterialId>('photocard'),[states,setStates]=useState(initialStates),[error,setError]=useState(''),[busy,setBusy]=useState(false),[saving,setSaving]=useState(false),[saved,setSaved]=useState(false),[dragging,setDragging]=useState(false),[backs,setBacks]=useState<Partial<Record<MaterialId,ImageAsset>>>({}),[stripTarget,setStripTarget]=useState<number|'batch'>('batch')
 const input=useRef<HTMLInputElement>(null),stripInput=useRef<HTMLInputElement>(null),customInput=useRef<HTMLInputElement>(null),backInput=useRef<HTMLInputElement>(null),materialInput=useRef<HTMLInputElement>(null),t=templates.find(t=>t.id===selected)!,edit=states[selected],image=source?.image??null
 useEffect(()=>{for(const template of templates.filter(t=>t.duplex&&t.backDefault!=='front'))void defaultBack(template).then(asset=>setBacks(prev=>({...prev,[template.id]:asset})))},[])
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});setSaved(false)},[page,selected])
 useEffect(()=>{if(error)document.querySelector('.error')?.scrollIntoView({behavior:'smooth',block:'center'})},[error])
 const report=(e:unknown)=>setError(e instanceof Error?e.message:'这张照片未能读取，请重新选择。')
 const reportRenderError=useCallback((error:unknown)=>{const detail=error instanceof Error?error.message:'未知绘制错误';setError(`物料预览绘制失败，请重新上传图片。原因：${detail}`)},[])
 async function uploadMain(file?:File){if(!file)return;setBusy(true);setError('');try{setSource(await readImage(file));setStates(initialStates());setPage('wall')}catch(e){report(e)}finally{setBusy(false);if(input.current)input.current.value=''}}
 async function uploadStrip(files:File[]){if(!files.length)return;setBusy(true);setError('');try{if(files.length>4)throw new Error('一次最多选择四张照片。');const assets=await Promise.all(files.map(readImage));setStates(prev=>{const state=prev.strip,stripImages=[...state.stripImages],stripCrops=[...state.stripCrops];if(stripTarget==='batch'){for(let i=0;i<4;i++){stripImages[i]=assets[i]??null;stripCrops[i]=defaultCrop()}}else{stripImages[stripTarget]=assets[0];stripCrops[stripTarget]=defaultCrop()}return {...prev,strip:{...state,stripImages,stripCrops}}});setSaved(false)}catch(e){report(e)}finally{setBusy(false);if(stripInput.current)stripInput.current.value=''}}
 async function uploadCustom(file?:File){
  if(!file)return;setBusy(true);setError('')
  try{
   // Yield to React before decoding/analysis so the loading status is visible.
   await new Promise(resolve=>setTimeout(resolve,0))
   if(!['image/png','image/webp'].includes(file.type))throw new Error('异形物料需要透明底 PNG 或 WebP。')
   const asset=await readImage(file)
   if(!asset.transparent)throw new Error('这张图片没有检测到透明背景，请上传已去背的 PNG 或 WebP 图片。')
   // Exercise the actual material renderer before committing the new asset.
   // Errors here stay inside this upload transaction and preserve the previous preview.
   const preview=document.createElement('canvas')
   try{renderMaterial(preview,t,asset.image,edit.crop,edit.finish,600,false,{...edit,acrylicShape:'custom',customAsset:asset})}
   catch(cause){const detail=cause instanceof Error?cause.message:'未知绘制错误';throw new Error(`异形预览生成失败：${detail}`,{cause})}
   finally{preview.width=0;preview.height=0}
   update({customAsset:asset,customCrop:defaultCrop()})
  }catch(e){console.error('Merch Lab: cutout generation failed',e);report(e)}
  finally{setBusy(false);if(customInput.current)customInput.current.value=''}
 }

 async function uploadMaterial(file?:File){if(!file)return;setBusy(true);setError('');try{const asset=await readImage(file);update(edit.side==='back'&&t.duplex?{backImage:asset,backCrop:defaultCrop()}:{frontImage:asset,crop:defaultCrop()})}catch(e){report(e)}finally{setBusy(false);if(materialInput.current)materialInput.current.value=''}}
 async function uploadBack(file?:File){if(!file)return;setBusy(true);setError('');try{const backImage=await readImage(file);update({backImage,backCrop:defaultCrop()})}catch(e){report(e)}finally{setBusy(false);if(backInput.current)backInput.current.value=''}}
 function update(change:Partial<MaterialState>){setSaved(false);setStates(prev=>({...prev,[selected]:{...prev[selected],...change}}))}
 async function save(){if(!source)return;setSaving(true);setError('');try{const customAsset=edit.customAsset??(frontAsset(edit,source).transparent?frontAsset(edit,source):null);if((selected==='standee'||(selected==='charm'&&edit.acrylicShape==='custom'))&&!customAsset)throw new Error('请先上传透明底素材。');const canvas=document.createElement('canvas');await renderExport(canvas,t,source,edit);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('保存失败，请重试。')),'image/png'));const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`Merch-Lab-${t.id}-${t.id==='charm'?edit.acrylicShape+'-':''}${t.finishes.includes(edit.finish)?edit.finish:t.defaultFinish}${t.duplex?'-'+edit.exportMode:''}.png`;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),60000);setSaved(true)}catch(e){report(e)}finally{setSaving(false)}}
 const uploadButton=()=>input.current?.click()
 function selectStripUpload(slot:number|'batch'){setStripTarget(slot);if(stripInput.current){stripInput.current.multiple=slot==='batch';stripInput.current.click()}}
 return <div className={`app-shell ${page==='home'?'home-theme':''}`}><header className="site-header"><button className="brand" onClick={()=>setPage(image?'wall':'home')} aria-label="Merch Lab 首页"><span className="brand-icon">{page==='home'?<><i/><i/><i/><i/></>:<Sparkles size={19}/>}</span>{page==='home'?'merch lab':'Merch Lab'}<span className="brand-dot">{page==='home'?'™':'®'}</span></button><span className="header-note">{page==='home'?'MADE FOR YOUR FAVS':'FOR THE MOMENTS YOU LOVE'}</span><span className="local-note"><LockKeyhole size={13}/><span>照片仅在本地处理</span></span></header>
 <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="选择照片" onChange={e=>void uploadMain(e.target.files?.[0])}/>
 <input ref={stripInput} type="file" accept="image/jpeg,image/png,image/webp" multiple={stripTarget==='batch'} className="sr-only" aria-label="选择四格照片" onChange={e=>void uploadStrip(Array.from(e.target.files??[]))}/>
 <input ref={customInput} type="file" accept="image/png,image/webp" className="sr-only" aria-label="选择透明底素材" onChange={e=>void uploadCustom(e.target.files?.[0])}/>
 <input ref={backInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="选择背面图片" onChange={e=>void uploadBack(e.target.files?.[0])}/>
 <input ref={materialInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="选择物料图片" onChange={e=>void uploadMaterial(e.target.files?.[0])}/>
 {error&&<div className="error" role="alert">{error}<button aria-label="关闭提示" onClick={()=>setError('')}><X size={16}/></button></div>}
 {page==='home'?<Home busy={busy} dragging={dragging} onUpload={uploadButton} onFile={file=>void uploadMain(file)} onDragging={setDragging}/> :page==='wall'&&source?<main className="wall"><div className="page-heading"><div><div className="eyebrow">THE COLLECTION / 你的物料预览墙</div><h1>喜欢，有好多种样子<span className="pink-dot">。</span></h1><p>已为你准备好 {templates.length} 种小物件。点开一个，调整成你喜欢的样子。</p></div><button className="secondary" onClick={uploadButton} disabled={busy}>{busy?<LoaderCircle className="spin" size={17}/>:<ImagePlus size={17}/>}更换照片</button></div><div className="material-grid">{templates.map((item,i)=>{const state=states[item.id],front=frontAsset(state,source),customAsset=state.customAsset??(front.transparent?front:null);return <button className="material-item" key={item.id} onClick={()=>{setSelected(item.id);setPage('edit')}}><div className="preview-tile"><span className="tile-number">{String(i+1).padStart(2,'0')}</span><MaterialCanvas template={item} image={front.image} crop={state.crop} finish={state.finish} options={{...state,customAsset,side:'front'}} onRenderError={reportRenderError}/><span className="tile-arrow"><ArrowUpRight size={20}/></span>{item.id==='standee'&&!customAsset&&<span className="finish-tag">需要透明底素材</span>}</div><div className="material-label"><h2>{item.name}</h2><span>{item.english}</span></div></button>})}</div><div className="wall-foot"><Sparkles size={15}/>每一种，都值得被收藏。</div></main>:source?<Editor template={t} source={source} state={edit} onRenderError={reportRenderError} onImageUpload={()=>materialInput.current?.click()} defaultBack={backs[t.id]??null} onBackUpload={()=>backInput.current?.click()} update={update} onBack={()=>setPage('wall')} onSave={()=>void save()} saving={saving} saved={saved} busy={busy} onStripUpload={selectStripUpload} onCustomUpload={()=>customInput.current?.click()}/>:null}
 <footer><span>{page==='home'?'Merch Lab / 应援物料实验室':'Merch Lab · 为喜欢留一份纪念'}</span><span>{page==='home'?'YOUR PHOTO. YOUR MERCH.':'MADE WITH A LITTLE LOVE'}</span></footer></div>
}
