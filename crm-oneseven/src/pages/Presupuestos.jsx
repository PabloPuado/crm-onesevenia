import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useClientes, usePresupuestos, useEmpresaConfig } from '../hooks/useData'
import { formatEur, formatDate } from '../lib/constants'

// Sanitize payload — convert empty strings to null (prevents uuid errors in Supabase)
function sanitize(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === '' || v === undefined ? null : v])
  )
}


function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg> }
function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h9M5 3V2h3v1M3 3l.5 8h6l.5-8"/></svg> }
function EditIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2l2 2-7 7H2V9L9 2z"/></svg> }
function DownloadIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 1v8M4 6l3 3 3-3"/><path d="M1 10v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1"/></svg> }
function WAIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> }
function MailIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 3l6 5 6-5"/><rect x="1" y="2" width="12" height="10" rx="1"/></svg> }
function CloseIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg> }
function CopyIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="8" height="8" rx="1"/><path d="M1 9V2a1 1 0 0 1 1-1h7"/></svg> }
function SettingsIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="2"/><path d="M7 1v2M7 11v2M1 7h2M11 7h2"/></svg> }

const ESTADO_COLORS = {
  borrador: { bg: 'var(--bg4)', color: 'var(--text3)', label: 'Borrador' },
  enviado: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Enviado' },
  aceptado: { bg: 'rgba(16,185,129,0.15)', color: 'var(--green)', label: 'Aceptado' },
  rechazado: { bg: 'rgba(239,68,68,0.15)', color: 'var(--red)', label: 'Rechazado' },
  caducado: { bg: 'rgba(245,158,11,0.15)', color: 'var(--amber)', label: 'Caducado' },
  facturado: { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6', label: 'Facturado' },
}

function calcTotales({ items, descuento, iva, mantenimiento }) {
  const subtotal = (items || []).reduce((s, it) => s + ((parseFloat(it.cantidad) || 1) * (parseFloat(it.precio_unit) || 0)), 0)
  const desc = subtotal * ((parseFloat(descuento) || 0) / 100)
  const base = subtotal - desc
  const ivaAmt = base * ((parseFloat(iva) || 21) / 100)
  const total = base + ivaAmt
  // Mantenimiento
  const mant = mantenimiento || {}
  const mantBase = parseFloat(mant.precio) || 0
  const mantIvaAmt = mant.con_iva ? mantBase * ((parseFloat(iva) || 21) / 100) : 0
  const mantTotal = mantBase + mantIvaAmt
  return { subtotal, desc, base, ivaAmt, total, mantBase, mantIvaAmt, mantTotal }
}

// ─── HTML Presupuesto con datos empresa y cliente ─────────────────────────────
function generarHTMLPresupuesto({ p, cliente, empresa }) {
  const emp = empresa || {}
  const respNombre = p.responsable === 'pablo' ? 'Pablo Puado' : 'Alberto'
  const respEmail = p.responsable === 'pablo' ? (emp.email || 'pablo@onesevenia.com') : 'alberto@onesevenia.com'
  const items = (Array.isArray(p.items) ? p.items : []).filter(it => it.descripcion)
  const mant = p.mantenimiento || {}
  const { subtotal, desc, base, ivaAmt, total, mantBase, mantIvaAmt, mantTotal } = calcTotales({ items, descuento: p.descuento, iva: p.iva, mantenimiento: mant })
  const tieneMant = mant.activo && mantBase > 0
  const ref = `PRES-${new Date(p.fecha || p.created_at).getFullYear()}-${p.id?.slice(-3).toUpperCase() || '000'}`
  const empDireccion = [emp.direccion, emp.cp, emp.ciudad].filter(Boolean).join(', ')

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Presupuesto ${ref}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;background:#fff;font-size:14px;line-height:1.6}.topbar{position:fixed;top:0;left:0;right:0;background:#1a1a2e;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;z-index:100;gap:8px}.back-btn{background:rgba(255,255,255,.1);color:white;border:none;padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer}.save-btn{background:#6366f1;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer}.topbar-title{color:rgba(255,255,255,.7);font-size:12px;flex:1;text-align:center}.wrapper{padding-top:52px}.page{max-width:794px;margin:0 auto}.header{background:linear-gradient(135deg,#0a0a1a,#1a1a3e);color:white;padding:36px 48px 28px}.ht{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:20px}.emp-block{flex:1}.emp-logo{height:36px;filter:brightness(0)invert(1);margin-bottom:10px;display:block}.emp-name{font-size:15px;font-weight:700;color:white;margin-bottom:3px}.emp-data{font-size:11px;color:rgba(255,255,255,.5);line-height:1.9}.ref-block{text-align:right;flex-shrink:0}.ref-badge{display:inline-block;background:rgba(99,102,241,.3);color:#c7d2fe;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.04em;margin-bottom:8px}.ref-meta{font-size:11px;color:rgba(255,255,255,.5);line-height:1.9}.doc-title{font-size:20px;font-weight:300;margin-bottom:4px}.doc-sub{font-size:13px;color:rgba(255,255,255,.6)}.ab{height:3px;background:linear-gradient(90deg,#6366f1,#a855f7,#06b6d4)}.body{padding:32px 48px}.section{margin-bottom:22px}.st{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6366f1;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #e8e8f0}.parties{display:grid;grid-template-columns:1fr 1fr;gap:14px}.party{background:#f8f8ff;border-radius:8px;padding:14px;border-left:3px solid #6366f1}.party-label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-bottom:5px}.party-name{font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:3px}.party-detail{font-size:11px;color:#666;line-height:1.8}table{width:100%;border-collapse:separate;border-spacing:0}th{background:#1a1a2e;color:white;padding:9px 12px;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}th:first-child{border-radius:6px 0 0 0}th:last-child{border-radius:0 6px 0 0;text-align:right}td{padding:10px 12px;border-bottom:1px solid #f0f0f8;vertical-align:top;font-size:13px}tr:nth-child(even) td{background:#fafaff}.in{font-weight:600;color:#1a1a2e}.id{font-size:11px;color:#888;margin-top:2px}.ip{text-align:right;font-weight:600;color:#1a1a2e}.tc{text-align:center}.totals-box{margin-top:10px;margin-left:auto;width:300px;background:#f8f8ff;border-radius:8px;padding:14px;border:1px solid #e8e8f0}.t-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#555;border-bottom:1px solid #eee}.t-row:last-child{border-bottom:none}.t-row.total-row{margin-top:6px;padding-top:10px;border-top:2px solid #6366f1!important;font-weight:700;font-size:15px;color:#1a1a2e}.t-row.desc-row{color:#ef4444}.cond-box{background:#fafafa;border:1px solid #eee;border-radius:8px;padding:14px;font-size:12px;color:#555;line-height:1.9;white-space:pre-line}.iban-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;font-size:12px;color:#166534;margin-top:12px}.footer{background:#0a0a1a;color:rgba(255,255,255,.45);padding:18px 48px;display:flex;justify-content:space-between;align-items:center;font-size:11px;line-height:1.7}.footer-left div:first-child{color:rgba(255,255,255,.8);font-weight:600;margin-bottom:2px}.footer-right{text-align:right}.footer-right div:first-child{color:rgba(255,255,255,.8);font-weight:600;margin-bottom:2px}@media print{.topbar{display:none}.wrapper{padding-top:0}body{print-color-adjust:exact;-webkit-print-color-adjust:exact}@page{margin:0;size:A4}}</style></head>
<body>
<div class="topbar">
  <button class="back-btn" onclick="window.close()">&#8592; Cerrar</button>
  <span class="topbar-title">${ref} &mdash; ${cliente?.nombre || ''}</span>
  <button class="save-btn" onclick="window.print()">Guardar PDF</button>
</div>
<div class="wrapper"><div class="page">
<div class="header">
  <div class="ht">
    <div class="emp-block">
      <img class="emp-logo" src="${emp.logo_url || 'https://onesevenia.com/lovable-uploads/20e6c263-0631-43ca-acf0-a255777708ba.png'}" alt="${emp.nombre || 'ONESEVEN IA'}" onerror="this.style.display='none'">
      <div class="emp-name">${emp.nombre || 'ONESEVEN IA'}</div>
      <div class="emp-data">
        ${emp.cif ? `CIF: ${emp.cif}<br>` : ''}
        ${empDireccion ? `${empDireccion}<br>` : ''}
        ${emp.pais || ''}${emp.pais && empDireccion ? '' : ''}
        ${emp.telefono ? `<br>Tel: ${emp.telefono}` : ''}
        ${emp.email ? `<br>${emp.email}` : ''}
        ${emp.web ? `<br>${emp.web}` : ''}
      </div>
    </div>
    <div class="ref-block">
      <div class="ref-badge">${ref}</div>
      <div class="ref-meta">
        Fecha: ${formatDate(p.fecha)}<br>
        ${p.validez ? `Validez: ${p.validez} dias<br>` : ''}
        Responsable: ${respNombre}
      </div>
    </div>
  </div>
  <div class="doc-title">${p.titulo}</div>
  <div class="doc-sub">Para ${cliente?.nombre || ''}${cliente?.empresa ? ' &mdash; ' + cliente.empresa : ''}</div>
</div>
<div class="ab"></div>
<div class="body">

  <div class="section">
    <div class="st">Partes del presupuesto</div>
    <div class="parties">
      <div class="party">
        <div class="party-label">Emisor</div>
        <div class="party-name">${emp.nombre || 'ONESEVEN IA'}</div>
        <div class="party-detail">
          ${emp.cif ? `CIF: ${emp.cif}<br>` : ''}
          ${empDireccion ? `${empDireccion}<br>` : ''}
          ${emp.telefono ? `Tel: ${emp.telefono}<br>` : ''}
          ${respEmail}
        </div>
      </div>
      <div class="party">
        <div class="party-label">Destinatario</div>
        <div class="party-name">${cliente?.nombre || '&mdash;'}</div>
        <div class="party-detail">
          ${cliente?.empresa ? `${cliente.empresa}<br>` : ''}
          ${cliente?.cif ? `CIF/NIF: ${cliente.cif}<br>` : ''}
          ${cliente?.email ? `${cliente.email}<br>` : ''}
          ${cliente?.telefono ? `Tel: ${cliente.telefono}` : ''}
        </div>
      </div>
    </div>
  </div>

  ${p.intro ? `<div class="section"><p style="font-size:13px;color:#555;line-height:1.8;background:#fafafa;padding:14px;border-radius:6px;border:1px solid #eee">${p.intro}</p></div>` : ''}

  <div class="section">
    <div class="st">Detalle de servicios</div>
    <table>
      <thead><tr><th>Descripcion</th><th class="tc" style="width:60px">Uds</th><th style="text-align:right;width:110px">Precio/ud</th><th style="text-align:right;width:120px">Importe</th></tr></thead>
      <tbody>
        ${items.map(it => {
          const cant = parseFloat(it.cantidad) || 1
          const pu = parseFloat(it.precio_unit) || 0
          return `<tr><td><div class="in">${it.descripcion}</div>${it.detalle ? `<div class="id">${it.detalle}</div>` : ''}</td><td class="tc">${cant}</td><td class="ip">${formatEur(pu)}</td><td class="ip">${formatEur(cant * pu)}</td></tr>`
        }).join('')}
      </tbody>
    </table>
    <div class="totals-box">
      ${parseFloat(p.descuento) > 0 ? `
        <div class="t-row"><span>Subtotal</span><span>${formatEur(subtotal)}</span></div>
        <div class="t-row desc-row"><span>Descuento (${p.descuento}%)</span><span>-${formatEur(desc)}</span></div>
        <div class="t-row"><span>Base imponible</span><span>${formatEur(base)}</span></div>
      ` : `<div class="t-row"><span>Base imponible</span><span>${formatEur(base)}</span></div>`}
      <div class="t-row"><span>IVA (${p.iva || 21}%)</span><span>${formatEur(ivaAmt)}</span></div>
      <div class="t-row total-row"><span>TOTAL</span><span>${formatEur(total)}</span></div>
    </div>
    ${emp.iban ? `<div class="iban-box">Datos bancarios para el pago &mdash; ${emp.iban}${emp.banco ? ' &mdash; ' + emp.banco : ''}</div>` : ''}
  </div>

  ${tieneMant ? `
  <div class="section" style="margin-top:8px">
    <div class="st">Mantenimiento mensual</div>
    <table>
      <thead><tr>
        <th style="width:55%">Descripcion</th>
        <th class="tc" style="width:15%">Frecuencia</th>
        <th style="text-align:right;width:15%">Base</th>
        <th style="text-align:right;width:15%">Total/mes</th>
      </tr></thead>
      <tbody>
        <tr>
          <td>
            <div class="in">${mant.descripcion || 'Mantenimiento y soporte mensual'}</div>
            ${mant.detalle ? `<div class="id">${mant.detalle}</div>` : ''}
          </td>
          <td class="tc"><span style="background:#f0f0ff;color:#6366f1;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">Mensual</span></td>
          <td class="ip">${formatEur(mantBase)}</td>
          <td class="ip">${formatEur(mantTotal)}</td>
        </tr>
      </tbody>
    </table>
    <div class="totals-box">
      <div class="t-row"><span>Base mantenimiento/mes</span><span>${formatEur(mantBase)}</span></div>
      ${mant.con_iva ? `<div class="t-row"><span>IVA (${p.iva || 21}%)</span><span>${formatEur(mantIvaAmt)}</span></div>` : '<div class="t-row"><span>IVA</span><span>Exento</span></div>'}
      <div class="t-row total-row"><span>TOTAL MENSUAL</span><span>${formatEur(mantTotal)}</span></div>
    </div>
    <div style="margin-top:10px;padding:10px 14px;background:#f0f8ff;border-radius:8px;border-left:3px solid #6366f1;font-size:12px;color:#555;line-height:1.7">
      El mantenimiento se factura mensualmente a partir de la entrega del proyecto.${mant.notas ? ' ' + mant.notas : ''}
    </div>
  </div>` : ''}

  ${p.condiciones ? `<div class="section"><div class="st">Condiciones</div><div class="cond-box">${p.condiciones}</div></div>` : ''}
  ${emp.nota_pie ? `<div class="section"><p style="font-size:11px;color:#888;text-align:center">${emp.nota_pie}</p></div>` : ''}

</div>
<div class="footer">
  <div class="footer-left"><div>${emp.nombre || 'ONESEVEN IA'}</div><div>${emp.web || 'onesevenia.com'}</div>${emp.cif ? `<div>CIF: ${emp.cif}</div>` : ''}</div>
  <div class="footer-right"><div>${respNombre}</div><div>${respEmail}</div></div>
</div>
</div></div></body></html>`
}

function imgToBase64InPage(url) {
  return new Promise((resolve) => {
    if (!url) { resolve(null); return }
    // Create image in current page context (not new window)
    const img = document.createElement('img')
    img.crossOrigin = 'use-credentials'
    img.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px'
    document.body.appendChild(img)
    
    const cleanup = () => { try { document.body.removeChild(img) } catch {} }
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || 200
        canvas.height = img.naturalHeight || 60
        canvas.getContext('2d').drawImage(img, 0, 0)
        cleanup()
        resolve(canvas.toDataURL('image/png'))
      } catch {
        cleanup()
        resolve(url) // fallback: use URL directly
      }
    }
    img.onerror = () => { 
      cleanup()
      // Try without crossOrigin
      const img2 = new Image()
      img2.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img2.naturalWidth || 200
          canvas.height = img2.naturalHeight || 60
          canvas.getContext('2d').drawImage(img2, 0, 0)
          resolve(canvas.toDataURL('image/png'))
        } catch { resolve(url) }
      }
      img2.onerror = () => resolve(url)
      img2.src = url
    }
    img.src = url
  })
}

async function imgToBase64(url) {
  return imgToBase64InPage(url)
}

async function abrirPresupuesto({ p, cliente, empresa }) {
  // Use stored base64 if available (no CORS issues), otherwise try to convert
  let logoData = empresa?.logo_base64 || null
  if (!logoData) {
    const logoUrl = empresa?.logo_url || 'https://onesevenia.com/lovable-uploads/20e6c263-0631-43ca-acf0-a255777708ba.png'
    logoData = await imgToBase64(logoUrl)
  }
  const empresaConLogo = { ...empresa, logo_url: logoData }
  const win = window.open('', '_blank')
  win.document.write(generarHTMLPresupuesto({ p, cliente, empresa: empresaConLogo }))
  win.document.close()
}

// ─── Modal datos empresa ──────────────────────────────────────────────────────
function ModalEmpresa({ config, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: '', cif: '', direccion: '', ciudad: '', cp: '', pais: 'España',
    telefono: '', email: '', web: '', iban: '', banco: '', nota_pie: '',
    logo_url: 'https://onesevenia.com/lovable-uploads/20e6c263-0631-43ca-acf0-a255777708ba.png',
    ...config,
  })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 600, border: '1px solid var(--border)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg1)', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text0)' }}>Datos de mi empresa</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Aparecen en todos los presupuestos generados</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}><CloseIcon /></button>
        </div>
        <div style={{ padding: '20px' }}>
          {/* Datos principales */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Identificacion</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group"><label className="form-label">Nombre empresa *</label><input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="ONESEVEN IA S.L." /></div>
            <div className="form-group"><label className="form-label">CIF / NIF</label><input className="form-input" value={form.cif} onChange={e => set('cif', e.target.value)} placeholder="B12345678" /></div>
          </div>

          {/* Direccion */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12, marginTop: 4 }}>Direccion</div>
          <div className="form-group"><label className="form-label">Direccion</label><input className="form-input" value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Calle Ejemplo 123, 1A" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '0 12px' }}>
            <div className="form-group"><label className="form-label">CP</label><input className="form-input" value={form.cp} onChange={e => set('cp', e.target.value)} placeholder="28001" /></div>
            <div className="form-group"><label className="form-label">Ciudad</label><input className="form-input" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder="Madrid" /></div>
            <div className="form-group"><label className="form-label">Pais</label><input className="form-input" value={form.pais} onChange={e => set('pais', e.target.value)} placeholder="España" /></div>
          </div>

          {/* Contacto */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12, marginTop: 4 }}>Contacto</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
            <div className="form-group"><label className="form-label">Telefono</label><input className="form-input" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+34 600 000 000" /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="pablo@onesevenia.com" /></div>
            <div className="form-group"><label className="form-label">Web</label><input className="form-input" value={form.web} onChange={e => set('web', e.target.value)} placeholder="onesevenia.com" /></div>
          </div>

          {/* Banco */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12, marginTop: 4 }}>Datos bancarios</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0 12px' }}>
            <div className="form-group"><label className="form-label">IBAN</label><input className="form-input" value={form.iban} onChange={e => set('iban', e.target.value)} placeholder="ES00 0000 0000 0000 0000 0000" /></div>
            <div className="form-group"><label className="form-label">Banco</label><input className="form-input" value={form.banco} onChange={e => set('banco', e.target.value)} placeholder="Banco Sabadell" /></div>
          </div>

          {/* Extra */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12, marginTop: 4 }}>Extras PDF</div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Nota al pie del PDF <span style={{ fontSize: 10, color: 'var(--text3)' }}>(opcional)</span></label>
            <input className="form-input" value={form.nota_pie} onChange={e => set('nota_pie', e.target.value)} placeholder="Ej: Sujeto a retencion de IRPF del 15%" />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar datos empresa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Formulario presupuesto ───────────────────────────────────────────────────
function FormularioPresupuesto({ presupuesto, clientes, onSave, onCancel }) {
  const isEdit = !!presupuesto?.id
  const defaultItems = [{ descripcion: '', detalle: '', cantidad: '1', precio_unit: '' }]
  const [form, setForm] = useState({
    cliente_id: '', titulo: 'Presupuesto de servicios',
    fecha: new Date().toISOString().split('T')[0], validez: '15',
    intro: '',
    condiciones: 'El presupuesto tiene una validez de 15 dias naturales desde su emision.\n\nEl 50% del importe se abona al inicio del proyecto y el 50% restante a la entrega.\n\nPrecios sin IVA. IVA aplicable segun normativa vigente.',
    responsable: 'pablo', estado: 'borrador', descuento: '0', iva: '21',
    ...presupuesto,
    items: presupuesto?.items?.length ? presupuesto.items : defaultItems,
    mantenimiento: presupuesto?.mantenimiento || { activo: false, descripcion: 'Mantenimiento y soporte mensual', detalle: '', precio: '', con_iva: true, notas: '' },
  })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const addItem = () => set('items', [...form.items, { descripcion: '', detalle: '', cantidad: '1', precio_unit: '' }])
  const removeItem = (i) => set('items', form.items.filter((_, idx) => idx !== i))
  const updateItem = (i, k, v) => set('items', form.items.map((item, idx) => idx === i ? { ...item, [k]: v } : item))
  const { subtotal, desc, base, ivaAmt, total, mantBase, mantIvaAmt, mantTotal } = calcTotales({ items: form.items, descuento: form.descuento, iva: form.iva, mantenimiento: form.mantenimiento })
  const setMant = (k, v) => set('mantenimiento', { ...form.mantenimiento, [k]: v })
  const tieneMantActivo = form.mantenimiento?.activo && parseFloat(form.mantenimiento?.precio) > 0

  // Cliente seleccionado para mostrar datos
  const clienteSeleccionado = clientes.find(c => c.id === form.cliente_id)

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
          {isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}
        </div>

        {/* Selector cliente con datos autorellenados */}
        <div className="form-group">
          <label className="form-label">Cliente *</label>
          <select className="form-select" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}>
            <option value="">Seleccionar cliente...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` · ${c.empresa}` : ''}</option>)}
          </select>
        </div>

        {/* Datos del cliente autorellenados */}
        {clienteSeleccionado && (
          <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', marginBottom: 14, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text0)' }}>{clienteSeleccionado.nombre}</span>
            {clienteSeleccionado.empresa && <span>{clienteSeleccionado.empresa}</span>}
            {clienteSeleccionado.cif && <span style={{ color: 'var(--accent2)' }}>CIF/NIF: {clienteSeleccionado.cif}</span>}
            {clienteSeleccionado.email && <span>{clienteSeleccionado.email}</span>}
            {clienteSeleccionado.telefono && <span>{clienteSeleccionado.telefono}</span>}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Titulo del presupuesto</label>
          <input className="form-input" value={form.titulo} onChange={e => set('titulo', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '0 12px' }}>
          <div className="form-group"><label className="form-label">Fecha</label><input className="form-input" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Validez (dias)</label><input className="form-input" type="number" value={form.validez} onChange={e => set('validez', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">IVA (%)</label><input className="form-input" type="number" step="any" value={form.iva} onChange={e => set('iva', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Descuento (%)</label><input className="form-input" type="number" step="any" value={form.descuento} onChange={e => set('descuento', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Estado</label><select className="form-select" value={form.estado} onChange={e => set('estado', e.target.value)}>{Object.entries(ESTADO_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Responsable</label><select className="form-select" value={form.responsable} onChange={e => set('responsable', e.target.value)}><option value="pablo">Pablo Puado</option><option value="alberto">Alberto</option></select></div>
        </div>
        <div className="form-group" style={{ marginBottom: 0, marginTop: 12 }}>
          <label className="form-label">Descripcion del proyecto <span style={{ fontSize: 10, color: 'var(--text3)' }}>(opcional)</span></label>
          <textarea className="form-textarea" value={form.intro} onChange={e => set('intro', e.target.value)} placeholder="Describe brevemente el alcance del proyecto..." style={{ minHeight: 70 }} />
        </div>
      </div>

      {/* Lineas */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Lineas del presupuesto</div>
          <button className="btn btn-ghost btn-sm" onClick={addItem}>+ Anadir linea</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 70px 120px 32px', gap: '0 8px', marginBottom: 6 }}>
          <label className="form-label">Descripcion</label>
          <label className="form-label">Detalle</label>
          <label className="form-label">Uds</label>
          <label className="form-label">Precio/ud (EUR)</label>
          <div />
        </div>
        {form.items.map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 70px 120px 32px', gap: '0 8px', marginBottom: 7, alignItems: 'center' }}>
            <input className="form-input" value={item.descripcion} onChange={e => updateItem(i, 'descripcion', e.target.value)} placeholder="Nombre del servicio" />
            <input className="form-input" value={item.detalle || ''} onChange={e => updateItem(i, 'detalle', e.target.value)} placeholder="Detalle adicional" />
            <input className="form-input" type="number" step="1" min="1" value={item.cantidad || '1'} onChange={e => updateItem(i, 'cantidad', e.target.value)} />
            <input className="form-input" type="text" inputMode="decimal" value={item.precio_unit || ''} onChange={e => updateItem(i, 'precio_unit', e.target.value)} placeholder="0.00" />
            <button className="btn-icon" style={{ width: 32, height: 36, color: 'var(--red)' }} onClick={() => form.items.length > 1 && removeItem(i)}><TrashIcon /></button>
          </div>
        ))}
        <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{ maxWidth: 280, marginLeft: 'auto' }}>
            {[
              { label: 'Subtotal', value: subtotal, show: parseFloat(form.descuento) > 0 },
              { label: `Descuento (${form.descuento}%)`, value: -desc, show: parseFloat(form.descuento) > 0, color: 'var(--red)' },
              { label: 'Base imponible', value: base, show: true },
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

      {/* Mantenimiento mensual */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.mantenimiento?.activo ? 14 : 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Mantenimiento mensual
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: form.mantenimiento?.activo ? 'var(--accent2)' : 'var(--text3)' }}>
            <div
              onClick={() => setMant('activo', !form.mantenimiento?.activo)}
              style={{ width: 40, height: 22, borderRadius: 11, background: form.mantenimiento?.activo ? 'var(--accent)' : 'var(--bg4)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <div style={{ position: 'absolute', top: 3, left: form.mantenimiento?.activo ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
            </div>
            {form.mantenimiento?.activo ? 'Incluido en presupuesto' : 'No incluir'}
          </label>
        </div>

        {form.mantenimiento?.activo && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr', gap: '0 12px' }}>
              <div className="form-group">
                <label className="form-label">Descripción del mantenimiento</label>
                <input className="form-input" value={form.mantenimiento?.descripcion || ''} onChange={e => setMant('descripcion', e.target.value)} placeholder="Mantenimiento y soporte mensual" />
              </div>
              <div className="form-group">
                <label className="form-label">Detalle <span style={{ fontSize: 10, color: 'var(--text3)' }}>(opcional)</span></label>
                <input className="form-input" value={form.mantenimiento?.detalle || ''} onChange={e => setMant('detalle', e.target.value)} placeholder="Actualizaciones, soporte técnico, hosting..." />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px', alignItems: 'end' }}>
              <div className="form-group">
                <label className="form-label">Precio mensual (€, sin IVA)</label>
                <input className="form-input" type="text" inputMode="decimal" value={form.mantenimiento?.precio || ''} onChange={e => setMant('precio', e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group" style={{ paddingTop: 8 }}>
                <label className="form-label">¿Incluye IVA?</label>
                <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
                  {[{ v: true, label: 'Con IVA' }, { v: false, label: 'Sin IVA' }].map(opt => (
                    <button key={String(opt.v)} onClick={() => setMant('con_iva', opt.v)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${form.mantenimiento?.con_iva === opt.v ? 'var(--accent)' : 'var(--border2)'}`, background: form.mantenimiento?.con_iva === opt.v ? 'var(--accent-dim)' : 'none', color: form.mantenimiento?.con_iva === opt.v ? 'var(--accent2)' : 'var(--text3)', cursor: 'pointer', fontSize: 12, fontWeight: form.mantenimiento?.con_iva === opt.v ? 600 : 400 }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Preview en tiempo real */}
              {parseFloat(form.mantenimiento?.precio) > 0 && (
                <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Total mensual</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent2)' }}>{formatEur(mantTotal)}</div>
                  {form.mantenimiento?.con_iva && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Base: {formatEur(mantBase)} + IVA {form.iva}%: {formatEur(mantIvaAmt)}</div>}
                </div>
              )}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notas sobre el mantenimiento <span style={{ fontSize: 10, color: 'var(--text3)' }}>(opcional)</span></label>
              <input className="form-input" value={form.mantenimiento?.notas || ''} onChange={e => setMant('notas', e.target.value)} placeholder="Condiciones, incluye..." />
            </div>
          </>
        )}
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
function ModalEnvio({ presupuesto, cliente, empresa, onClose, onEnviado }) {
  const [copied, setCopied] = useState(false)
  const { subtotal, desc, base, ivaAmt, total } = calcTotales({ items: presupuesto.items, descuento: presupuesto.descuento, iva: presupuesto.iva })
  const respNombre = presupuesto.responsable === 'pablo' ? 'Pablo Puado' : 'Alberto'
  const respEmail = presupuesto.responsable === 'pablo' ? (empresa?.email || 'pablo@onesevenia.com') : 'alberto@onesevenia.com'
  const ref = `PRES-${new Date(presupuesto.fecha || presupuesto.created_at).getFullYear()}-${presupuesto.id?.slice(-3).toUpperCase() || '000'}`

  const msgWA = `Hola ${cliente?.nombre?.split(' ')[0] || ''}!

Te envio el presupuesto "${presupuesto.titulo}" (${ref}) de ${empresa?.nombre || 'ONESEVEN IA'}.

Detalle:
${(presupuesto.items || []).filter(it => it.descripcion).map(it => `- ${it.descripcion}: ${formatEur((parseFloat(it.cantidad)||1)*(parseFloat(it.precio_unit)||0))}`).join('\n')}

Base imponible: ${formatEur(base)}
IVA (${presupuesto.iva || 21}%): ${formatEur(ivaAmt)}
Total: ${formatEur(total)}

Valido ${presupuesto.validez || 15} dias.

${empresa?.nombre || 'ONESEVEN IA'} - ${empresa?.web || 'onesevenia.com'}`

  const asunto = `Presupuesto ${ref} - ${presupuesto.titulo}`
  const msgEmail = `Hola ${cliente?.nombre?.split(' ')[0] || ''},\n\nAdjunto el presupuesto ${ref}.\n\nBase imponible: ${formatEur(base)}\nIVA (${presupuesto.iva || 21}%): ${formatEur(ivaAmt)}\nTotal: ${formatEur(total)}\n\nValido durante ${presupuesto.validez || 15} dias.\n\n${respNombre}\n${empresa?.nombre || 'ONESEVEN IA'} - ${respEmail}`

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
          <button onClick={async () => { await abrirPresupuesto({ p: presupuesto, cliente, empresa }) }} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent2)', flexShrink: 0 }}><DownloadIcon /></div>
            <div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>Ver presupuesto PDF</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>Abre el PDF con datos completos · guarda desde la ventana</div></div>
          </button>
          {cliente?.telefono && (
            <div style={{ borderRadius: 12, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.05)', overflow: 'hidden' }}>
              <button onClick={() => { window.open(`https://wa.me/${cliente.telefono.replace(/\D/g,'')}?text=${encodeURIComponent(msgWA)}`, '_blank'); onEnviado('wa') }} style={{ width: '100%', padding: '14px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25d366', flexShrink: 0 }}><WAIcon /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>WhatsApp</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{cliente.telefono}</div></div>
                <span style={{ fontSize: 18, color: '#25d366' }}>›</span>
              </button>
              <div style={{ margin: '0 14px 6px', padding: 10, background: 'var(--bg3)', borderRadius: 8, fontSize: 11, color: 'var(--text2)', whiteSpace: 'pre-wrap', maxHeight: 100, overflowY: 'auto' }}>{msgWA}</div>
              <div style={{ padding: '0 14px 12px' }}><button onClick={() => copiar(msgWA)} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border2)', background: 'none', color: 'var(--text2)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><CopyIcon /> {copied ? 'Copiado' : 'Copiar mensaje'}</button></div>
            </div>
          )}
          {cliente?.email && (
            <div style={{ borderRadius: 12, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)', overflow: 'hidden' }}>
              <button onClick={() => { window.open(`https://mail.google.com/mail/?view=cm&fs=1&from=${encodeURIComponent(respEmail)}&to=${encodeURIComponent(cliente.email)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(msgEmail)}`, '_blank'); onEnviado('email') }} style={{ width: '100%', padding: '14px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent2)', flexShrink: 0 }}><MailIcon /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>Gmail</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{cliente.email}</div></div>
                <span style={{ fontSize: 18, color: 'var(--accent2)' }}>›</span>
              </button>
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
  const { presupuestos, crear, actualizar, eliminar, fetch } = usePresupuestos()
  const { config: empresa, guardar: guardarEmpresa } = useEmpresaConfig()
  const [vista, setVista] = useState('lista')
  const [editando, setEditando] = useState(null)
  const [enviando, setEnviando] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showEmpresa, setShowEmpresa] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const filtrados = useMemo(() => {
    let lista = [...presupuestos]
    if (busqueda) { const q = busqueda.toLowerCase(); lista = lista.filter(p => [p.titulo, p.clientes?.nombre, p.clientes?.empresa].some(f => f?.toLowerCase().includes(q))) }
    if (filtroEstado) lista = lista.filter(p => p.estado === filtroEstado)
    return lista
  }, [presupuestos, busqueda, filtroEstado])

  const handleSave = async (form) => {
    const data = {
      cliente_id: form.cliente_id || null,
      titulo: form.titulo,
      fecha: form.fecha,
      validez: form.validez,
      intro: form.intro || null,
      items: form.items.filter(it => it.descripcion),
      descuento: form.descuento,
      iva: form.iva,
      condiciones: form.condiciones,
      responsable: form.responsable,
      estado: form.estado,
      mantenimiento: form.mantenimiento || { activo: false },
    }
    console.log('[Presupuestos] Saving:', editando?.id ? 'UPDATE' : 'CREATE', data)
    let result
    if (editando?.id) {
      result = await actualizar(editando.id, data)
    } else {
      result = await crear(data)
    }
    console.log('[Presupuestos] Result:', result)
    if (result?.error) {
      alert('Error al guardar: ' + (result.error.message || JSON.stringify(result.error)))
      return
    }
    setVista('lista')
    setEditando(null)
  }

  const handleEnviado = async (tipo) => {
    if (enviando?.id) {
      await actualizar(enviando.id, tipo === 'wa'
        ? { enviado_wa: true, estado: 'enviado', fecha_envio: new Date().toISOString() }
        : { enviado_email: true, estado: 'enviado', fecha_envio: new Date().toISOString() })
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
        <div style={{ maxWidth: 820 }}>
          <FormularioPresupuesto presupuesto={editando} clientes={clientes} onSave={handleSave} onCancel={() => { setVista('lista'); setEditando(null) }} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Presupuestos" subtitle={`${filtrados.length} presupuesto${filtrados.length !== 1 ? 's' : ''}`} actions={
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowEmpresa(true)} style={{ gap: 5 }}>
          <SettingsIcon /> Mi empresa
        </button>
        <button className="btn btn-primary" onClick={() => { setEditando(null); setVista('form') }}><PlusIcon /> Nuevo presupuesto</button>
      </div>
    }>
      {/* Aviso si no hay datos empresa */}
      {empresa && !empresa.cif && !empresa.direccion && (
        <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--amber)' }}>Completa los datos de tu empresa para que aparezcan en los PDFs</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowEmpresa(true)}>Configurar</button>
        </div>
      )}

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
                    {cliente?.cif && <span style={{ color: 'var(--accent2)' }}>CIF: {cliente.cif}</span>}
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
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--text2)' }} onClick={async () => { await abrirPresupuesto({ p, cliente, empresa }) }}><DownloadIcon /></button>
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--text2)' }} onClick={async () => { await fetch(); setEditando(presupuestos.find(x => x.id === p.id) || p); setVista('form') }}><EditIcon /></button>
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--text2)' }} onClick={async () => { const { id, created_at, enviado_wa, enviado_email, fecha_envio, ...d } = p; await crear({ ...d, titulo: p.titulo + ' (copia)', estado: 'borrador', fecha: new Date().toISOString().split('T')[0] }) }}><CopyIcon /></button>
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--red)' }} onClick={() => setConfirmDelete(p)}><TrashIcon /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {enviando && <ModalEnvio presupuesto={enviando} cliente={clientes.find(c => c.id === enviando.cliente_id) || enviando.clientes} empresa={empresa} onClose={() => setEnviando(null)} onEnviado={handleEnviado} />}
      {showEmpresa && <ModalEmpresa config={empresa} onClose={() => setShowEmpresa(false)} onSave={guardarEmpresa} />}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: '28px', maxWidth: 380, width: '100%', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)', marginBottom: 8 }}>Eliminar "{confirmDelete.titulo}"?</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>Esta accion no se puede deshacer.</div>
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
