import { useEffect, useRef } from 'react'
import { X, RotateCcw, Move } from 'lucide-react'
import MaterialCanvas from './MaterialCanvas'
import { finishLabels } from '../materials/templates'
import type { Crop, Finish, MaterialTemplate } from '../materials/templates'
import type { Angle, RenderOptions } from '../materials/state'
export const finishName=(finish:Finish,badge:boolean)=>badge&&finish==='glossy'?'亮面':badge&&finish==='matte'?'哑面':finishLabels[finish].name
interface Props { template:MaterialTemplate; image:HTMLImageElement; crop:Crop; options:RenderOptions; pair:[Finish,Finish]; onPair:(pair:[Finish,Finish])=>void; onAngle:(angle:Angle)=>void; onClose:()=>void }
export default function Comparison({template,image,crop,options,pair,onPair,onAngle,onClose}:Props){
 const ref=useRef<HTMLDivElement>(null)
 useEffect(()=>{const prior=document.activeElement as HTMLElement|null,old=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.focus();return()=>{document.body.style.overflow=old;prior?.focus()}},[])
 return <div className="comparison-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className="comparison-panel" ref={ref} role="dialog" aria-modal="true" aria-label="工艺对比" tabIndex={-1} onKeyDown={e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const els=Array.from(ref.current?.querySelectorAll<HTMLElement>('button,select')??[]);const first=els[0],last=els[els.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}}}>
 <div className="comparison-heading"><div><div className="eyebrow">SIDE BY SIDE</div><h2>对比看看</h2></div><button className="icon-button" onClick={onClose} aria-label="关闭工艺对比"><X size={20}/></button></div><p className="control-intro">同一张照片、相同构图与角度。拖动任一预览，观察两种反光。</p>
 <div className="comparison-grid">{pair.map((finish,i)=><div key={i} className="comparison-cell"><label htmlFor={`compare-${i}`}>{i===0?'左侧工艺':'右侧工艺'}</label><select id={`compare-${i}`} value={finish} onChange={e=>{const next:[Finish,Finish]=[...pair];next[i]=e.target.value as Finish;onPair(next)}}>{template.finishes.map(f=><option key={f} value={f}>{finishName(f,template.id==='badge')}</option>)}</select><div className="comparison-image"><MaterialCanvas template={template} image={image} crop={crop} finish={finish} options={options} interactive mode="angle" onAngle={onAngle}/></div></div>)}</div>
 <div className="comparison-foot"><span><Move size={14}/> 拖动任一侧 · 同步改变角度</span><button className="reset" onClick={()=>onAngle({x:0,y:0})}><RotateCcw size={14}/>角度归零</button></div><p className="material-limit">材质为屏幕近似。实际印刷反光还取决于光源、膜材与实体样品。</p>
 </div></div>
}
