import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useClientes } from '../hooks/useData'
import { usePropuestas } from '../hooks/useData'
import { formatEur, formatDate } from '../lib/constants'

function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg> }
function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h9M5 3V2h3v1M3 3l.5 8h6l.5-8"/></svg> }
function EditIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2l2 2-7 7H2V9L9 2z"/></svg> }
function DownloadIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 1v8M4 6l3 3 3-3"/><path d="M1 10v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1"/></svg> }
function WAIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> }
function MailIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 3l6 5 6-5"/><rect x="1" y="2" width="12" height="10" rx="1"/></svg> }
function CloseIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg> }
function CopyIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="8" height="8" rx="1"/><path d="M1 9V2a1 1 0 0 1 1-1h7"/></svg> }

const SERVICIOS_LISTA = [
  { label: 'Desarrollo Web', desc: 'Diseño y desarrollo de sitio web profesional' },
  { label: 'Automatizaciones', desc: 'Automatización de procesos con n8n y Make' },
  { label: 'Agente IA', desc: 'Agente de inteligencia artificial personalizado' },
  { label: 'Consultoría IA', desc: 'Asesoramiento estratégico en IA para tu empresa' },
  { label: 'Retainer Mensual', desc: 'Mantenimiento y soporte mensual continuo' },
  { label: 'SEO / Marketing Digital', desc: 'Posicionamiento y visibilidad online' },
]

const ESTADO_COLORS = {
  borrador: { bg: 'var(--bg4)', color: 'var(--text3)', label: 'Borrador' },
  enviada: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Enviada' },
  aceptada: { bg: 'rgba(16,185,129,0.15)', color: 'var(--green)', label: 'Aceptada ✓' },
  rechazada: { bg: 'rgba(239,68,68,0.15)', color: 'var(--red)', label: 'Rechazada' },
  caducada: { bg: 'rgba(245,158,11,0.15)', color: 'var(--amber)', label: 'Caducada' },
}

// ─── Generar HTML de propuesta ────────────────────────────────────────────────
function generarHTMLPropuesta({ p, cliente }) {
  const respNombre = p.responsable === 'pablo' ? 'Pablo Puado' : 'Alberto'
  const respEmail = p.responsable === 'pablo' ? 'pablo@onesevenia.com' : 'alberto@onesevenia.com'
  const items = Array.isArray(p.items) ? p.items : []
  const total = items.reduce((s, it) => s + (parseFloat(it.precio) || 0), 0)
  const ref = `OS-${new Date(p.fecha || p.created_at).getFullYear()}-${p.id?.slice(-3).toUpperCase() || '000'}`

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Propuesta ${ref}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;background:#fff;font-size:14px;line-height:1.6}.page{max-width:794px;margin:0 auto}.header{background:linear-gradient(135deg,#0a0a1a,#1a1a3e);color:white;padding:48px 56px 40px}.ht{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}.li img{height:40px;filter:brightness(0)invert(1)}.li .sub{font-size:11px;color:rgba(255,255,255,.4);margin-top:6px;letter-spacing:.08em}.hm{text-align:right;font-size:12px;color:rgba(255,255,255,.5)}.htitle{font-size:26px;font-weight:300;margin-bottom:8px}.hsub{font-size:14px;color:rgba(255,255,255,.6)}.ab{height:4px;background:linear-gradient(90deg,#6366f1,#a855f7,#06b6d4)}.body{padding:48px 56px}.section{margin-bottom:32px}.st{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#6366f1;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #e8e8f0}.ig{display:grid;grid-template-columns:1fr 1fr;gap:20px}.ib{background:#f8f8ff;border-radius:8px;padding:18px;border-left:3px solid #6366f1}.ib .lb{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-bottom:6px}.ib .vl{font-size:15px;font-weight:600;color:#1a1a2e}.ib .sb{font-size:12px;color:#666;margin-top:3px}.intro{font-size:14px;color:#444;line-height:1.8;background:#fafafa;padding:22px;border-radius:8px;border:1px solid #eee}table{width:100%;border-collapse:separate;border-spacing:0}th{background:#1a1a2e;color:white;padding:12px 16px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}th:first-child{border-radius:8px 0 0 0}th:last-child{border-radius:0 8px 0 0;text-align:right}td{padding:14px 16px;border-bottom:1px solid #f0f0f8;vertical-align:top}tr:last-child td{border-bottom:none}tr:nth-child(even) td{background:#fafaff}.in{font-weight:600;color:#1a1a2e;margin-bottom:3px}.id{font-size:12px;color:#666}.ip{text-align:right;font-weight:700;color:#1a1a2e;font-size:15px;white-space:nowrap}.tr{background:linear-gradient(135deg,#6366f1,#8b5cf6)}.tr td{padding:16px;font-weight:700;font-size:16px;border:none!important;color:white}.vb{display:inline-flex;align-items:center;gap:8px;background:#fff8e7;border:1px solid #fbbf24;border-radius:20px;padding:6px 14px;font-size:12px;color:#92400e;margin-top:12px}.cond{font-size:13px;color:#555;line-height:1.8;white-space:pre-line}.footer{background:#0a0a1a;color:rgba(255,255,255,.5);padding:24px 56px;display:flex;justify-content:space-between;align-items:center;font-size:12px}</style></head><body><div class="page"><div class="header"><div class="ht"><div class="li"><img src="https://onesevenia.com/lovable-uploads/20e6c263-0631-43ca-acf0-a255777708ba.png" alt="ONESEVEN IA" onerror="this.style.display='none'"><div class="sub">AUTOMATIZACIÓN E INTELIGENCIA ARTIFICIAL</div></div><div class="hm"><div>${ref}</div><div>${formatDate(p.fecha)}</div></div></div><div class="htitle">${p.titulo}</div><div class="hsub">Para ${cliente?.nombre || ''}${cliente?.empresa ? ' · ' + cliente.empresa : ''}</div></div><div class="ab"></div><div class="body"><div class="section"><div class="st">Información</div><div class="ig"><div class="ib"><div class="lb">Destinatario</div><div class="vl">${cliente?.nombre || '—'}</div><div class="sb">${cliente?.empresa || ''}</div>${cliente?.email ? '<div class="sb">' + cliente.email + '</div>' : ''}</div><div class="ib"><div class="lb">Preparada por</div><div class="vl">${respNombre}</div><div class="sb">ONESEVEN IA</div><div class="sb">${respEmail}</div></div></div></div>${p.intro ? '<div class="section"><div class="st">Presentación</div><div class="intro">' + p.intro + '</div></div>' : ''}<div class="section"><div class="st">Servicios incluidos</div><table><thead><tr><th style="width:70%">Servicio</th><th>Importe</th></tr></thead><tbody>${items.filter(it => it.descripcion).map(it => '<tr><td><div class="in">' + it.descripcion + '</div>' + (it.detalle ? '<div class="id">' + it.detalle + '</div>' : '') + '</td><td class="ip">' + (it.precio ? formatEur(parseFloat(it.precio)) : '—') + '</td></tr>').join('')}<tr class="tr"><td>Total propuesta</td><td style="text-align:right;font-size:20px">${formatEur(total)}</td></tr></tbody></table>${p.validez ? '<div class="vb">⏳ Válida ' + p.validez + ' días desde la fecha de emisión</div>' : ''}</div>${p.condiciones ? '<div class="section"><div class="st">Condiciones</div><div class="cond">' + p.condiciones + '</div></div>' : ''}</div><div class="footer"><div><div style="color:white;font-weight:600;margin-bottom:4px">ONESEVEN IA</div><div>onesevenia.com</div></div><div style="text-align:right"><div style="color:white;font-weight:600;margin-bottom:4px">${respNombre}</div><div>${respEmail}</div></div></div></div></body></html>`
}

// ─── Descargar PDF directamente (sin imprimir) ────────────────────────────────
function descargarPDF({ p, cliente }) {
  const html = generarHTMLPropuesta({ p, cliente })
  const ref = `OS-${new Date(p.fecha || p.created_at).getFullYear()}-${p.id?.slice(-3).toUpperCase() || '000'}`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Propuesta-${ref}-${cliente?.nombre || 'cliente'}.html`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Formulario ───────────────────────────────────────────────────────────────
function FormularioPropuesta({ propuesta, clientes, onSave, onCancel }) {
  const isEdit = !!propuesta?.id
  const [form, setForm] = useState({
    cliente_id: '', titulo: 'Propuesta de servicios de automatización e IA',
    fecha: new Date().toISOString().split('T')[0], validez: '30',
    intro: 'Nos complace presentarte esta propuesta personalizada para ayudarte a optimizar tus procesos y potenciar tu negocio con inteligencia artificial.',
    items: [{ descripcion: '', detalle: '', precio: '' }],
    condiciones: 'El 50% del importe se abona antes de iniciar el proyecto. El 50% restante al finalizar la entrega.\n\nEl plazo de ejecución se acuerda una vez confirmada la propuesta.\n\nLos precios indicados no incluyen IVA.',
    responsable: 'pablo', estado: 'borrador',
    ...propuesta,
    items: propuesta?.items?.length ? propuesta.items : [{ descripcion: '', detalle: '', precio: '' }],
  })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const addItem = () => set('items', [...form.items, { descripcion: '', detalle: '', precio: '' }])
  const removeItem = (i) => set('items', form.items.filter((_, idx) => idx !== i))
  const updateItem = (i, k, v) => set('items', form.items.map((item, idx) => idx === i ? { ...item, [k]: v } : item))
  const total = form.items.reduce((s, it) => s + (parseFloat(it.precio) || 0), 0)

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
          {isEdit ? 'Editar propuesta' : 'Nueva propuesta'}
        </div>
        <div className="form-group">
          <label className="form-label">Cliente *</label>
          <select className="form-select" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}>
            <option value="">Seleccionar cliente...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` · ${c.empresa}` : ''}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Título</label>
          <input className="form-input" value={form.titulo} onChange={e => set('titulo', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 12px' }}>
          <div className="form-group"><label className="form-label">Fecha</label><input className="form-input" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Validez (días)</label><input className="form-input" type="number" value={form.validez} onChange={e => set('validez', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Responsable</label><select className="form-select" value={form.responsable} onChange={e => set('responsable', e.target.value)}><option value="pablo">Pablo Puado</option><option value="alberto">Alberto</option></select></div>
          <div className="form-group"><label className="form-label">Estado</label><select className="form-select" value={form.estado} onChange={e => set('estado', e.target.value)}>{Object.entries(ESTADO_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Presentación</label>
          <textarea className="form-textarea" value={form.intro} onChange={e => set('intro', e.target.value)} style={{ minHeight: 70 }} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Servicios y precios</div>
          <button className="btn btn-ghost btn-sm" onClick={addItem}>+ Añadir</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
          {SERVICIOS_LISTA.map(s => (
            <button key={s.label} onClick={() => {
              const ei = form.items.findIndex(it => !it.descripcion)
              ei >= 0 ? (updateItem(ei, 'descripcion', s.label), updateItem(ei, 'detalle', s.desc)) : set('items', [...form.items, { descripcion: s.label, detalle: s.desc, precio: '' }])
            }} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border2)', background: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
              + {s.label}
            </button>
          ))}
        </div>
        {form.items.map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 32px', gap: '0 8px', marginBottom: 7, alignItems: 'start' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>{i === 0 && <label className="form-label">Servicio</label>}<input className="form-input" value={item.descripcion} onChange={e => updateItem(i, 'descripcion', e.target.value)} placeholder="Nombre" /></div>
            <div className="form-group" style={{ marginBottom: 0 }}>{i === 0 && <label className="form-label">Detalle</label>}<input className="form-input" value={item.detalle} onChange={e => updateItem(i, 'detalle', e.target.value)} placeholder="Opcional" /></div>
            <div className="form-group" style={{ marginBottom: 0 }}>{i === 0 && <label className="form-label">Precio (€)</label>}<input className="form-input" type="number" value={item.precio} onChange={e => updateItem(i, 'precio', e.target.value)} placeholder="0" /></div>
            <div style={{ paddingTop: i === 0 ? 22 : 0 }}><button className="btn-icon" style={{ width: 32, height: 36, color: 'var(--red)' }} onClick={() => form.items.length > 1 && removeItem(i)}><TrashIcon /></button></div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border)', marginTop: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text3)', marginRight: 12 }}>Total:</span>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent2)' }}>{formatEur(total)}</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Condiciones</div>
        <textarea className="form-textarea" value={form.condiciones} onChange={e => set('condiciones', e.target.value)} style={{ minHeight: 90 }} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" style={{ padding: '10px 24px' }} onClick={() => form.cliente_id ? onSave(form) : alert('Selecciona un cliente primero')}>
          {isEdit ? 'Guardar cambios' : 'Crear propuesta'}
        </button>
      </div>
    </div>
  )
}

// ─── Modal envío ──────────────────────────────────────────────────────────────
function ModalEnvio({ propuesta, cliente, onClose, onEnviado }) {
  const [tab, setTab] = useState('wa')
  const [copied, setCopied] = useState(false)
  const total = (propuesta.items || []).reduce((s, it) => s + (parseFloat(it.precio) || 0), 0)
  const respNombre = propuesta.responsable === 'pablo' ? 'Pablo Puado' : 'Alberto'
  const respEmail = propuesta.responsable === 'pablo' ? 'pablo@onesevenia.com' : 'alberto@onesevenia.com'
  const ref = `OS-${new Date(propuesta.fecha || propuesta.created_at).getFullYear()}-${propuesta.id?.slice(-3).toUpperCase() || '000'}`

  const msgWA = `Hola ${cliente?.nombre?.split(' ')[0] || ''}! 👋

Te adjunto la propuesta *${propuesta.titulo}* (${ref}) que hemos preparado para ti desde ONESEVEN IA.

📋 *Resumen:*
${(propuesta.items || []).filter(it => it.descripcion).map(it => `• ${it.descripcion}${it.precio ? ' — ' + formatEur(parseFloat(it.precio)) : ''}`).join('\n')}

💰 *Total: ${formatEur(total)}*
📅 Válida ${propuesta.validez || 30} días

Cualquier duda estoy disponible! 🚀

_ONESEVEN IA · onesevenia.com_`

  const asuntoEmail = `Propuesta ${ref} — ${propuesta.titulo}`
  const msgEmail = `Hola ${cliente?.nombre?.split(' ')[0] || ''},

Adjunto encontrarás la propuesta personalizada que hemos preparado para ti desde ONESEVEN IA.

${propuesta.titulo} | Ref: ${ref} | Fecha: ${formatDate(propuesta.fecha)}

SERVICIOS:
${(propuesta.items || []).filter(it => it.descripcion).map(it => `• ${it.descripcion}${it.detalle ? ' — ' + it.detalle : ''}${it.precio ? ' (' + formatEur(parseFloat(it.precio)) + ')' : ''}`).join('\n')}

TOTAL: ${formatEur(total)}
Válida ${propuesta.validez || 30} días.

Un saludo,
${respNombre}
ONESEVEN IA · ${respEmail}`

  const handleDescargar = () => descargarPDF({ p: propuesta, cliente })

  const handleEnviarWA = () => {
    // 1. Descargar PDF
    descargarPDF({ p: propuesta, cliente })
    // 2. Copiar mensaje al portapapeles
    navigator.clipboard.writeText(msgWA).catch(() => {})
    // 3. Abrir WhatsApp
    const phone = cliente?.telefono?.replace(/\D/g, '') || ''
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msgWA)}`
    setTimeout(() => {
      window.open(waUrl, '_blank')
      onEnviado('wa')
    }, 800)
  }

  const handleEnviarEmail = () => {
    // 1. Descargar PDF
    descargarPDF({ p: propuesta, cliente })
    // 2. Abrir cliente de correo con el mensaje
    const mailUrl = `mailto:${cliente?.email || ''}?subject=${encodeURIComponent(asuntoEmail)}&body=${encodeURIComponent(msgEmail)}`
    setTimeout(() => {
      window.location.href = mailUrl
      onEnviado('email')
    }, 800)
  }

  const copiarMensaje = (txt) => {
    navigator.clipboard.writeText(txt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 560, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text0)' }}>Enviar propuesta</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{cliente?.nombre} · {ref}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}><CloseIcon /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {[
            { id: 'wa', label: 'WhatsApp', icon: <WAIcon />, color: '#25d366', disabled: !cliente?.telefono },
            { id: 'email', label: 'Email', icon: <MailIcon />, color: '#6366f1', disabled: !cliente?.email },
          ].map(t => (
            <button key={t.id} onClick={() => !t.disabled && setTab(t.id)} style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: tab === t.id ? 600 : 400, cursor: t.disabled ? 'not-allowed' : 'pointer', background: 'none', border: 'none', borderBottom: tab === t.id ? `2px solid ${t.color}` : '2px solid transparent', color: t.disabled ? 'var(--text3)' : tab === t.id ? t.color : 'var(--text2)', opacity: t.disabled ? 0.4 : 1, transition: 'all 0.15s' }}>
              {t.icon}{t.label}{t.disabled && <span style={{ fontSize: 10, color: 'var(--red)' }}>(sin datos)</span>}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 20px 20px' }}>
          {/* Info descarga */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 14 }}>
            <DownloadIcon />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text0)' }}>La propuesta se descargará como archivo</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Se guardará en tu dispositivo lista para adjuntar</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleDescargar} style={{ gap: 5 }}>
              <DownloadIcon /> Descargar
            </button>
          </div>

          {/* Mensaje */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Mensaje predeterminado</label>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => copiarMensaje(tab === 'wa' ? msgWA : msgEmail)}>
                <CopyIcon /> {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px', fontSize: 11, color: 'var(--text1)', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 180, overflowY: 'auto' }}>
              {tab === 'wa' ? msgWA : msgEmail}
            </div>
            {tab === 'email' && (
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                Asunto: <strong style={{ color: 'var(--text1)' }}>{asuntoEmail}</strong>
              </div>
            )}
          </div>

          {/* Botón envío */}
          <button
            onClick={tab === 'wa' ? handleEnviarWA : handleEnviarEmail}
            style={{ width: '100%', padding: '13px', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#fff', background: tab === 'wa' ? '#25d366' : 'var(--accent)' }}
          >
            {tab === 'wa' ? <WAIcon /> : <MailIcon />}
            {tab === 'wa'
              ? `Descargar PDF + Abrir WhatsApp`
              : `Descargar PDF + Abrir Email`}
          </button>
          <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 8 }}>
            {tab === 'wa'
              ? 'Se descargará el PDF y se abrirá WhatsApp con el mensaje listo para enviar'
              : 'Se descargará el PDF y se abrirá tu app de email con el mensaje listo'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Propuestas() {
  const { clientes } = useClientes()
  const { propuestas, crear, actualizar, eliminar } = usePropuestas()
  const [vista, setVista] = useState('lista')
  const [editando, setEditando] = useState(null)
  const [enviando, setEnviando] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const propuestasFiltradas = useMemo(() => {
    let lista = [...propuestas]
    if (busqueda) { const q = busqueda.toLowerCase(); lista = lista.filter(p => [p.titulo, p.clientes?.nombre, p.clientes?.empresa].some(f => f?.toLowerCase().includes(q))) }
    if (filtroEstado) lista = lista.filter(p => p.estado === filtroEstado)
    return lista
  }, [propuestas, busqueda, filtroEstado])

  const handleSave = async (form) => {
    const data = { ...form, items: form.items.filter(it => it.descripcion) }
    if (editando?.id) await actualizar(editando.id, data)
    else await crear(data)
    setVista('lista'); setEditando(null)
  }

  const handleEliminar = async (id) => { await eliminar(id); setConfirmDelete(null) }

  const handleEnviado = async (tipo) => {
    if (enviando?.id) {
      const updates = tipo === 'wa'
        ? { enviado_wa: true, estado: 'enviada', fecha_envio: new Date().toISOString() }
        : { enviado_email: true, estado: 'enviada', fecha_envio: new Date().toISOString() }
      await actualizar(enviando.id, updates)
    }
    setEnviando(null)
  }

  if (vista === 'form') {
    return (
      <Layout title={editando?.id ? 'Editar propuesta' : 'Nueva propuesta'} subtitle="Rellena los datos de la propuesta">
        <div style={{ maxWidth: 760 }}>
          <FormularioPropuesta propuesta={editando} clientes={clientes} onSave={handleSave} onCancel={() => { setVista('lista'); setEditando(null) }} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Propuestas"
      subtitle={`${propuestasFiltradas.length} propuesta${propuestasFiltradas.length !== 1 ? 's' : ''}`}
      actions={<button className="btn btn-primary" onClick={() => { setEditando(null); setVista('form') }}><PlusIcon /> Nueva propuesta</button>}
    >
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total', value: propuestas.length, color: 'var(--text0)' },
          { label: 'Borradores', value: propuestas.filter(p => p.estado === 'borrador').length, color: 'var(--text3)' },
          { label: 'Enviadas', value: propuestas.filter(p => p.estado === 'enviada').length, color: '#3b82f6' },
          { label: 'Aceptadas', value: propuestas.filter(p => p.estado === 'aceptada').length, color: 'var(--green)' },
          { label: 'Valor total', value: formatEur(propuestas.reduce((s, p) => s + ((p.items || []).reduce((ss, it) => ss + (parseFloat(it.precio) || 0), 0)), 0)), color: 'var(--accent2)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: s.color, fontFamily: typeof s.value === 'string' ? 'var(--mono)' : 'inherit' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="form-input" style={{ maxWidth: 280 }} placeholder="Buscar por título o cliente..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <select className="form-select" style={{ width: 160 }} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {propuestasFiltradas.length === 0 && (
        <div className="card empty-state"><div className="empty-state-text">{busqueda || filtroEstado ? 'No hay propuestas con estos filtros' : 'Crea tu primera propuesta'}</div></div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {propuestasFiltradas.map(p => {
          const cliente = clientes.find(c => c.id === p.cliente_id) || p.clientes
          const total = (p.items || []).reduce((s, it) => s + (parseFloat(it.precio) || 0), 0)
          const estado = ESTADO_COLORS[p.estado] || ESTADO_COLORS.borrador
          const ref = `OS-${new Date(p.fecha || p.created_at).getFullYear()}-${p.id?.slice(-3).toUpperCase() || '000'}`

          return (
            <div key={p.id} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {(cliente?.nombre || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>{p.titulo}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: estado.bg, color: estado.color, fontWeight: 500 }}>{estado.label}</span>
                    {p.enviado_wa && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(37,211,102,0.15)', color: '#25d366' }}>WA ✓</span>}
                    {p.enviado_email && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(99,102,241,0.15)', color: 'var(--accent2)' }}>Email ✓</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
                    <span>{cliente?.nombre}{cliente?.empresa ? ` · ${cliente.empresa}` : ''}</span>
                    <span>{ref}</span>
                    <span>{formatDate(p.fecha)}</span>
                    {p.validez && <span>Válida {p.validez} días</span>}
                  </div>
                  {p.items?.filter(it => it.descripcion).length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {p.items.filter(it => it.descripcion).map((it, i) => (
                        <span key={i} style={{ fontSize: 10, padding: '2px 7px', background: 'var(--bg4)', color: 'var(--text3)', borderRadius: 8 }}>{it.descripcion}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {total > 0 && <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--green)', marginRight: 4 }}>{formatEur(total)}</span>}

                  {/* WA */}
                  {cliente?.telefono && (
                    <button className="btn-icon" style={{ width: 32, height: 32, color: '#25d366', borderRadius: 8, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)' }} onClick={() => setEnviando(p)} title="Enviar por WhatsApp">
                      <WAIcon />
                    </button>
                  )}

                  {/* Email */}
                  {cliente?.email && (
                    <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--accent2)', borderRadius: 8, border: '1px solid var(--accent-dim)', background: 'var(--accent-dim)' }} onClick={() => setEnviando(p)} title="Enviar por email">
                      <MailIcon />
                    </button>
                  )}

                  {/* Descargar PDF */}
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--text2)' }} onClick={() => descargarPDF({ p, cliente })} title="Descargar PDF">
                    <DownloadIcon />
                  </button>

                  {/* Editar */}
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--text2)' }} onClick={() => { setEditando(p); setVista('form') }} title="Editar">
                    <EditIcon />
                  </button>

                  {/* Duplicar */}
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--text2)' }} onClick={async () => {
                    const { id, created_at, enviado_wa, enviado_email, fecha_envio, ...datos } = p
                    await crear({ ...datos, titulo: p.titulo + ' (copia)', estado: 'borrador', fecha: new Date().toISOString().split('T')[0] })
                  }} title="Duplicar">
                    <CopyIcon />
                  </button>

                  {/* Eliminar */}
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--red)' }} onClick={() => setConfirmDelete(p)} title="Eliminar">
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal envío */}
      {enviando && (
        <ModalEnvio
          propuesta={enviando}
          cliente={clientes.find(c => c.id === enviando.cliente_id) || enviando.clientes}
          onClose={() => setEnviando(null)}
          onEnviado={handleEnviado}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: '28px 28px 24px', maxWidth: 380, width: '100%', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text0)', marginBottom: 8 }}>Eliminar propuesta</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24, lineHeight: 1.6 }}>
              ¿Eliminar "<strong style={{ color: 'var(--text1)' }}>{confirmDelete.titulo}</strong>"? Esta acción no se puede deshacer.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn" style={{ background: 'var(--red)', color: '#fff', border: 'none' }} onClick={() => handleEliminar(confirmDelete.id)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
