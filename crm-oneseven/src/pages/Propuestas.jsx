import { useState } from 'react'
import Layout from '../components/Layout'
import { useClientes } from '../hooks/useData'
import { formatEur, formatDate } from '../lib/constants'

const SERVICIOS_LISTA = [
  { id: 'web', label: 'Desarrollo Web', desc: 'Diseño y desarrollo de sitio web profesional' },
  { id: 'auto', label: 'Automatizaciones', desc: 'Automatización de procesos con n8n y Make' },
  { id: 'ia', label: 'Agente IA', desc: 'Agente de inteligencia artificial personalizado' },
  { id: 'consultoria', label: 'Consultoría IA', desc: 'Asesoramiento estratégico en IA para tu empresa' },
  { id: 'retainer', label: 'Retainer Mensual', desc: 'Mantenimiento y soporte mensual continuo' },
  { id: 'seo', label: 'SEO / Marketing Digital', desc: 'Posicionamiento y visibilidad online' },
]

function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h9M5 3V2h3v1M3 3l.5 8h6l.5-8"/></svg> }
function DocIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 2z"/><path d="M9 2v4h4"/></svg> }

export default function Propuestas() {
  const { clientes } = useClientes()
  const [step, setStep] = useState(1)
  const [generando, setGenerando] = useState(false)
  const [form, setForm] = useState({
    cliente_id: '', titulo: 'Propuesta de servicios de automatización e IA',
    fecha: new Date().toISOString().split('T')[0], validez: '30',
    intro: 'Nos complace presentarte esta propuesta personalizada para ayudarte a optimizar tus procesos y potenciar tu negocio con inteligencia artificial.',
    items: [{ descripcion: '', detalle: '', precio: '' }],
    condiciones: 'El 50% del importe se abona antes de iniciar el proyecto. El 50% restante al finalizar la entrega.\n\nEl plazo de ejecución se acuerda una vez confirmada la propuesta.\n\nLos precios indicados no incluyen IVA.',
    responsable: 'pablo',
  })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const cliente = clientes.find(c => c.id === form.cliente_id)
  const addItem = () => set('items', [...form.items, { descripcion: '', detalle: '', precio: '' }])
  const removeItem = (i) => set('items', form.items.filter((_, idx) => idx !== i))
  const updateItem = (i, k, v) => set('items', form.items.map((item, idx) => idx === i ? { ...item, [k]: v } : item))
  const total = form.items.reduce((s, it) => s + (parseFloat(it.precio) || 0), 0)
  const respNombre = form.responsable === 'pablo' ? 'Pablo Puado' : 'Alberto'
  const respEmail = form.responsable === 'pablo' ? 'pablo@onesevenia.com' : 'alberto@onesevenia.com'

  const generarHTML = () => `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Propuesta - ${cliente?.nombre||'Cliente'}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;background:#fff;font-size:14px;line-height:1.6}.page{max-width:794px;margin:0 auto}.header{background:linear-gradient(135deg,#0a0a1a,#1a1a3e);color:white;padding:48px 56px 40px}.ht{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}.li img{height:40px;filter:brightness(0)invert(1)}.li .sub{font-size:11px;color:rgba(255,255,255,.4);margin-top:6px;letter-spacing:.08em}.hm{text-align:right;font-size:12px;color:rgba(255,255,255,.5)}.htitle{font-size:26px;font-weight:300;margin-bottom:8px}.hsub{font-size:14px;color:rgba(255,255,255,.6)}.ab{height:4px;background:linear-gradient(90deg,#6366f1,#a855f7,#06b6d4)}.body{padding:48px 56px}.section{margin-bottom:32px}.st{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#6366f1;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #e8e8f0}.ig{display:grid;grid-template-columns:1fr 1fr;gap:20px}.ib{background:#f8f8ff;border-radius:8px;padding:18px;border-left:3px solid #6366f1}.ib .lb{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-bottom:6px}.ib .vl{font-size:15px;font-weight:600;color:#1a1a2e}.ib .sb{font-size:12px;color:#666;margin-top:3px}.intro{font-size:14px;color:#444;line-height:1.8;background:#fafafa;padding:22px;border-radius:8px;border:1px solid #eee}table{width:100%;border-collapse:separate;border-spacing:0}th{background:#1a1a2e;color:white;padding:12px 16px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}th:first-child{border-radius:8px 0 0 0}th:last-child{border-radius:0 8px 0 0;text-align:right}td{padding:14px 16px;border-bottom:1px solid #f0f0f8;vertical-align:top}tr:last-child td{border-bottom:none}tr:nth-child(even) td{background:#fafaff}.in{font-weight:600;color:#1a1a2e;margin-bottom:3px}.id{font-size:12px;color:#666}.ip{text-align:right;font-weight:700;color:#1a1a2e;font-size:15px;white-space:nowrap}.tr{background:linear-gradient(135deg,#6366f1,#8b5cf6)}.tr td{padding:16px;font-weight:700;font-size:16px;border:none!important;color:white}.vb{display:inline-flex;align-items:center;gap:8px;background:#fff8e7;border:1px solid #fbbf24;border-radius:20px;padding:6px 14px;font-size:12px;color:#92400e;margin-top:12px}.cond{font-size:13px;color:#555;line-height:1.8;white-space:pre-line}.footer{background:#0a0a1a;color:rgba(255,255,255,.5);padding:24px 56px;display:flex;justify-content:space-between;align-items:center;font-size:12px}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}@page{margin:0;size:A4}}</style></head><body><div class="page"><div class="header"><div class="ht"><div class="li"><img src="https://onesevenia.com/lovable-uploads/20e6c263-0631-43ca-acf0-a255777708ba.png" alt="ONESEVEN IA" onerror="this.style.display='none'"><div class="sub">AUTOMATIZACIÓN E INTELIGENCIA ARTIFICIAL</div></div><div class="hm"><div>REF: OS-${new Date().getFullYear()}-${String(Math.floor(Math.random()*900)+100)}</div><div>${formatDate(form.fecha)}</div></div></div><div class="htitle">${form.titulo}</div><div class="hsub">Para ${cliente?.nombre||''}${cliente?.empresa?' · '+cliente.empresa:''}</div></div><div class="ab"></div><div class="body"><div class="section"><div class="st">Información</div><div class="ig"><div class="ib"><div class="lb">Destinatario</div><div class="vl">${cliente?.nombre||'—'}</div><div class="sb">${cliente?.empresa||''}</div>${cliente?.email?'<div class="sb">'+cliente.email+'</div>':''}</div><div class="ib"><div class="lb">Preparada por</div><div class="vl">${respNombre}</div><div class="sb">ONESEVEN IA</div><div class="sb">${respEmail}</div></div></div></div>${form.intro?'<div class="section"><div class="st">Presentación</div><div class="intro">'+form.intro+'</div></div>':''}<div class="section"><div class="st">Servicios incluidos</div><table><thead><tr><th style="width:70%">Servicio</th><th>Importe</th></tr></thead><tbody>${form.items.filter(it=>it.descripcion).map(it=>'<tr><td><div class="in">'+it.descripcion+'</div>'+(it.detalle?'<div class="id">'+it.detalle+'</div>':'')+'</td><td class="ip">'+(it.precio?formatEur(parseFloat(it.precio)):'—')+'</td></tr>').join('')}<tr class="tr"><td>Total propuesta</td><td style="text-align:right;font-size:20px">${formatEur(total)}</td></tr></tbody></table>${form.validez?'<div class="vb">⏳ Válida '+form.validez+' días</div>':''}</div>${form.condiciones?'<div class="section"><div class="st">Condiciones</div><div class="cond">'+form.condiciones+'</div></div>':''}</div><div class="footer"><div><div style="color:white;font-weight:600;margin-bottom:4px">ONESEVEN IA</div><div>onesevenia.com</div></div><div style="text-align:right"><div style="color:white;font-weight:600;margin-bottom:4px">${respNombre}</div><div>${respEmail}</div></div></div></div></body></html>`

  const handleGenerar = async () => {
    setGenerando(true)
    await new Promise(r => setTimeout(r, 600))
    const win = window.open('', '_blank')
    win.document.write(generarHTML())
    win.document.close()
    setTimeout(() => { win.print() }, 600)
    setStep(3)
    setGenerando(false)
  }

  return (
    <Layout title="Propuestas" subtitle="Genera propuestas PDF profesionales en segundos">
      <div style={{ maxWidth: 760 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
          {[{ n: 1, label: 'Datos' }, { n: 2, label: 'Preview' }, { n: 3, label: 'PDF listo' }].map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, cursor: step > s.n ? 'pointer' : 'default', background: step === s.n ? 'var(--accent-dim)' : 'transparent' }} onClick={() => step > s.n && setStep(s.n)}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: step >= s.n ? 'var(--accent)' : 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: step >= s.n ? '#fff' : 'var(--text3)' }}>{step > s.n ? '✓' : s.n}</div>
                <span style={{ fontSize: 13, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? 'var(--accent2)' : step > s.n ? 'var(--text1)' : 'var(--text3)' }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ width: 32, height: 1, background: 'var(--border2)' }} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Cliente y propuesta</div>
              <div className="form-group"><label className="form-label">Cliente *</label><select className="form-select" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}><option value="">Seleccionar cliente...</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.empresa?' · '+c.empresa:''}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Título</label><input className="form-input" value={form.titulo} onChange={e => set('titulo', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
                <div className="form-group"><label className="form-label">Fecha</label><input className="form-input" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Validez (días)</label><input className="form-input" type="number" value={form.validez} onChange={e => set('validez', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Responsable</label><select className="form-select" value={form.responsable} onChange={e => set('responsable', e.target.value)}><option value="pablo">Pablo Puado</option><option value="alberto">Alberto</option></select></div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Presentación</label><textarea className="form-textarea" value={form.intro} onChange={e => set('intro', e.target.value)} style={{ minHeight: 72 }} /></div>
            </div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Servicios y precios</div>
                <button className="btn btn-ghost btn-sm" onClick={addItem}>+ Añadir</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {SERVICIOS_LISTA.map(s => <button key={s.id} onClick={() => { const ei = form.items.findIndex(it => !it.descripcion); ei >= 0 ? (updateItem(ei,'descripcion',s.label),updateItem(ei,'detalle',s.desc)) : set('items',[...form.items,{descripcion:s.label,detalle:s.desc,precio:''}]) }} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border2)', background: 'none', color: 'var(--text3)', cursor: 'pointer' }}>+ {s.label}</button>)}
              </div>
              {form.items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 32px', gap: '0 8px', marginBottom: 7, alignItems: 'start' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>{i===0&&<label className="form-label">Servicio</label>}<input className="form-input" value={item.descripcion} onChange={e => updateItem(i,'descripcion',e.target.value)} placeholder="Nombre" /></div>
                  <div className="form-group" style={{ marginBottom: 0 }}>{i===0&&<label className="form-label">Detalle</label>}<input className="form-input" value={item.detalle} onChange={e => updateItem(i,'detalle',e.target.value)} placeholder="Opcional" /></div>
                  <div className="form-group" style={{ marginBottom: 0 }}>{i===0&&<label className="form-label">Precio (€)</label>}<input className="form-input" type="number" value={item.precio} onChange={e => updateItem(i,'precio',e.target.value)} placeholder="0" /></div>
                  <div style={{ paddingTop: i===0?22:0 }}><button className="btn-icon" style={{ width: 32, height: 36, color: 'var(--red)' }} onClick={() => form.items.length>1&&removeItem(i)}><TrashIcon /></button></div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border)', marginTop: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text3)', marginRight: 12 }}>Total:</span>
                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent2)' }}>{formatEur(total)}</span>
              </div>
            </div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Condiciones de pago</div>
              <textarea className="form-textarea" value={form.condiciones} onChange={e => set('condiciones', e.target.value)} style={{ minHeight: 90 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" style={{ fontSize: 14, padding: '10px 24px' }} onClick={() => form.cliente_id ? setStep(2) : alert('Selecciona un cliente primero')}>Previsualizar →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
              <div style={{ background: '#0a0a1a', padding: '24px 28px 20px', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', letterSpacing: '.08em', marginBottom: 6 }}>ONESEVEN IA</div><div style={{ fontSize: 18, fontWeight: 300 }}>{form.titulo}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>Para {cliente?.nombre||'—'}{cliente?.empresa?' · '+cliente.empresa:''}</div></div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,.5)' }}><div>{formatDate(form.fecha)}</div><div style={{ marginTop: 4 }}>Válida {form.validez} días</div></div>
                </div>
                <div style={{ height: 3, background: 'linear-gradient(90deg,#6366f1,#a855f7,#06b6d4)', borderRadius: 2 }} />
              </div>
              <div style={{ padding: '20px 24px' }}>
                {form.intro&&<div style={{ marginBottom: 16, padding: 14, background: 'var(--bg3)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text1)', lineHeight: 1.7 }}>{form.intro}</div>}
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>Servicios incluidos</div>
                {form.items.filter(it=>it.descripcion).map((it,i)=>(
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text0)' }}>{it.descripcion}</div>{it.detalle&&<div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{it.detalle}</div>}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', marginLeft: 16 }}>{it.precio?formatEur(parseFloat(it.precio)):'—'}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--accent)', borderRadius: 'var(--radius)', marginTop: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 13 }}>Total propuesta</span>
                  <span style={{ color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)' }}>{formatEur(total)}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Editar</button>
              <button className="btn btn-primary" style={{ fontSize: 14, padding: '10px 24px', gap: 8 }} onClick={handleGenerar} disabled={generando}><DocIcon />{generando?'Generando...':'Generar PDF'}</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card" style={{ textAlign: 'center', padding: '44px 28px' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 26, color: 'var(--green)' }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text0)', marginBottom: 8 }}>Propuesta generada</div>
            <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 28, lineHeight: 1.7 }}>Se ha abierto la propuesta en una ventana nueva.<br/>En el diálogo de impresión selecciona <b style={{color:'var(--text0)'}}>Guardar como PDF</b>.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={handleGenerar}><DocIcon /> Volver a abrir PDF</button>
              <button className="btn btn-primary" onClick={() => { setStep(1); set('cliente_id',''); set('items',[{descripcion:'',detalle:'',precio:''}]) }}>+ Nueva propuesta</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
