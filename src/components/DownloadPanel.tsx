import { useEffect, useRef } from 'react'
import { Download, LoaderCircle, X } from 'lucide-react'
import type { ExportMode } from '../materials/state'
interface Props {duplex:boolean;exportMode:ExportMode;onMode:(mode:ExportMode)=>void;busy:boolean;saved:boolean;onSave:()=>void;onTransparent:()=>void;onClose:()=>void}
export default function DownloadPanel({duplex,exportMode,onMode,busy,saved,onSave,onTransparent,onClose}:Props){
 const panel=useRef<HTMLDivElement>(null)
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;document.body.style.overflow='hidden';panel.current?.focus();return()=>{document.body.style.overflow=overflow;previous?.focus()}},[])
 return <div className="comparison-overlay" onClick={e=>{if(e.target===e.currentTarget&&!busy)onClose()}}><div ref={panel} className="comparison-panel download-panel" role="dialog" aria-modal="true" aria-label="直接下载物料" tabIndex={-1} onKeyDown={e=>{
 if(e.key==='Escape'&&!busy)onClose()
 if(e.key==='Tab'){const buttons=Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]),first=buttons[0],last=buttons[buttons.length-1];if(!first){e.preventDefault();return}if(e.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){e.preventDefault();last.focus()}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===panel.current)){e.preventDefault();first.focus()}}
 }}><div className="comparison-heading"><h2>直接下载物料</h2><button className="icon-button" aria-label="关闭下载面板" disabled={busy} onClick={onClose}><X size={20}/></button></div>
 {duplex&&<div className="export-control"><div className="control-label">导出范围</div><div className="export-options" role="group" aria-label="导出范围">{([['both','双面并排'],['front','仅正面'],['back','仅背面']] as [ExportMode,string][]).map(([value,label])=><button key={value} disabled={busy} aria-pressed={exportMode===value} className={exportMode===value?'selected':''} onClick={()=>onMode(value)}>{label}</button>)}</div></div>}
 <div className="download-choices"><button className="secondary" disabled={busy} onClick={onSave}><Download size={18}/><span><strong>带背景 PNG</strong><small>单件物料效果图，可直接分享。</small></span></button><button className="secondary" disabled={busy} onClick={onTransparent}><Download size={18}/><span><strong>透明底 PNG</strong><small>用于后续拼图和排版。</small></span></button></div><p className="save-note" role="status">{busy?<><LoaderCircle className="spin" size={15}/>正在生成 PNG…</>:saved?'效果图已生成，请在浏览器下载中查看。':'保留当前照片、构图、文字与物料质感。'}</p></div></div>
}
