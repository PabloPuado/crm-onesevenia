import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useSubcontrataciones, useClientes, useEmpresaConfig } from '../hooks/useData'
import { formatEur, formatDate } from '../lib/constants'

// Icons
function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg> }
function EditIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2l2 2-7 7H2V9L9 2z"/></svg> }
function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h9M5 3V2h3v1M3 3l.5 8h6l.5-8"/></svg> }
function DocIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L8 1z"/><path d="M8 1v4h4"/></svg> }
function WAIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> }
function MailIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 3l6 5 6-5"/><rect x="1" y="2" width="12" height="10" rx="1"/></svg> }
function CloseIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg> }
function StarIcon({ filled }) { return <svg width="14" height="14" viewBox="0 0 14 14" fill={filled ? 'var(--amber)' : 'none'} stroke="var(--amber)" strokeWidth="1.3"><path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z"/></svg> }
function ChevronIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6l3 3 3-3"/></svg> }

const ESTADOS = {
  pendiente_firma: { label: 'Pendiente firma', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  en_desarrollo: { label: 'En desarrollo', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  entregado: { label: 'Entregado', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  revisando: { label: 'En revision', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  aprobado: { label: 'Aprobado', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  pagado: { label: 'Pagado', color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  cancelado: { label: 'Cancelado', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
}

const FORMAS_PAGO = ['Transferencia', 'PayPal', 'Bizum', 'Efectivo', 'Crypto', 'Otro']
const ESPECIALIDADES = ['Frontend', 'Backend', 'Full Stack', 'Mobile', 'IA / ML', 'Diseño UI/UX', 'DevOps', 'QA / Testing', 'Otro']

const fmt2 = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(parseFloat(n) || 0)

// ─── Generador contrato HTML ──────────────────────────────────────────────────
function generarContrato({ s, empresa }) {
  const emp = empresa || {}
  const empNombre = emp.nombre || 'ONESEVEN IA'
  const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  const margen = (parseFloat(s.presupuesto_cliente) || 0) - (parseFloat(s.pago_desarrollador) || 0)

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Contrato de Colaboracion - ${s.dev_nombre}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Georgia', serif; color: #1a1a2e; background: #fff; font-size: 13px; line-height: 1.8; }
.topbar { position: fixed; top: 0; left: 0; right: 0; background: #1a1a2e; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; z-index: 100; gap: 8px; }
.back-btn { background: rgba(255,255,255,.1); color: white; border: none; padding: 8px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: inherit; }
.save-btn { background: #6366f1; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
.topbar-title { color: rgba(255,255,255,.7); font-size: 12px; flex: 1; text-align: center; }
.wrapper { padding-top: 52px; }
.page { max-width: 794px; margin: 0 auto; padding: 48px 64px; }
.header { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 3px solid #1a1a2e; }
.header img { height: 40px; margin-bottom: 14px; display: block; margin-left: auto; margin-right: auto; }
h1 { font-size: 20px; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 6px; }
.subtitle { font-size: 12px; color: #666; letter-spacing: .06em; }
.ref { display: inline-block; background: #f0f0ff; border: 1px solid #6366f1; color: #6366f1; padding: 3px 10px; border-radius: 20px; font-size: 11px; margin-top: 8px; font-family: monospace; }
.parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 28px 0; }
.party { background: #f8f8ff; border-radius: 8px; padding: 18px; border-left: 3px solid #6366f1; }
.party-title { font-size: 10px; font-weight: bold; letter-spacing: .1em; text-transform: uppercase; color: #6366f1; margin-bottom: 10px; }
.party-name { font-size: 15px; font-weight: bold; margin-bottom: 6px; }
.party-detail { font-size: 12px; color: #555; line-height: 1.9; }
.clause { margin-bottom: 24px; }
.clause-title { font-size: 12px; font-weight: bold; letter-spacing: .06em; text-transform: uppercase; color: #1a1a2e; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e0e0f0; }
.clause-body { font-size: 13px; color: #333; text-align: justify; }
.highlight-box { background: #f0f0ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
.highlight-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; border-bottom: 1px solid #e0e8ff; }
.highlight-row:last-child { border-bottom: none; font-weight: bold; font-size: 14px; padding-top: 8px; }
.signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; }
.sig-box { border-top: 1px solid #333; padding-top: 12px; }
.sig-title { font-size: 11px; color: #666; letter-spacing: .06em; margin-bottom: 4px; }
.sig-name { font-size: 13px; font-weight: bold; }
.sig-detail { font-size: 11px; color: #888; }
.sig-line { height: 60px; border-bottom: 1px dashed #aaa; margin: 16px 0 8px; }
.date-place { font-size: 12px; color: #555; text-align: center; margin-top: 30px; }
.footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #888; text-align: center; line-height: 1.8; }
@media print { .topbar { display: none; } .wrapper { padding-top: 0; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } @page { margin: 1.5cm; size: A4; } }
</style></head>
<body>
<div class="topbar">
  <button class="back-btn" onclick="window.close()">&#8592; Cerrar</button>
  <span class="topbar-title">Contrato — ${s.dev_nombre} / ${s.nombre_proyecto}</span>
  <button class="save-btn" onclick="window.print()">Guardar PDF</button>
</div>
<div class="wrapper"><div class="page">

<div class="header">
  <img src="${emp.logo_url || 'https://onesevenia.com/lovable-uploads/20e6c263-0631-43ca-acf0-a255777708ba.png'}" alt="${empNombre}" onerror="this.style.display='none'">
  <h1>Contrato de Colaboracion</h1>
  <div class="subtitle">Acuerdo de prestacion de servicios de desarrollo</div>
  <div class="ref">REF: CLAB-${new Date().getFullYear()}-${s.id?.slice(-4).toUpperCase() || '0000'}</div>
</div>

<div class="clause">
  <div class="clause-title">Reunidos</div>
  <div class="parties">
    <div class="party">
      <div class="party-title">La Empresa (Contratante)</div>
      <div class="party-name">${empNombre}</div>
      <div class="party-detail">
        ${emp.cif ? `CIF: ${emp.cif}<br>` : ''}
        ${emp.direccion ? `${emp.direccion}<br>` : ''}
        ${emp.ciudad ? `${emp.ciudad}<br>` : ''}
        ${emp.email || 'pablo@onesevenia.com'}<br>
        ${emp.web || 'onesevenia.com'}
      </div>
    </div>
    <div class="party">
      <div class="party-title">El Colaborador (Contratado)</div>
      <div class="party-name">${s.dev_nombre}</div>
      <div class="party-detail">
        ${s.dev_nif ? `NIF/CIF: ${s.dev_nif}<br>` : ''}
        ${s.dev_especialidad ? `Especialidad: ${s.dev_especialidad}<br>` : ''}
        ${s.dev_email ? `${s.dev_email}<br>` : ''}
        ${s.dev_telefono ? `Tel: ${s.dev_telefono}` : ''}
      </div>
    </div>
  </div>
  <div class="clause-body">
    Ambas partes se reconocen mutuamente capacidad juridica y de obrar suficiente para el otorgamiento del presente contrato de colaboracion y, al efecto, libremente convienen en suscribir el presente acuerdo con fecha ${today}.
  </div>
</div>

<div class="clause">
  <div class="clause-title">Primera — Objeto del Contrato</div>
  <div class="clause-body">
    El Colaborador prestara sus servicios profesionales a ${empNombre} para el desarrollo del siguiente proyecto:<br><br>
    <strong>Proyecto: ${s.nombre_proyecto}</strong><br>
    ${s.cliente_nombre ? `Cliente final: ${s.cliente_nombre}<br>` : ''}
    ${s.descripcion ? `<br>Alcance: ${s.descripcion}` : ''}
    ${s.tipo_contrato === 'por_horas' ? `<br><br>Modalidad: Precio por horas. Horas estimadas: ${s.horas_estimadas || 'A determinar'} horas a ${fmt2(s.precio_hora)}/hora.` : '<br><br>Modalidad: Precio fijo segun el importe acordado en la clausula economica.'}
  </div>
</div>

<div class="clause">
  <div class="clause-title">Segunda — Condiciones Economicas</div>
  <div class="clause-body">
    Por la realizacion de los trabajos descritos, ${empNombre} abonara al Colaborador el importe acordado segun las siguientes condiciones:
    <div class="highlight-box">
      <div class="highlight-row"><span>Importe acordado (sin IVA)</span><span>${fmt2(s.pago_desarrollador)}</span></div>
      <div class="highlight-row"><span>Forma de pago</span><span>${s.forma_pago || 'Transferencia bancaria'}</span></div>
      ${s.dev_iban ? `<div class="highlight-row"><span>IBAN</span><span>${s.dev_iban}</span></div>` : ''}
      ${s.fecha_pago ? `<div class="highlight-row"><span>Fecha de pago</span><span>${formatDate(s.fecha_pago)}</span></div>` : ''}
      <div class="highlight-row"><span><strong>TOTAL A PERCIBIR</strong></span><span><strong>${fmt2(s.pago_desarrollador)}</strong></span></div>
    </div>
    El pago se realizara mediante ${s.forma_pago || 'transferencia bancaria'} una vez verificada la entrega satisfactoria del proyecto.
    ${s.tipo_contrato === 'hitos' ? 'El pago podra fraccionarse en funcion de los hitos acordados.' : ''}
  </div>
</div>

<div class="clause">
  <div class="clause-title">Tercera — Plazos de Entrega</div>
  <div class="clause-body">
    ${s.fecha_inicio ? `Fecha de inicio: <strong>${formatDate(s.fecha_inicio)}</strong><br>` : ''}
    ${s.fecha_entrega_estimada ? `Fecha de entrega estimada: <strong>${formatDate(s.fecha_entrega_estimada)}</strong><br><br>` : ''}
    El Colaborador se compromete a entregar el trabajo en los plazos acordados. En caso de retraso imputable al Colaborador superior a 7 dias habiles sin causa justificada, ${empNombre} podra aplicar una penalizacion del 5% del importe total por cada semana de retraso, hasta un maximo del 20% del importe.
  </div>
</div>

<div class="clause">
  <div class="clause-title">Cuarta — Propiedad Intelectual</div>
  <div class="clause-body">
    Todos los trabajos, desarrollos, codigos fuente, disenos, documentacion y cualquier otro material creado por el Colaborador en el marco del presente contrato seran propiedad exclusiva de ${empNombre} y/o de su cliente final, quedando el Colaborador sin ningun derecho de uso, reproduccion o comercializacion de los mismos una vez abonado el importe acordado.
    El Colaborador cede expresamente todos los derechos de explotacion sobre las obras creadas en el presente encargo.
  </div>
</div>

<div class="clause">
  <div class="clause-title">Quinta — Confidencialidad</div>
  <div class="clause-body">
    El Colaborador se compromete a mantener en estricta confidencialidad toda la informacion a la que tenga acceso en virtud de la presente colaboracion, incluyendo pero no limitandose a: datos del cliente final, estrategia de negocio, precios, tecnologia propietaria y cualquier otro dato de caracter sensible.<br><br>
    Esta obligacion de confidencialidad se mantendra vigente durante la duracion del contrato y durante los <strong>2 anos siguientes</strong> a su finalizacion, independientemente de la causa de terminacion.
    El incumplimiento de esta clausula podra dar lugar a acciones legales y reclamacion de danos y perjuicios.
  </div>
</div>

<div class="clause">
  <div class="clause-title">Sexta — Exclusividad y Conflicto de Intereses</div>
  <div class="clause-body">
    El Colaborador declara no tener vinculacion directa con el cliente final del proyecto. Asimismo, se compromete a no contactar directamente con el cliente final durante el periodo de colaboracion ni en los 12 meses posteriores a la finalizacion del contrato, salvo autorizacion expresa y por escrito de ${empNombre}.
    El incumplimiento de esta clausula se considerara una falta grave y dara derecho a ${empNombre} a reclamar el importe integro del proyecto como indemnizacion por danos.
  </div>
</div>

<div class="clause">
  <div class="clause-title">Septima — Independencia Profesional</div>
  <div class="clause-body">
    Las partes reconocen expresamente que el Colaborador actua como profesional independiente (autonomo o empresa), siendo responsable del cumplimiento de sus obligaciones fiscales y de Seguridad Social. No existe vinculo laboral de ningun tipo entre las partes, siendo el presente contrato de naturaleza mercantil.
    El Colaborador debera aportar factura por los servicios prestados antes de proceder al pago acordado.
  </div>
</div>

<div class="clause">
  <div class="clause-title">Octava — Resolucion del Contrato</div>
  <div class="clause-body">
    Cualquiera de las partes podra resolver el presente contrato mediante comunicacion escrita con un preaviso minimo de 5 dias habiles. En caso de resolucion anticipada por causa imputable al Colaborador, este debera reintegrar los importes percibidos proporcionales al trabajo no entregado. En caso de resolucion por causa imputable a ${empNombre}, se abonara al Colaborador el importe correspondiente al trabajo efectivamente realizado y entregado.
  </div>
</div>

<div class="clause">
  <div class="clause-title">Novena — Legislacion Aplicable y Jurisdiccion</div>
  <div class="clause-body">
    El presente contrato se regira por la legislacion espanola vigente. Las partes, con renuncia expresa a cualquier otro fuero que pudiera corresponderles, se someten a la jurisdiccion y competencia de los Juzgados y Tribunales de Madrid para la resolucion de cualquier controversia derivada de la interpretacion o ejecucion del presente contrato.
  </div>
</div>

<div class="date-place">
  <strong>En Madrid, a ${today}</strong>
</div>

<div class="signatures">
  <div class="sig-box">
    <div class="sig-title">Por ${empNombre}</div>
    <div class="sig-name">Pablo Puado</div>
    <div class="sig-detail">Representante Legal</div>
    <div class="sig-line"></div>
    <div style="font-size:11px;color:#888">Firma y sello</div>
  </div>
  <div class="sig-box">
    <div class="sig-title">El Colaborador</div>
    <div class="sig-name">${s.dev_nombre}</div>
    <div class="sig-detail">${s.dev_nif ? `NIF/CIF: ${s.dev_nif}` : 'Colaborador autonomo'}</div>
    <div class="sig-line"></div>
    <div style="font-size:11px;color:#888">Firma</div>
  </div>
</div>

<div class="footer">
  ${empNombre} &bull; ${emp.web || 'onesevenia.com'} &bull; ${emp.email || 'pablo@onesevenia.com'}<br>
  ${emp.cif ? `CIF: ${emp.cif} &bull; ` : ''}${emp.direccion ? `${emp.direccion}, ${emp.ciudad || ''}` : ''}<br>
  Documento generado el ${today} &bull; Contrato de colaboracion profesional
</div>

</div></div></body></html>`
}

// ─── Formulario ───────────────────────────────────────────────────────────────
function FormularioSubcontratacion({ sub, clientes, onSave, onCancel }) {
  const isEdit = !!sub?.id
  const [form, setForm] = useState({
    dev_nombre: '', dev_email: '', dev_telefono: '', dev_especialidad: 'Full Stack',
    dev_nif: '', dev_iban: '', dev_banco: '',
    nombre_proyecto: '', descripcion: '', cliente_id: '', cliente_nombre: '',
    presupuesto_cliente: '', pago_desarrollador: '', forma_pago: 'Transferencia',
    tipo_contrato: 'precio_fijo', horas_estimadas: '', horas_reales: '', precio_hora: '',
    estado: 'pendiente_firma', fecha_inicio: '', fecha_entrega_estimada: '',
    fecha_entrega_real: '', fecha_pago: '', fecha_contrato: new Date().toISOString().split('T')[0],
    hitos: [], rating: null, notas: '', responsable: 'pablo',
    ...sub,
    hitos: sub?.hitos || [],
  })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const presupuesto = parseFloat(form.presupuesto_cliente) || 0
  const pago = parseFloat(form.pago_desarrollador) || 0
  const margen = presupuesto - pago
  const margenPct = presupuesto > 0 ? ((margen / presupuesto) * 100).toFixed(1) : 0

  // Hitos
  const addHito = () => set('hitos', [...(form.hitos || []), { descripcion: '', pct: '', completado: false }])
  const updateHito = (i, k, v) => set('hitos', form.hitos.map((h, idx) => idx === i ? { ...h, [k]: v } : h))
  const removeHito = (i) => set('hitos', form.hitos.filter((_, idx) => idx !== i))

  return (
    <div>
      {/* Datos del desarrollador */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
          Datos del desarrollador
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0 12px' }}>
          <div className="form-group"><label className="form-label">Nombre completo *</label><input className="form-input" value={form.dev_nombre} onChange={e => set('dev_nombre', e.target.value)} placeholder="Nombre del desarrollador" /></div>
          <div className="form-group"><label className="form-label">Especialidad</label>
            <select className="form-select" value={form.dev_especialidad} onChange={e => set('dev_especialidad', e.target.value)}>
              {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.dev_email} onChange={e => set('dev_email', e.target.value)} placeholder="dev@email.com" /></div>
          <div className="form-group"><label className="form-label">Telefono</label><input className="form-input" value={form.dev_telefono} onChange={e => set('dev_telefono', e.target.value)} placeholder="+34 600..." /></div>
          <div className="form-group"><label className="form-label">NIF / CIF</label><input className="form-input" value={form.dev_nif} onChange={e => set('dev_nif', e.target.value)} placeholder="12345678A" /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0 12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">IBAN</label><input className="form-input" value={form.dev_iban} onChange={e => set('dev_iban', e.target.value)} placeholder="ES00 0000 0000 0000 0000 0000" /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Banco</label><input className="form-input" value={form.dev_banco} onChange={e => set('dev_banco', e.target.value)} placeholder="BBVA, Santander..." /></div>
        </div>
      </div>

      {/* Datos del proyecto */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
          Proyecto
        </div>
        <div className="form-group"><label className="form-label">Nombre del proyecto *</label><input className="form-input" value={form.nombre_proyecto} onChange={e => set('nombre_proyecto', e.target.value)} placeholder="Ej: Desarrollo web Diamond Tattoo" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <div className="form-group">
            <label className="form-label">Cliente asociado</label>
            <select className="form-select" value={form.cliente_id} onChange={e => {
              const c = clientes.find(c => c.id === e.target.value)
              set('cliente_id', e.target.value)
              if (c) set('cliente_nombre', c.nombre + (c.empresa ? ` · ${c.empresa}` : ''))
            }}>
              <option value="">Sin cliente asociado</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` · ${c.empresa}` : ''}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select className="form-select" value={form.estado} onChange={e => set('estado', e.target.value)}>
              {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Descripcion y alcance del proyecto</label><textarea className="form-textarea" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Describe que debe desarrollar el colaborador..." style={{ minHeight: 80 }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 12px' }}>
          <div className="form-group"><label className="form-label">Fecha inicio</label><input className="form-input" type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Entrega estimada</label><input className="form-input" type="date" value={form.fecha_entrega_estimada} onChange={e => set('fecha_entrega_estimada', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Entrega real</label><input className="form-input" type="date" value={form.fecha_entrega_real} onChange={e => set('fecha_entrega_real', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Fecha contrato</label><input className="form-input" type="date" value={form.fecha_contrato} onChange={e => set('fecha_contrato', e.target.value)} /></div>
        </div>
      </div>

      {/* Economia */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
          Condiciones economicas
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
          <div className="form-group"><label className="form-label">Tipo de contrato</label>
            <select className="form-select" value={form.tipo_contrato} onChange={e => set('tipo_contrato', e.target.value)}>
              <option value="precio_fijo">Precio fijo</option>
              <option value="por_horas">Por horas</option>
              <option value="hitos">Por hitos</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Forma de pago</label>
            <select className="form-select" value={form.forma_pago} onChange={e => set('forma_pago', e.target.value)}>
              {FORMAS_PAGO.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Fecha de pago</label><input className="form-input" type="date" value={form.fecha_pago} onChange={e => set('fecha_pago', e.target.value)} /></div>
        </div>
        {form.tipo_contrato === 'por_horas' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
            <div className="form-group"><label className="form-label">Precio/hora (EUR)</label><input className="form-input" type="number" step="0.01" value={form.precio_hora} onChange={e => set('precio_hora', e.target.value)} placeholder="0.00" /></div>
            <div className="form-group"><label className="form-label">Horas estimadas</label><input className="form-input" type="number" step="0.5" value={form.horas_estimadas} onChange={e => set('horas_estimadas', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Horas reales</label><input className="form-input" type="number" step="0.5" value={form.horas_reales} onChange={e => set('horas_reales', e.target.value)} /></div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <div className="form-group"><label className="form-label">Presupuesto cliente (lo que cobra ONESEVEN)</label><input className="form-input" type="number" step="0.01" value={form.presupuesto_cliente} onChange={e => set('presupuesto_cliente', e.target.value)} placeholder="0.00" /></div>
          <div className="form-group"><label className="form-label">Pago al desarrollador</label><input className="form-input" type="number" step="0.01" value={form.pago_desarrollador} onChange={e => set('pago_desarrollador', e.target.value)} placeholder="0.00" /></div>
        </div>
        {/* Margen en tiempo real */}
        {(presupuesto > 0 || pago > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 8 }}>
            {[
              { label: 'Presupuesto cliente', value: fmt2(presupuesto), color: 'var(--text0)' },
              { label: 'Pago desarrollador', value: fmt2(pago), color: 'var(--red)' },
              { label: `Margen ONESEVEN (${margenPct}%)`, value: fmt2(margen), color: margen >= 0 ? 'var(--green)' : 'var(--red)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)', color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hitos */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Hitos del proyecto</div>
          <button className="btn btn-ghost btn-sm" onClick={addHito}>+ Anadir hito</button>
        </div>
        {form.hitos.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>Sin hitos — el proyecto se entrega completo</div>
        ) : (
          form.hitos.map((h, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 80px 1fr 32px', gap: '0 8px', marginBottom: 6, alignItems: 'center' }}>
              <input className="form-input" value={h.descripcion} onChange={e => updateHito(i, 'descripcion', e.target.value)} placeholder="Descripcion del hito" />
              <input className="form-input" type="number" value={h.pct} onChange={e => updateHito(i, 'pct', e.target.value)} placeholder="%" />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={h.completado} onChange={e => updateHito(i, 'completado', e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                Completado
              </label>
              <button className="btn-icon" style={{ width: 32, height: 36, color: 'var(--red)' }} onClick={() => removeHito(i)}><TrashIcon /></button>
            </div>
          ))
        )}
      </div>

      {/* Extra */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Extra</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <div className="form-group">
            <label className="form-label">Responsable ONESEVEN</label>
            <select className="form-select" value={form.responsable} onChange={e => set('responsable', e.target.value)}>
              <option value="pablo">Pablo Puado</option>
              <option value="alberto">Alberto</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Rating del desarrollador (al finalizar)</label>
            <div style={{ display: 'flex', gap: 4, paddingTop: 8 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => set('rating', form.rating === n ? null : n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <StarIcon filled={form.rating >= n} />
                </button>
              ))}
              {form.rating && <span style={{ fontSize: 12, color: 'var(--amber)', paddingTop: 2 }}>{form.rating}/5</span>}
            </div>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Notas internas</label>
          <textarea className="form-textarea" value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Observaciones, contexto, acuerdos informales..." style={{ minHeight: 70 }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" style={{ padding: '10px 24px' }} onClick={() => {
          if (!form.dev_nombre || !form.nombre_proyecto) return alert('Rellena nombre del desarrollador y del proyecto')
          onSave(form)
        }}>
          {isEdit ? 'Guardar cambios' : 'Crear subcontratacion'}
        </button>
      </div>
    </div>
  )
}

// ─── Modal envio contrato ─────────────────────────────────────────────────────
function ModalContrato({ sub, empresa, onClose, onEnviado }) {
  const [copied, setCopied] = useState(false)

  const msgWA = `Hola ${sub.dev_nombre.split(' ')[0]}!

Te envio el contrato de colaboracion para el proyecto "${sub.nombre_proyecto}".

Importe acordado: ${fmt2(sub.pago_desarrollador)}
Forma de pago: ${sub.forma_pago}
${sub.fecha_entrega_estimada ? `Entrega estimada: ${formatDate(sub.fecha_entrega_estimada)}` : ''}

Por favor, revisa el documento, firmalo y enviame una copia firmada.

${empresa?.nombre || 'ONESEVEN IA'} - ${empresa?.web || 'onesevenia.com'}`

  const asunto = `Contrato de colaboracion — ${sub.nombre_proyecto}`
  const msgEmail = `Hola ${sub.dev_nombre.split(' ')[0]},\n\nAdjunto el contrato de colaboracion para el proyecto "${sub.nombre_proyecto}".\n\nImporte: ${fmt2(sub.pago_desarrollador)}\nForma de pago: ${sub.forma_pago}\n${sub.fecha_entrega_estimada ? `Entrega estimada: ${formatDate(sub.fecha_entrega_estimada)}\n` : ''}\nPor favor, revisa el documento, firmalo y enviame una copia firmada para nuestros archivos.\n\nCualquier duda estoy disponible.\n\nUn saludo,\nPablo Puado\n${empresa?.nombre || 'ONESEVEN IA'}`

  const copiar = (txt) => { navigator.clipboard.writeText(txt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg1)', borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}><div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border2)' }} /></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px' }}>
          <div><div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text0)' }}>Enviar contrato</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{sub.dev_nombre} · {sub.nombre_proyecto}</div></div>
          <button onClick={onClose} style={{ background: 'var(--bg3)', border: 'none', borderRadius: 20, width: 32, height: 32, cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CloseIcon /></button>
        </div>
        <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Ver PDF */}
          <button onClick={() => { const w = window.open('', '_blank'); w.document.write(generarContrato({ s: sub, empresa })); w.document.close() }} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent2)', flexShrink: 0 }}><DocIcon /></div>
            <div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>Ver contrato PDF</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>Abre y guarda el contrato completo</div></div>
          </button>
          {/* WA */}
          {sub.dev_telefono && (
            <div style={{ borderRadius: 12, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.05)', overflow: 'hidden' }}>
              <button onClick={() => { window.open(`https://wa.me/${sub.dev_telefono.replace(/\D/g,'')}?text=${encodeURIComponent(msgWA)}`, '_blank'); onEnviado('wa') }} style={{ width: '100%', padding: '14px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25d366', flexShrink: 0 }}><WAIcon /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>WhatsApp</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{sub.dev_telefono}</div></div>
                <span style={{ color: '#25d366', fontSize: 18 }}>›</span>
              </button>
              <div style={{ margin: '0 14px 6px', padding: 10, background: 'var(--bg3)', borderRadius: 8, fontSize: 11, color: 'var(--text2)', whiteSpace: 'pre-wrap', maxHeight: 100, overflowY: 'auto' }}>{msgWA}</div>
              <div style={{ padding: '0 14px 12px' }}><button onClick={() => copiar(msgWA)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border2)', background: 'none', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>Copiar mensaje</button></div>
            </div>
          )}
          {/* Email */}
          {sub.dev_email && (
            <div style={{ borderRadius: 12, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)', overflow: 'hidden' }}>
              <button onClick={() => { const url = `https://mail.google.com/mail/?view=cm&fs=1&from=${encodeURIComponent(empresa?.email||'pablo@onesevenia.com')}&to=${encodeURIComponent(sub.dev_email)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(msgEmail)}`; window.open(url, '_blank'); onEnviado('email') }} style={{ width: '100%', padding: '14px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent2)', flexShrink: 0 }}><MailIcon /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>Gmail</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{sub.dev_email}</div></div>
                <span style={{ color: 'var(--accent2)', fontSize: 18 }}>›</span>
              </button>
              <div style={{ padding: '0 14px 12px' }}><button onClick={() => copiar(msgEmail)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border2)', background: 'none', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>Copiar mensaje</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Pagina principal ─────────────────────────────────────────────────────────
export default function Subcontrataciones() {
  const { subcontrataciones, crear, actualizar, eliminar } = useSubcontrataciones()
  const { clientes } = useClientes()
  const { config: empresa } = useEmpresaConfig()

  const [vista, setVista] = useState('lista') // lista | form | dev
  const [editando, setEditando] = useState(null)
  const [enviandoContrato, setEnviandoContrato] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [devFiltro, setDevFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [expandido, setExpandido] = useState(null)

  // Metricas globales
  const activos = subcontrataciones.filter(s => !['cancelado', 'pagado'].includes(s.estado))
  const totalMargen = subcontrataciones.reduce((sum, s) => sum + ((parseFloat(s.presupuesto_cliente)||0) - (parseFloat(s.pago_desarrollador)||0)), 0)
  const totalPendientePago = subcontrataciones.filter(s => s.estado !== 'pagado' && s.estado !== 'cancelado').reduce((sum, s) => sum + (parseFloat(s.pago_desarrollador)||0), 0)
  const margenMedio = subcontrataciones.length > 0
    ? subcontrataciones.reduce((sum, s) => { const p = parseFloat(s.presupuesto_cliente)||0; return sum + (p > 0 ? ((p - (parseFloat(s.pago_desarrollador)||0)) / p) * 100 : 0) }, 0) / subcontrataciones.length
    : 0

  // Desarrolladores únicos
  const devs = [...new Set(subcontrataciones.map(s => s.dev_nombre))].sort()

  const filtrados = useMemo(() => {
    let lista = [...subcontrataciones]
    if (busqueda) { const q = busqueda.toLowerCase(); lista = lista.filter(s => [s.dev_nombre, s.nombre_proyecto, s.cliente_nombre].some(f => f?.toLowerCase().includes(q))) }
    if (devFiltro) lista = lista.filter(s => s.dev_nombre === devFiltro)
    if (estadoFiltro) lista = lista.filter(s => s.estado === estadoFiltro)
    return lista
  }, [subcontrataciones, busqueda, devFiltro, estadoFiltro])

  const handleSave = async (form) => {
    // Sanitize: convert empty strings to null for uuid/numeric fields
    const clean = Object.fromEntries(
      Object.entries(form).map(([k, v]) => {
        if (v === '' || v === undefined) return [k, null]
        return [k, v]
      })
    )
    const { error } = editando?.id
      ? await actualizar(editando.id, clean)
      : await crear(clean)
    if (error) { alert('Error al guardar: ' + (error.message || JSON.stringify(error))); return }
    setVista('lista'); setEditando(null)
  }

  const handleEnviado = async (tipo) => {
    if (enviandoContrato?.id) {
      await actualizar(enviandoContrato.id, tipo === 'wa' ? { contrato_enviado_wa: true } : { contrato_enviado_email: true })
    }
    setEnviandoContrato(null)
  }

  if (vista === 'form') {
    return (
      <Layout title={editando?.id ? 'Editar subcontratacion' : 'Nueva subcontratacion'} subtitle="Datos del desarrollador y proyecto">
        <div style={{ maxWidth: 820 }}>
          <FormularioSubcontratacion sub={editando} clientes={clientes} onSave={handleSave} onCancel={() => { setVista('lista'); setEditando(null) }} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Subcontrataciones"
      subtitle={`${filtrados.length} proyecto${filtrados.length !== 1 ? 's' : ''}`}
      actions={
        <button className="btn btn-primary" onClick={() => { setEditando(null); setVista('form') }}>
          <PlusIcon /> Nueva subcontratacion
        </button>
      }
    >
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Proyectos activos', value: activos.length, color: '#3b82f6', sub: 'en curso' },
          { label: 'Margen total acumulado', value: fmt2(totalMargen), color: 'var(--green)', sub: 'bruto' },
          { label: 'Pendiente pagar a devs', value: fmt2(totalPendientePago), color: 'var(--amber)', sub: 'no pagado aun' },
          { label: 'Margen medio', value: `${margenMedio.toFixed(1)}%`, color: margenMedio >= 30 ? 'var(--green)' : 'var(--amber)', sub: 'por proyecto' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input className="form-input" style={{ maxWidth: 240 }} placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <select className="form-select" style={{ width: 180 }} value={devFiltro} onChange={e => setDevFiltro(e.target.value)}>
          <option value="">Todos los desarrolladores</option>
          {devs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="form-select" style={{ width: 160 }} value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtrados.length === 0 && (
        <div className="card empty-state"><div className="empty-state-text">{busqueda || devFiltro || estadoFiltro ? 'No hay proyectos con estos filtros' : 'Crea tu primera subcontratacion'}</div></div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtrados.map(s => {
          const estado = ESTADOS[s.estado] || ESTADOS.pendiente_firma
          const presupuesto = parseFloat(s.presupuesto_cliente) || 0
          const pago = parseFloat(s.pago_desarrollador) || 0
          const margen = presupuesto - pago
          const margenPct = presupuesto > 0 ? ((margen / presupuesto) * 100).toFixed(1) : 0
          const isExpanded = expandido === s.id
          const hitosCompletados = (s.hitos || []).filter(h => h.completado).length
          const totalHitos = (s.hitos || []).length

          return (
            <div key={s.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Fila principal */}
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Avatar dev */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.15)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                  {s.dev_nombre[0].toUpperCase()}
                </div>

                {/* Info principal */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>{s.nombre_proyecto}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: estado.bg, color: estado.color, fontWeight: 500 }}>{estado.label}</span>
                    {s.contrato_enviado_wa && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(37,211,102,0.15)', color: '#25d366' }}>WA</span>}
                    {s.contrato_enviado_email && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(99,102,241,0.15)', color: 'var(--accent2)' }}>Email</span>}
                    {s.contrato_firmado && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', color: 'var(--green)' }}>Firmado</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text1)' }}>{s.dev_nombre}</span>
                    {s.dev_especialidad && <span>{s.dev_especialidad}</span>}
                    {s.cliente_nombre && <span>· {s.cliente_nombre}</span>}
                    {s.fecha_entrega_estimada && <span>Entrega: {formatDate(s.fecha_entrega_estimada)}</span>}
                    {totalHitos > 0 && <span>{hitosCompletados}/{totalHitos} hitos</span>}
                    {s.rating && <span style={{ color: 'var(--amber)' }}>{'★'.repeat(s.rating)}</span>}
                  </div>
                </div>

                {/* Margen + acciones */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {presupuesto > 0 && (
                    <div style={{ textAlign: 'right', marginRight: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: margen >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt2(margen)}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{margenPct}% margen</div>
                    </div>
                  )}
                  {/* Ver contrato */}
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--text2)' }} onClick={() => { const w = window.open('', '_blank'); w.document.write(generarContrato({ s, empresa })); w.document.close() }} title="Ver contrato PDF"><DocIcon /></button>
                  {/* Enviar contrato */}
                  <button className="btn-icon" style={{ width: 32, height: 32, color: '#25d366', borderRadius: 8, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)' }} onClick={() => setEnviandoContrato(s)} title="Enviar contrato"><WAIcon /></button>
                  {/* Editar */}
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--text2)' }} onClick={() => { setEditando(s); setVista('form') }} title="Editar"><EditIcon /></button>
                  {/* Eliminar */}
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--red)' }} onClick={() => setConfirmDelete(s)} title="Eliminar"><TrashIcon /></button>
                  {/* Expandir */}
                  <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--text3)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} onClick={() => setExpandido(isExpanded ? null : s.id)}><ChevronIcon /></button>
                </div>
              </div>

              {/* Detalle expandible */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, background: 'var(--bg2)' }}>
                  {/* Col 1: Economico */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Economia</div>
                    {[
                      { label: 'Presupuesto cliente', value: fmt2(s.presupuesto_cliente) },
                      { label: 'Pago desarrollador', value: fmt2(s.pago_desarrollador), color: 'var(--red)' },
                      { label: 'Margen bruto', value: fmt2(margen), color: margen >= 0 ? 'var(--green)' : 'var(--red)' },
                      { label: '% Margen', value: `${margenPct}%`, color: parseFloat(margenPct) >= 30 ? 'var(--green)' : 'var(--amber)' },
                      { label: 'Forma de pago', value: s.forma_pago },
                      { label: 'Tipo contrato', value: s.tipo_contrato?.replace('_', ' ') },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12, borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text3)' }}>{r.label}</span>
                        <span style={{ fontFamily: 'var(--mono)', color: r.color || 'var(--text1)', fontWeight: 500 }}>{r.value || '—'}</span>
                      </div>
                    ))}
                    {s.tipo_contrato === 'por_horas' && s.horas_estimadas && (
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)' }}>
                        {s.horas_estimadas}h estimadas · {s.horas_reales || 0}h reales · {fmt2(s.precio_hora)}/h
                      </div>
                    )}
                  </div>

                  {/* Col 2: Desarrollador + fechas */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Desarrollador</div>
                    {[
                      { label: 'Email', value: s.dev_email },
                      { label: 'Telefono', value: s.dev_telefono },
                      { label: 'NIF/CIF', value: s.dev_nif },
                      { label: 'IBAN', value: s.dev_iban },
                      { label: 'Banco', value: s.dev_banco },
                    ].filter(r => r.value).map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12, borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text3)' }}>{r.label}</span>
                        <span style={{ color: 'var(--text1)' }}>{r.value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 12, fontSize: 10, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Fechas</div>
                    {[
                      { label: 'Inicio', value: formatDate(s.fecha_inicio) },
                      { label: 'Entrega est.', value: formatDate(s.fecha_entrega_estimada) },
                      { label: 'Entrega real', value: formatDate(s.fecha_entrega_real) },
                      { label: 'Fecha pago', value: formatDate(s.fecha_pago) },
                    ].filter(r => r.value !== '—').map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12, borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text3)' }}>{r.label}</span>
                        <span style={{ color: 'var(--text1)' }}>{r.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Col 3: Hitos + estado + notas */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Cambiar estado</div>
                    <select className="form-select" style={{ marginBottom: 12, fontSize: 12 }} value={s.estado} onChange={async e => await actualizar(s.id, { estado: e.target.value })}>
                      {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', marginBottom: 8 }}>
                      <input type="checkbox" checked={s.contrato_firmado} onChange={async e => await actualizar(s.id, { contrato_firmado: e.target.checked })} style={{ accentColor: 'var(--accent)' }} />
                      <span style={{ color: 'var(--text1)' }}>Contrato firmado</span>
                    </label>
                    {/* Subir contrato firmado */}
                    <div style={{ marginBottom: 12 }}>
                      {s.contrato_url ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)' }}>
                          <span style={{ fontSize: 11, color: 'var(--green)', flex: 1 }}>Contrato subido</span>
                          <a href={s.contrato_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--accent2)', textDecoration: 'none' }}>Ver</a>
                          <button onClick={async () => await actualizar(s.id, { contrato_url: null, contrato_firmado: false })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 11, padding: 0 }}>x</button>
                        </div>
                      ) : (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--bg3)', borderRadius: 8, border: '1px dashed var(--border2)', cursor: 'pointer', fontSize: 11, color: 'var(--text3)' }}>
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 9V1M4 4l3-3 3 3"/><path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></svg>
                          Subir contrato firmado (PDF/imagen)
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={async e => {
                            const file = e.target.files[0]
                            if (!file) return
                            const { supabase } = await import('../lib/supabase')
                            const path = `contratos/${s.id}_${Date.now()}_${file.name}`
                            const { error: upErr } = await supabase.storage.from('documentos').upload(path, file)
                            if (upErr) { alert('Error al subir: ' + upErr.message); return }
                            const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(path)
                            await actualizar(s.id, { contrato_url: publicUrl, contrato_firmado: true })
                          }} />
                        </label>
                      )}
                    </div>

                    {totalHitos > 0 && (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Hitos ({hitosCompletados}/{totalHitos})</div>
                        {s.hitos.map((h, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                            <input type="checkbox" checked={h.completado} onChange={async e => {
                              const newHitos = s.hitos.map((hh, ii) => ii === i ? { ...hh, completado: e.target.checked } : hh)
                              await actualizar(s.id, { hitos: newHitos })
                            }} style={{ accentColor: 'var(--accent)', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: h.completado ? 'var(--text3)' : 'var(--text1)', textDecoration: h.completado ? 'line-through' : 'none', flex: 1 }}>{h.descripcion}</span>
                            {h.pct && <span style={{ fontSize: 10, color: 'var(--text3)' }}>{h.pct}%</span>}
                          </div>
                        ))}
                      </>
                    )}

                    {s.notas && (
                      <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg3)', borderRadius: 6, fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>
                        {s.notas}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {enviandoContrato && (
        <ModalContrato sub={enviandoContrato} empresa={empresa} onClose={() => setEnviandoContrato(null)} onEnviado={handleEnviado} />
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: '28px', maxWidth: 380, width: '100%', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)', marginBottom: 8 }}>Eliminar "{confirmDelete.nombre_proyecto}"?</div>
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
