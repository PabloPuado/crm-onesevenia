import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useClientes } from '../hooks/useData'
import { usePresupuestos } from '../hooks/useData'
import { formatEur, formatDate } from '../lib/constants'

function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg> }
function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h9M5 3V2h3v1M3 3l.5 8h6l.5-8"/></svg> }
function EditIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2l2 2-7 7H2V9L9 2z"/></svg> }
function DownloadIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 1v8M4 6l3 3 3-3"/><path d="M1 10v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1"/></svg> }
function WAIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> }
function MailIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 3l6 5 6-5"/><rect x="1" y="2" width="12" height="10" rx="1"/></svg> }
function CloseIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg> }
function CopyIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="8" height="8" rx="1"/><path d="M1 9V2a1 1 0 0 1 1-1h7"/></svg> }

const ESTADO_COLORS = {
  borrador: { bg: 'var(--bg4)', color: 'var(--text3)', label: 'Borrador' },
  enviado: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Enviado' },
  aceptado: { bg: 'rgba(16,185,129,0.15)', color: 'var(--green)', label: 'Aceptado' },
  rechazado: { bg: 'rgba(239,68,68,0.15)', color: 'var(--red)', label: 'Rechazado' },
  caducado: { bg: 'rgba(245,158,11,0.15)', color: 'var(--amber)', label: 'Caducado' },
  facturado: { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6', label: 'Facturado' },
}

function calcTotales({ items, descuento, iva }) {
  const subtotal = (items || []).reduce((s, it) => s + ((parseFloat(it.cantidad) || 1) * (parseFloat(it.precio_unit) || 0)), 0)
  const desc = subtotal * ((parseFloat(descuento) || 0) / 100)
  const base = subtotal - desc
  const ivaAmt = base * ((parseFloat(iva) || 21) / 100)
  const total = base + ivaAmt
  return { subtotal, desc, base, ivaAmt, total }
}

function generarHTMLPresupuesto({ p, cliente }) {
  const respNombre = p.responsable === 'pablo' ? 'Pablo Puado' : 'Alberto'
  const respEmail = p.responsable === 'pablo' ? 'pablo@onesevenia.com' : 'alberto@onesevenia.com'
  const items = (Array.isArray(p.items) ? p.items : []).filter(it => it.descripcion)
  const { subtotal, desc, base, ivaAmt, total } = calcTotales({ items, descuento: p.descuento, iva: p.iva })
  const ref = `PRES-${new Date(p.fecha || p.created_at).getFullYear()}-${p.id?.slice(-3).toUpperCase() || '000'}`

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Presupuesto ${ref}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;background:#fff;font-size:14px;line-height:1.6}.topbar{position:fixed;top:0;left:0;right:0;background:#1a1a2e;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;z-index:100;gap:8px}.back-btn{background:rgba(255,255,255,.1);color:white;border:none;padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer}.save-btn{background:#6366f1;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer}.topbar-title{color:rgba(255,255,255,.7);font-size:12px;flex:1;text-align:center}.wrapper{padding-top:52px}.page{max-width:794px;margin:0 auto}.header{background:linear-gradient(135deg,#0a0a1a,#1a1a3e);color:white;padding:40px 56px 32px}.ht{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px}.li img{height:36px;filter:brightness(0)invert(1)}.hm{text-align:right;font-size:12px;color:rgba(255,255,255,.5)}.ref-badge{display:inline-block;background:rgba(99,102,241,.3);color:#a5b4fc;padding:3px 10px;border-radius:20px;font-size:11px;margin-bottom:6px}.htitle{font-size:22px;font-weight:300;margin-bottom:4px}.hsub{font-size:13px;color:rgba(255,255,255,.6)}.ab{height:4px;background:linear-gradient(90deg,#6366f1,#a855f7,#06b6d4)}.body{padding:36px 56px}.section{margin-bottom:24px}.st{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#6366f1;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #e8e8f0}.ig{display:grid;grid-template-columns:1fr 1fr;gap:14px}.ib{background:#f8f8ff;border-radius:8px;padding:14px;border-left:3px solid #6366f1}.ib .lb{font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-bottom:3px}.ib .vl{font-size:13px;font-weight:600;color:#1a1a2e}.ib .sb{font-size:11px;color:#666;margin-top:2px}table{width:100%;border-collapse:separate;border-spacing:0}th{background:#1a1a2e;color:white;padding:9px 12px;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}th:first-child{border-radius:6px 0 0 0}th:last-child{border-radius:0 6px 0 0;text-align:right}td{padding:10px 12px;border-bottom:1px solid #f0f0f8;vertical-align:top;font-size:13px}tr:nth-child(even) td{background:#fafaff}.in{font-weight:600;color:#1a1a2e}.id{font-size:11px;color:#888}.ip{text-align:right;font-weight:600;color:#1a1a2e}.totals{margin-top:8px;margin-left:auto;width:280px}.tr-row{display:flex;justify-content:space-between;padding:6px 12px;font-size:13px}.tr-row.sub{color:#555}.tr-row.desc{color:#ef4444}.tr-row.iva{color:#555}.tr-row.total{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-radius:8px;padding:12px;font-weight:700;font-size:15px;margin-top:4px}.cond{font-size:12px;color:#555;line-height:1.8;white-space:pre-line;background:#fafafa;padding:14px;border-radius:6px;border:1px solid #eee}.footer{background:#0a0a1a;color:rgba(255,255,255,.5);padding:18px 56px;display:flex;justify-content:space-between;align-items:center;font-size:11px}@media print{.topbar{display:none}.wrapper{padding-top:0}body{print-color-adjust:exact;-webkit-print-color-adjust:exact}@page{margin:0;size:A4}}</style></head><body><div class="topbar"><button class="back-btn" onclick="window.close()">&#8592; Cerrar</button><span class="topbar-title">${ref}</span><button class="save-btn" onclick="window.print()">Guardar PDF</button></div><div class="wrapper"><div class="page"><div class="header"><div class="ht"><div class="li"><img src="https://onesevenia.com/lovable-uploads/20e6c263-0631-43ca-acf0-a255777708ba.png" alt="ONESEVEN IA" onerror="this.style.display='none'"></div><div class="hm"><div class="ref-badge">${ref}</div><div style="margin-top:4px">${formatDate(p.fecha)}</div>${p.validez ? '<div style="margin-top:2px">Valido ' + p.validez + ' dias</div>' : ''}</div></div><div class="htitle">${p.titulo}</div><div class="hsub">Para ${cliente?.nombre || ''}${cliente?.empresa ? ' · ' + cliente.empresa : ''}</div></div><div class="ab"></div><div class="body"><div class="section"><div class="st">Datos del presupuesto</div><div class="ig"><div class="ib"><div class="lb">Cliente</div><div class="vl">${cliente?.nombre || '-'}</div>${cliente?.empresa ? '<div class="sb">' + cliente.empresa + '</div>' : ''}${cliente?.email ? '<div class="sb">' + cliente.email + '</div>' : ''}</div><div class="ib"><div class="lb">Elaborado por</div><div class="vl">${respNombre}</div><div class="sb">ONESEVEN IA</div><div class="sb">${respEmail}</div></div></div></div>${p.intro ? '<div class="section"><p style="font-size:13px;color:#555;line-height:1.8;background:#fafafa;padding:14px;border-radius:6px;border:1px solid #eee">' + p.intro + '</p></div>' : ''}<div class="section"><div class="st">Detalle de servicios</div><table><thead><tr><th>Descripcion</th><th style="text-align:center;width:60px">Uds</th><th style="text-align:right;width:110px">Precio/ud</th><th style="text-align:right;width:110px">Importe</th></tr></thead><tbody>${items.map((it, i) => { const cant = parseFloat(it.cantidad) || 1; const pu = parseFloat(it.precio_unit) || 0; return '<tr><td><div class="in">' + it.descripcion + '</div>' + (it.detalle ? '<div class="id">' + it.detalle + '</div>' : '') + '</td><td style="text-align:center">' + cant + '</td><td class="ip">' + formatEur(pu) + '</td><td class="ip">' + formatEur(cant * pu) + '</td></tr>' }).join('')}</tbody></table><div class="totals">${parseFloat(p.descuento) > 0 ? '<div class="tr-row sub"><span>Subtotal</span><span>' + formatEur(subtotal) + '</span></div><div class="tr-row desc"><span>Descuento (' + p.descuento + '%)</span><span>-' + formatEur(desc) + '</span></div>' : ''}<div class="tr-row sub"><span>Base imponible</span><span>${formatEur(base)}</span></div><div class="tr-row iva"><span>IVA (${p.iva || 21}%)</span><span>${formatEur(ivaAmt)}</span></div><div class="tr-row total"><span>TOTAL</span><span>${formatEur(total)}</span></div></div></div>${p.condiciones ? '<div class="section"><div class="st">Condiciones</div><div class="cond">' + p.condiciones + '</div></div>' : ''}</div><div class="footer"><div><div style="color:white;font-weight:600;margin-bottom:2px">ONESEVEN IA</div><div>onesevenia.com</div></div><div style="text-align:right"><div style="color:white;font-weight:600;margin-bottom:2px">${respNombre}</div><div>${respEmail}</div></div></div></div></div></body></html>`
}

function abrirPresupuesto({ p, cliente }) {
  const win = window.open('', '_blank')
  win.document.write(generarHTMLPresupuesto({ p, cliente }))
  win.document.close()
}

// ─── Formulario ───────────────────────────────────────────────────────────────
function FormularioPresupuesto({ presupuesto, clientes, onSave, onCancel }) {
  const isEdit = !!presupuesto?.id
  const defaultItems = [{ descripcion: '', detalle: '', cantidad: '1', precio_unit: '' }]
  const [form, setForm] = useState({
    cliente_id: '', titulo: 'Presupuesto de servicios',
    fecha: new Date().toISOString().split('T')[0], validez: '15',
    intro: '', items: defaultItems,
    condiciones: 'El presupuesto tiene una validez de 15 dias naturales desde su emision.\n\nEl 50% del importe se abona al inicio del proyecto y el 50% restante a la entrega.\n\nPrecios sin IVA.',
    responsable: 'pablo', estado: 'borrador',
    descuento: '0', iva: '21',
    ...presupuesto,
    items: presupuesto?.items?.length ? presupuesto.items : defaultItems,
  })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const addItem = () => set('items', [...form.items, { descripcion: '', detalle: '', cantidad: '1', precio_unit: '' }])
  const removeItem = (i) => set('items', form.items.filter((_, idx) => idx !== i))
  const updateItem = (i, k, v) => set('items', form.items.map((item, idx) => idx === i ? { ...item, [k]: v } : item))
  const { subtotal, desc, base, ivaAmt, total } = calcTotales({ items: form.items, descuento: form.descuento, iva: form.iva })

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
          {isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}
        </div>
        <div className="form-group">
          <label className="form-label">Cliente *</label>
          <select className="form-select" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}>
            <option value="">Seleccionar cliente...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` · ${c.empresa}` : ''}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Titulo del presupuesto</label>
          <input className="form-input" value={form.titulo} onChange={e => set('titulo', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '0 12px' }}>
          <div className="form-group"><label className="form-label">Fecha</label><input className="form-input" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Validez (dias)</label><input className="form-input" type="number" value={form.validez} onChange={e => set('validez', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">IVA (%)</label><input className="form-input" type="number" value={form.iva} onChange={e => set('iva', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Descuento (%)</label><input className="form-input" type="number" value={form.descuento} onChange={e => set('descuento', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Estado</label><select className="form-select" value={form.estado} onChange={e => set('estado', e.target.value)}>{Object.entries(ESTADO_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <div className="form-group"><label className="form-label">Responsable</label><select className="form-select" value={form.responsable} onChange={e => set('responsable', e.target.value)}><option value="pablo">Pablo Puado</option><option value="alberto">Alberto</option></select></div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Presentacion / Descripcion del proyecto</label>
          <textarea className="form-textarea" value={form.intro} onChange={e => set('intro', e.target.value)} placeholder="Describe brevemente el alcance del proyecto..." style={{ minHeight: 70 }} />
        </div>
      </div>

      {/* Items */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Lineas del presupuesto</div>
          <button className="btn btn-ghost btn-sm" onClick={addItem}>+ Anadir linea</button>
        </div>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 80px 120px 32px', gap: '0 8px', marginBottom: 6 }}>
          <label className="form-label">Descripcion</label>
          <label className="form-label">Detalle</label>
          <label className="form-label">Uds</label>
          <label className="form-label">Precio/ud (EUR)</label>
          <div />
        </div>
        {form.items.map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 80px 120px 32px', gap: '0 8px', marginBottom: 7, alignItems: 'center' }}>
            <input className="form-input" value={item.descripcion} onChange={e => updateItem(i, 'descripcion', e.target.value)} placeholder="Nombre del servicio" />
            <input className="form-input" value={item.detalle || ''} onChange={e => updateItem(i, 'detalle', e.target.value)} placeholder="Descripcion adicional" />
            <input className="form-input" type="number" value={item.cantidad || '1'} onChange={e => updateItem(i, 'cantidad', e.target.value)} min="1" />
            <input className="form-input" type="number" value={item.precio_unit || ''} onChange={e => updateItem(i, 'precio_unit', e.target.value)} placeholder="0" />
            <button className="btn-icon" style={{ width: 32, height: 36, color: 'var(--red)' }} onClick={() => form.items.length > 1 && removeItem(i)}><TrashIcon /></button>
          </div>
        ))}

        {/* Totales */}
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{ maxWidth: 300, marginLeft: 'auto' }}>
            {[
              { label: 'Subtotal', value: subtotal, show: true },
              { label: `Descuento (${form.descuento}%)`, value: -desc, show: parseFloat(form.descuento) > 0, color: 'var(--red)' },
              { label: 'Base imponible', value: base, show: parseFloat(form.descuento) > 0 },
              { label: `IVA (${form.iva}%)`, value: ivaAmt, show: true, color: 'var(--text3)' },
            ].filter(r => r.show).map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: r.color || 'var(--text2)' }}>
                <span>{r.label}</span><span style={{ fontFamily: 'var(--mono)' }}>{r.value < 0 ? '-' : ''}{formatEur(Math.abs(r.value))}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--accent)', borderRadius: 'var(--radius)', marginTop: 6 }}>
              <span style={{ color: '#fff', fontWeight: 600 }}>TOTAL (con IVA)</span>
              <span style={{ color: '#fff', fontWeight: 700, fontFamily: 'var(--mono)', fontSize: 16 }}>{formatEur(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Condiciones */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Condiciones y terminos</div>
        <textarea className="form-textarea" value={form.condiciones} onChange={e => set('condiciones', e.target.value)} style={{ minHeight: 90 }} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" style={{ padding: '10px 24px' }} onClick={() => form.cliente_id ? onSave(form) : alert('Selecciona un cliente primero')}>
          {isEdit ? 'Guardar cambios' : 'Crear presupuesto'}
        </button>
      </div>
    </div>
  )
}

// ─── Modal envio ──────────────────────────────────────────────────────────────
function ModalEnvio({ presupuesto, cliente, onClose, onEnviado }) {
  const [copied, setCopied] = useState(false)
  const { subtotal, desc, base, ivaAmt, total } = calcTotales({ items: presupuesto.items, descuento: presupuesto.descuento, iva: presupuesto.iva })
  const respNombre = presupuesto.responsable === 'pablo' ? 'Pablo Puado' : 'Alberto'
  const respEmail = presupuesto.responsable === 'pablo' ? 'pablo@onesevenia.com' : 'alberto@onesevenia.com'
  const ref = `PRES-${new Date(presupuesto.fecha || presupuesto.created_at).getFullYear()}-${presupuesto.id?.slice(-3).toUpperCase() || '000'}`

  const msgWA = `Hola ${cliente?.nombre?.split(' ')[0] || ''}!

Te envio el presupuesto "${presupuesto.titulo}" (${ref}) de ONESEVEN IA.

Detalle:
${(presupuesto.items || []).filter(it => it.descripcion).map(it => `- ${it.descripcion}: ${formatEur((parseFloat(it.cantidad)||1)*(parseFloat(it.precio_unit)||0))}`).join('\n')}

Base imponible: ${formatEur(base)}
IVA (${presupuesto.iva || 21}%): ${formatEur(ivaAmt)}
Total: ${formatEur(total)}

Valido ${presupuesto.validez || 15} dias.

ONESEVEN IA - onesevenia.com`

  const asunto = `Presupuesto ${ref} - ${presupuesto.titulo}`
  const msgEmail = `Hola ${cliente?.nombre?.split(' ')[0] || ''},\n\nAdjunto el presupuesto ${ref} solicitado.\n\nBase imponible: ${formatEur(base)}\nIVA (${presupuesto.iva || 21}%): ${formatEur(ivaAmt)}\nTotal: ${formatEur(total)}\n\nValido durante ${presupuesto.validez || 15} dias.\n\n${respNombre}\nONESEVEN IA - ${respEmail}`

  const copiar = (txt) => { navigator.clipboard.writeText(txt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg1)', borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}><div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border2)' }} /></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px' }}>
          <div><div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text0)' }}>Enviar presupuesto</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{ref} · {cliente?.nombre}</div></div>
          <button onClick={onClose} style={{ background: 'var(--bg3)', border: 'none', borderRadius: 20, width: 32, height: 32, cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CloseIcon /></button>
        </div>
        <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Ver PDF */}
          <button onClick={() => abrirPresupuesto({ p: presupuesto, cliente })} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent2)', flexShrink: 0 }}><DownloadIcon /></div>
            <div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>Ver presupuesto</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>Abre el PDF · guarda desde la ventana</div></div>
          </button>
          {/* WA */}
          {cliente?.telefono && (
            <div style={{ borderRadius: 12, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.05)', overflow: 'hidden' }}>
              <button onClick={() => { const url = `https://wa.me/${cliente.telefono.replace(/\D/g,'')}?text=${encodeURIComponent(msgWA)}`; window.open(url,'_blank'); onEnviado('wa') }} style={{ width: '100%', padding: '14px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25d366', flexShrink: 0 }}><WAIcon /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>WhatsApp</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{cliente.telefono}</div></div>
                <span style={{ fontSize: 18, color: '#25d366' }}>&#8250;</span>
              </button>
              <div style={{ margin: '0 14px 14px', padding: 10, background: 'var(--bg3)', borderRadius: 8, fontSize: 11, color: 'var(--text2)', whiteSpace: 'pre-wrap', maxHeight: 100, overflowY: 'auto' }}>{msgWA}</div>
              <div style={{ padding: '0 14px 12px' }}><button onClick={() => copiar(msgWA)} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border2)', background: 'none', color: 'var(--text2)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><CopyIcon /> {copied ? 'Copiado' : 'Copiar mensaje'}</button></div>
            </div>
          )}
          {/* Email */}
          {cliente?.email && (
            <div style={{ borderRadius: 12, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)', overflow: 'hidden' }}>
              <button onClick={() => { const url = `https://mail.google.com/mail/?view=cm&fs=1&from=puado@onesevenia.com&to=${encodeURIComponent(cliente.email)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(msgEmail)}`; window.open(url,'_blank'); onEnviado('email') }} style={{ width: '100%', padding: '14px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent2)', flexShrink: 0 }}><MailIcon /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>Gmail</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{cliente.email}</div></div>
                <span style={{ fontSize: 18, color: 'var(--accent2)' }}>&#8250;</span>
              </button>
              <div style={{ margin: '0 14px 14px', padding: 10, background: 'var(--bg3)', borderRadius: 8, fontSize: 11, color: 'var(--text2)', whiteSpace: 'pre-wrap', maxHeight: 100, overflowY: 'auto' }}>{msgEmail}</div>
              <div style={{ padding: '0 14px 12px' }}><button onClick={() => copiar(msgEmail)} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border2)', background: 'none', color: 'var(--text2)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><CopyIcon /> {copied ? 'Copiado' : 'Copiar mensaje'}</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Pagina principal ─────────────────────────────────────────────────────────
export default function Presupuestos() {
  const { clientes } = useClientes()
  const { presupuestos, crear, actualizar, eliminar } = usePresupuestos()
  const [vista, setVista] = useState('lista')
  const [editando, setEditando] = useState(null)
  const [enviando, setEnviando] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const filtrados = useMemo(() => {
    let lista = [...presupuestos]
    if (busqueda) { const q = busqueda.toLowerCase(); lista = lista.filter(p => [p.titulo, p.clientes?.nombre, p.clientes?.empresa].some(f => f?.toLowerCase().includes(q))) }
    if (filtroEstado) lista = lista.filter(p => p.estado === filtroEstado)
    return lista
  }, [presupuestos, busqueda, filtroEstado])

  const handleSave = async (form) => {
    const data = { ...form, items: form.items.filter(it => it.descripcion) }
    if (editando?.id) await actualizar(editando.id, data)
    else await crear(data)
    setVista('lista'); setEditando(null)
  }

  const handleEnviado = async (tipo) => {
    if (enviando?.id) {
      await actualizar(enviando.id, tipo === 'wa' ? { enviado_wa: true, estado: 'enviado', fecha_envio: new Date().toISOString() } : { enviado_email: true, estado: 'enviado', fecha_envio: new Date().toISOString() })
    }
    setEnviando(null)
  }

  const valorTotal = presupuestos.reduce((s, p) => {
    const { total } = calcTotales({ items: p.items, descuento: p.descuento, iva: p.iva })
    return s + total
  }, 0)

  if (vista === 'form') {
    return (
      <Layout title={editando?.id ? 'Editar presupuesto' : 'Nuevo presupuesto'} subtitle="Rellena los datos del presupuesto">
        <div style={{ maxWidth: 800 }}>
          <FormularioPresupuesto presupuesto={editando} clientes={clientes} onSave={handleSave} onCancel={() => { setVista('lista'); setEditando(null) }} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Presupuestos" subtitle={`${filtrados.length} presupuesto${filtrados.length !== 1 ? 's' : ''}`} actions={
      <button className="btn btn-primary" onClick={() => { setEditando(null); setVista('form') }}><PlusIcon /> Nuevo presupuesto</button>
    }>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total', value: presupuestos.length, color: 'var(--text0)' },
          { label: 'Borradores', value: presupuestos.filter(p => p.estado === 'borrador').length, color: 'var(--text3)' },
          { label: 'Enviados', value: presupuestos.filter(p => p.estado === 'enviado').length, color: '#3b82f6' },
          { label: 'Aceptados', value: presupuestos.filter(p => p.estado === 'aceptado').length, color: 'var(--green)' },
          { label: 'Facturados', value: presupuestos.filter(p => p.estado === 'facturado').length, color: '#8b5cf6' },
          { label: 'Valor total', value: formatEur(valorTotal), color: 'var(--accent2)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: s.color, fontFamily: typeof s.value === 'string' ? 'var(--mono)' : 'inherit' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="form-input" style={{ maxWidth: 280 }} placeholder="Buscar por titulo o cliente..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <select className="form-select" style={{ width: 160 }} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtrados.length === 0 && (
        <div className="card empty-state"><div className="empty-state-text">{busqueda || filtroEstado ? 'No hay presupuestos con estos filtros' : 'Crea tu primer presupuesto'}</div></div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtrados.map(p => {
          const cliente = clientes.find(c => c.id === p.cliente_id) || p.clientes
          const { total } = calcTotales({ items: p.items, descuento: p.descuento, iva: p.iva })
          const estado = ESTADO_COLORS[p.estado] || ESTADO_COLORS.borrador
          const ref = `PRES-${new Date(p.fecha || p.created_at).getFullYear()}-${p.id?.slice(-3).toUpperCase() || '000'}`
          return (
            <div key={p.id} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {(cliente?.nombre || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>{p.titulo}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: estado.bg, color: estado.color, fontWeight: 500 }}>{estado.label}</span>
                    {p.enviado_wa && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(37,211,102,0.15)', color: '#25d366' }}>WA</span>}
                    {p.enviado_email && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(99,102,241,0.15)', color: 'var(--accent2)' }}>Email</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
                    <span>{cliente?.nombre}{cliente?.empresa ? ` · ${cliente.empresa}` : ''}</span>
                    <span>{ref}</span>
                    <span>{formatDate(p.fecha)}</span>
                    {p.validez && <span>Valido {p.validez} dias</span>}
                    {p.iva && <span>IVA {p.iva}%</span>}
                    {parseFloat(p.descuento) > 0 && <span style={{ color: 'var(--red)' }}>Dto {p.descuento}%</span>}
                  </div>
                  {p.items?.filter(it => it.descripcion).length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {p.items.filter(it => it.descripcion).map((it, i) => (
                        <span key={i} style={{ fontSize: 10, padding: '2px 7px', background: 'var(--bg4)', color: 'var(--text3)', borderRadius: 8 }}>{it.descripcion}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {total > 0 && <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--green)', marginRight: 4 }}>{formatEur(total)}</span>}
                  {cliente?.telefono && <button className="btn-icon" style={{ width: 32, height: 32, color: '#25d366', borderRadius: 8, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)' }} onClick={() => setEnviando(p)}><WAIcon /></button>}
                  {cliente?.email && <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--accent2)', borderRadius: 8, border: '1px solid var(--accent-dim)', background: 'var(--accent-dim)' }} onClick={() => setEnviando(p)}><MailIcon /></button>}
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--text2)' }} onClick={() => abrirPresupuesto({ p, cliente })}><DownloadIcon /></button>
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--text2)' }} onClick={() => { setEditando(p); setVista('form') }}><EditIcon /></button>
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--text2)' }} onClick={async () => { const { id, created_at, ...d } = p; await crear({ ...d, titulo: p.titulo + ' (copia)', estado: 'borrador', fecha: new Date().toISOString().split('T')[0] }) }}><CopyIcon /></button>
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--red)' }} onClick={() => setConfirmDelete(p)}><TrashIcon /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {enviando && <ModalEnvio presupuesto={enviando} cliente={clientes.find(c => c.id === enviando.cliente_id) || enviando.clientes} onClose={() => setEnviando(null)} onEnviado={handleEnviado} />}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: '28px', maxWidth: 380, width: '100%', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>!</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text0)', marginBottom: 8 }}>Eliminar presupuesto</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>Eliminar "<strong>{confirmDelete.titulo}</strong>"? Esta accion no se puede deshacer.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn" style={{ background: 'var(--red)', color: '#fff', border: 'none' }} onClick={async () => { await eliminar(confirmDelete.id); setConfirmDelete(null) }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
