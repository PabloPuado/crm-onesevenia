import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useGastos, usePagosGastos, useLiquidaciones, useFacturasGastos } from '../hooks/useData'
import SplitGastosWidget from '../components/SplitGastosWidget'
import { formatEur, formatDate } from '../lib/constants'

const formatDec = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(n) || 0)


// ─── Generador ICS (calendario) ───────────────────────────────────────────────
function generarICS(gastos) {
  const activos = gastos.filter(g => g.activo !== false && g.dia_cobro && ['mensual','trimestral','semestral','anual'].includes(g.frecuencia))
  if (activos.length === 0) return null

  const pad = n => String(n).padStart(2, '0')
  const now = new Date()
  const anoActual = now.getFullYear()

  let eventos = []

  activos.forEach(g => {
    const dia = parseInt(g.dia_cobro)
    const imp = parseFloat(g.importe) || 0
    const nombre = `${g.nombre} — ${new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(imp)}`
    const desc = `Gasto: ${g.nombre}\nImporte: ${new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(imp)}\nFrecuencia: ${g.frecuencia}\nPagado por: ${g.pagado_por || 'Pablo'}`

    const meses = g.frecuencia === 'mensual' ? [1,2,3,4,5,6,7,8,9,10,11,12]
      : g.frecuencia === 'trimestral' ? [1,4,7,10]
      : g.frecuencia === 'semestral' ? [1,7]
      : [1]

    // Generar 2 años de eventos
    for (let ano = anoActual; ano <= anoActual + 1; ano++) {
      meses.forEach(mes => {
        // Día máximo del mes
        const maxDia = new Date(ano, mes, 0).getDate()
        const diaReal = Math.min(dia, maxDia)
        const dtstart = `${ano}${pad(mes)}${pad(diaReal)}`
        const uid = `gasto-${g.id}-${ano}-${pad(mes)}@crm-onesevenia`

        eventos.push([
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTART;VALUE=DATE:${dtstart}`,
          `DTEND;VALUE=DATE:${dtstart}`,
          `SUMMARY:💳 ${nombre}`,
          `DESCRIPTION:${desc}`,
          `CATEGORIES:GASTOS,CRM`,
          `BEGIN:VALARM`,
          `TRIGGER:-PT9H`,
          `ACTION:DISPLAY`,
          `DESCRIPTION:Recordatorio: ${g.nombre} se cobra hoy`,
          `END:VALARM`,
          'END:VEVENT'
        ].join('\r\n'))
      })
    }
  })

  if (eventos.length === 0) return null

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ONESEVEN CRM//Gastos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Gastos ONESEVEN CRM',
    'X-WR-CALDESC:Recordatorios de gastos recurrentes',
    'X-WR-TIMEZONE:Europe/Madrid',
    ...eventos,
    'END:VCALENDAR'
  ].join('\r\n')

  return ics
}

function descargarCalendario(gastos) {
  const ics = generarICS(gastos)
  if (!ics) {
    alert('No hay gastos recurrentes con día de cobro configurado. Edita los gastos y añade el día de cobro.')
    return
  }
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'gastos-crm-oneseven.ics'
  a.click()
  URL.revokeObjectURL(url)
}

function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg> }
function EditIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2l2 2-7 7H2V9L9 2z"/></svg> }
function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h9M5 3V2h3v1M3 3l.5 8h6l.5-8"/></svg> }
function CloseIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg> }
function CheckIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 6.5l4 4 5-6"/></svg> }
function ChevronIcon({ open }) { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M3 5l4 4 4-4"/></svg> }
function CalendarIcon() { return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="2" width="12" height="11" rx="1"/><path d="M1 6h12M5 1v2M9 1v2"/></svg> }
function UploadIcon() { return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 9V1M4 4l3-3 3 3"/><path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></svg> }
function DownloadIcon() { return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 5v8M4 10l3 3 3-3"/><path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></svg> }
function FileIcon() { return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5L8 1z"/><path d="M8 1v4h4"/></svg> }
function ShareIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 1l3 3-3 3M12 4H5a4 4 0 0 0 0 8h1"/></svg> }

const CATEGORIAS = ['software', 'marketing', 'personal', 'oficina', 'servicios', 'infraestructura', 'formacion', 'legal', 'bancario', 'otros']
const CAT_COLORS = { software: '#6366f1', marketing: '#ec4899', personal: '#f59e0b', oficina: '#10b981', servicios: '#3b82f6', infraestructura: '#8b5cf6', formacion: '#06b6d4', legal: '#ef4444', bancario: '#84cc16', otros: '#6b7280' }
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const ANO_ACTUAL = new Date().getFullYear()
const MES_ACTUAL = new Date().getMonth() + 1
const MES_LABEL = MESES[MES_ACTUAL - 1]

function importeMensual(g) {
  const imp = parseFloat(g.importe) || 0
  switch (g.frecuencia) {
    case 'mensual': return imp
    case 'trimestral': return imp / 3
    case 'semestral': return imp / 6
    case 'anual': return imp / 12
    case 'unico': return 0
    default: return imp
  }
}
function importeAnual(g) {
  const imp = parseFloat(g.importe) || 0
  switch (g.frecuencia) {
    case 'mensual': return imp * 12
    case 'trimestral': return imp * 4
    case 'semestral': return imp * 2
    case 'anual': return imp
    case 'unico': return imp
    default: return imp * 12
  }
}

// ─── Modal registrar pago ─────────────────────────────────────────────────────
function ModalRegistrarPago({ gasto, onClose, onSave }) {
  const hoy = new Date().toISOString().split('T')[0]
  const mesLabel = `${ANO_ACTUAL}-${String(MES_ACTUAL).padStart(2,'0')}`
  const [form, setForm] = useState({
    gasto_id: gasto.id,
    pagado_por: gasto.pagado_por || 'pablo',
    importe: String(parseFloat(gasto.importe) || ''),
    fecha: hoy,
    periodo: gasto.frecuencia === 'mensual' ? mesLabel : gasto.frecuencia === 'anual' ? String(ANO_ACTUAL) : mesLabel,
    notas: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const [saving, setSaving] = useState(false)

  const modoP = gasto.modo_pablo || 'pct'
  const modoA = gasto.modo_alberto || 'pct'
  const pctP = parseFloat(gasto.pct_pablo) || 0
  const pctA = parseFloat(gasto.pct_alberto) || 0
  const fijoP = parseFloat(gasto.fijo_pablo) || 0
  const fijoA = parseFloat(gasto.fijo_alberto) || 0
  // Una persona está imputada si su parte > 0
  const impP = modoP === 'fijo' ? fijoP : (parseFloat(gasto.importe)||0) * pctP / 100
  const impA = modoA === 'fijo' ? fijoA : (parseFloat(gasto.importe)||0) * pctA / 100
  const imputadoP = impP > 0.001
  const imputadoA = impA > 0.001
  const imp = parseFloat(form.importe) || 0

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 460, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text0)' }}>Registrar pago</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{gasto.nombre}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}><CloseIcon /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">Quién ha pagado</label>
              <select className="form-select" value={form.pagado_por} onChange={e => set('pagado_por', e.target.value)}>
                <option value="pablo">Pablo</option>
                <option value="alberto">Alberto</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Importe pagado (€)</label>
              <input className="form-input" type="number" step="0.01" value={form.importe} onChange={e => set('importe', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">Fecha del pago</label>
              <input className="form-input" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Periodo <span style={{ fontSize: 10, color: 'var(--text3)' }}>(ej: 2026-04)</span></label>
              <input className="form-input" value={form.periodo} onChange={e => set('periodo', e.target.value)} placeholder="2026-04" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notas <span style={{ fontSize: 10, color: 'var(--text3)' }}>(referencia, concepto...)</span></label>
            <input className="form-input" value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Ref. bancaria, concepto..." />
          </div>

          {/* Desglose split */}
          {imp > 0 && (
            <div style={{ padding: '12px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Desglose según % acordado</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ name: 'Pablo', pct: pctP }, { name: 'Alberto', pct: pctA }].map(p => (
                  <div key={p.name} style={{ flex: 1, padding: '8px 10px', background: 'var(--bg1)', borderRadius: 8, textAlign: 'center', border: p.name.toLowerCase() === form.pagado_por ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{p.name} ({p.pct}%)</div>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--mono)', color: p.name.toLowerCase() === form.pagado_por ? 'var(--green)' : 'var(--text0)' }}>
                      {formatDec(imp * p.pct / 100)}
                    </div>
                    {p.name.toLowerCase() === form.pagado_por && (
                      <div style={{ fontSize: 10, color: 'var(--green)', marginTop: 2 }}>ha pagado</div>
                    )}
                  </div>
                ))}
              </div>
              {/* Cuánto le debe el otro */}
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)', textAlign: 'center' }}>
                {form.pagado_por === 'pablo'
                  ? `Alberto deberá reembolsar a Pablo: ${formatDec(imp * pctA / 100)}`
                  : `Pablo deberá reembolsar a Alberto: ${formatDec(imp * pctP / 100)}`}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" disabled={saving || !form.importe} onClick={async () => {
              setSaving(true)
              await onSave({ ...form, importe: parseFloat(form.importe) })
              setSaving(false)
            }}>
              {saving ? 'Registrando...' : 'Confirmar pago'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── Editor de reparto ────────────────────────────────────────────────────────
function SplitEditor({ form, set }) {
  const imp = parseFloat(form.importe) || 0
  const modoP = form.modo_pablo || 'pct'   // 'pct' | 'fijo'
  const modoA = form.modo_alberto || 'pct'

  // Calcular importes
  const calcImporte = (pct, fijo) => {
    if (form[`modo_${fijo < 0 ? 'pablo' : 'alberto'}`] === 'fijo') return parseFloat(form[`fijo_${fijo < 0 ? 'pablo' : 'alberto'}`]) || 0
    return imp * (parseFloat(pct) || 0) / 100
  }

  const impP = form.modo_pablo === 'fijo'
    ? parseFloat(form.fijo_pablo) || 0
    : imp * (parseFloat(form.pct_pablo) || 0) / 100

  const impA = form.modo_alberto === 'fijo'
    ? parseFloat(form.fijo_alberto) || 0
    : imp * (parseFloat(form.pct_alberto) || 0) / 100

  const personas = [
    { key: 'pablo', label: 'Pablo', color: '#6366f1' },
    { key: 'alberto', label: 'Alberto', color: '#06b6d4' },
  ]

  return (
    <div style={{ padding: '14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Reparto del gasto</div>
        <select className="form-select" value={form.pagado_por} onChange={e => set('pagado_por', e.target.value)} style={{ width: 180, height: 28, fontSize: 11 }}>
          <option value="pablo">Lo paga Pablo</option>
          <option value="alberto">Lo paga Alberto</option>
          <option value="ambos">Lo pagan ambos</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {personas.map(p => {
          const modo = form[`modo_${p.key}`] || 'pct'
          const pct = parseFloat(form[`pct_${p.key}`]) || 0
          const fijo = parseFloat(form[`fijo_${p.key}`]) || 0
          const imputado = modo === 'fijo' ? fijo > 0 : pct > 0
          const importeCalculado = modo === 'fijo' ? fijo : imp * pct / 100

          return (
            <div key={p.key} style={{ background: 'var(--bg1)', borderRadius: 10, border: `1px solid ${imputado ? p.color + '40' : 'var(--border)'}`, overflow: 'hidden', transition: 'all 0.2s' }}>
              {/* Header persona */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: imputado ? p.color + '20' : 'var(--bg4)', color: imputado ? p.color : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {p.label[0]}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: imputado ? 'var(--text0)' : 'var(--text3)', flex: 1 }}>{p.label}</span>

                {/* Toggle imputar */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: imputado ? p.color : 'var(--text3)' }}>
                  <div
                    onClick={() => {
                      const nuevoImputado = !imputado
                      set(`imputar_${p.key}`, nuevoImputado)
                      if (!nuevoImputado) {
                        set(`pct_${p.key}`, 0)
                        set(`fijo_${p.key}`, 0)
                      } else {
                        // Restaurar 50% por defecto al activar
                        const otro = p.key === 'pablo' ? 'alberto' : 'pablo'
                        set(`pct_${p.key}`, 50)
                        if (form[`modo_${otro}`] !== 'fijo') set(`pct_${otro}`, 50)
                      }
                    }}
                    style={{ width: 36, height: 20, borderRadius: 10, background: imputado ? p.color : 'var(--bg4)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
                  >
                    <div style={{ position: 'absolute', top: 2, left: imputado ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                  </div>
                  {imputado ? 'Imputado' : 'No imputar'}
                </label>

                {/* Importe final */}
                {imputado && imp > 0 && (
                  <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--mono)', color: p.color, minWidth: 70, textAlign: 'right' }}>
                    {formatDec(importeCalculado)}
                  </span>
                )}
              </div>

              {/* Controles (solo si imputado) */}
              {imputado && (
                <div style={{ padding: '0 14px 12px', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  {/* Selector modo */}
                  <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                    {['pct', 'fijo'].map(m => (
                      <button key={m} onClick={() => set(`modo_${p.key}`, m)} style={{ padding: '5px 12px', fontSize: 11, fontWeight: modo === m ? 600 : 400, background: modo === m ? p.color : 'none', color: modo === m ? '#fff' : 'var(--text3)', border: 'none', cursor: 'pointer' }}>
                        {m === 'pct' ? '%' : '€'}
                      </button>
                    ))}
                  </div>

                  {/* Input */}
                  {modo === 'pct' ? (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Porcentaje</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          className="form-input"
                          type="number" min="0" max="100" step="1"
                          value={pct}
                          onChange={e => {
                            const v = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                            set(`pct_${p.key}`, v)
                            // Auto-ajustar el otro si está en modo pct y ambos imputados
                            const otro = p.key === 'pablo' ? 'alberto' : 'pablo'
                            if (form[`imputar_${otro}`] !== false && form[`modo_${otro}`] !== 'fijo') {
                              set(`pct_${otro}`, Math.round((100 - v) * 10) / 10)
                            }
                          }}
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>%</span>
                        {imp > 0 && <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text2)', whiteSpace: 'nowrap' }}>= {formatDec(imp * pct / 100)}</span>}
                      </div>
                    </div>
                  ) : (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Cantidad fija</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          className="form-input"
                          type="number" min="0" step="0.01"
                          value={fijo}
                          onChange={e => set(`fijo_${p.key}`, parseFloat(e.target.value) || 0)}
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>€</span>
                        {imp > 0 && fijo > 0 && <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{((fijo/imp)*100).toFixed(1)}%</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Resumen total */}
      {imp > 0 && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg2)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Total imputado</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {(() => {
              const impP2 = form.imputar_pablo !== false ? (form.modo_pablo === 'fijo' ? parseFloat(form.fijo_pablo)||0 : imp * (parseFloat(form.pct_pablo)||0)/100) : 0
              const impA2 = form.imputar_alberto !== false ? (form.modo_alberto === 'fijo' ? parseFloat(form.fijo_alberto)||0 : imp * (parseFloat(form.pct_alberto)||0)/100) : 0
              const total2 = impP2 + impA2
              const diff = imp - total2
              return <>
                <span style={{ fontSize: 13, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text0)' }}>{formatDec(total2)} / {formatDec(imp)}</span>
                {Math.abs(diff) > 0.01 && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(245,158,11,0.15)', color: 'var(--amber)' }}>
                    {diff > 0 ? `${formatDec(diff)} sin imputar` : `${formatDec(Math.abs(diff))} excedido`}
                  </span>
                )}
                {Math.abs(diff) <= 0.01 && <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ Cuadra</span>}
              </>
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Modal gasto ──────────────────────────────────────────────────────────────
function ModalGasto({ gasto, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: '', categoria: 'software', categoria_custom: '', tipo: 'fijo',
    importe: '', frecuencia: 'mensual', dia_cobro: '', fecha_cobro: '', activo: true, notas: '',
    pagado_por: 'pablo', pct_pablo: 50, pct_alberto: 50,
    imputar_pablo: true, imputar_alberto: true,
    modo_pablo: 'pct', modo_alberto: 'pct',
    fijo_pablo: 0, fijo_alberto: 0,
    ...gasto,
  })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const esPersonalizada = !CATEGORIAS.includes(form.categoria) && form.categoria !== 'software'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 500, border: '1px solid var(--border)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg1)', zIndex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text0)' }}>{gasto?.id ? 'Editar gasto' : 'Nuevo gasto'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}><CloseIcon /></button>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: n8n, Vercel, Alquiler..." autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: form.frecuencia === 'unico' ? '1fr' : '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="form-select" value={CATEGORIAS.includes(form.categoria) ? form.categoria : '__custom__'} onChange={e => {
                if (e.target.value === '__custom__') set('categoria', form.categoria_custom || '')
                else { set('categoria', e.target.value); set('categoria_custom', '') }
              }}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                <option value="__custom__">+ Personalizada...</option>
              </select>
            </div>
            {form.frecuencia !== 'unico' && (
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                  <option value="fijo">Fijo</option>
                  <option value="variable">Variable</option>
                </select>
              </div>
            )}
          </div>
          {(!CATEGORIAS.includes(form.categoria)) && (
            <div className="form-group">
              <label className="form-label">Nombre categoría personalizada *</label>
              <input className="form-input" value={form.categoria} onChange={e => set('categoria', e.target.value)} placeholder="Ej: IA Tools, Transporte..." />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">Importe (€)</label>
              <input className="form-input" type="number" step="0.01" value={form.importe} onChange={e => set('importe', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Frecuencia</label>
              <select className="form-select" value={form.frecuencia} onChange={e => set('frecuencia', e.target.value)}>
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
                <option value="unico">Pago único</option>
              </select>
            </div>
          </div>
          {form.frecuencia === 'unico' ? (
            <div className="form-group">
              <label className="form-label">Fecha en que se realizó / realizará el pago</label>
              <input className="form-input" type="date" value={form.fecha_cobro || ''} onChange={e => set('fecha_cobro', e.target.value || null)} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
              <div className="form-group">
                <label className="form-label">Próxima fecha de cobro <span style={{ fontSize: 10, color: 'var(--text3)' }}>(opcional)</span></label>
                <input className="form-input" type="date" value={form.fecha_cobro || ''} onChange={e => set('fecha_cobro', e.target.value || null)} />
              </div>
              <div className="form-group">
                <label className="form-label">Día del mes <span style={{ fontSize: 10, color: 'var(--text3)' }}>(para recurrentes)</span></label>
                <input className="form-input" type="number" min="1" max="31" value={form.dia_cobro || ''} onChange={e => set('dia_cobro', e.target.value ? parseInt(e.target.value) : null)} placeholder="Ej: 1, 15, 28..." />
              </div>
            </div>
          )}

          {/* Split de pago */}
          <SplitEditor form={form} set={set} />

          <div className="form-group">
            <label className="form-label">Notas <span style={{ fontSize: 10, color: 'var(--text3)' }}>(opcional)</span></label>
            <input className="form-input" value={form.notas || ''} onChange={e => set('notas', e.target.value)} placeholder="Detalles adicionales..." />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="activo" checked={form.activo} onChange={e => set('activo', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
            <label htmlFor="activo" style={{ fontSize: 13, color: 'var(--text1)', cursor: 'pointer' }}>Gasto activo</label>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => form.nombre && form.importe ? onSave(form) : alert('Rellena nombre e importe')}>
              {gasto?.id ? 'Guardar cambios' : 'Añadir gasto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Barra chart simple ───────────────────────────────────────────────────────
function BarChart({ data, maxVal, height = 140 }) {
  if (!data || !maxVal) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, padding: '0 4px' }}>
      {data.map((d, i) => {
        const pct = maxVal > 0 ? (d.valor / maxVal) * 100 : 0
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 9, color: 'var(--text3)' }}>{d.valor > 0 ? formatDec(d.valor).replace('€','').trim() : ''}</div>
            <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: d.highlight ? 'var(--accent)' : 'var(--bg4)', height: `${Math.max(pct, d.valor > 0 ? 4 : 0)}%`, minHeight: d.valor > 0 ? 4 : 0 }} />
            <div style={{ fontSize: 9, color: d.highlight ? 'var(--accent2)' : 'var(--text3)', fontWeight: d.highlight ? 600 : 400 }}>{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Modal liquidación ────────────────────────────────────────────────────────
function ModalLiquidacion({ deudor, acreedor, importe, onClose, onConfirm }) {
  const [form, setForm] = useState({
    pagador: deudor, receptor: acreedor,
    importe: importe.toFixed(2),
    fecha: new Date().toISOString().split('T')[0],
    notas: ''
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 420, border: '1px solid var(--border)', padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text0)', marginBottom: 6 }}>Registrar liquidación</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>
          <span style={{ color: 'var(--red)', fontWeight: 600 }}>{deudor}</span> paga a <span style={{ color: 'var(--green)', fontWeight: 600 }}>{acreedor}</span> para saldar la deuda
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <div className="form-group">
            <label className="form-label">Importe liquidado (€)</label>
            <input className="form-input" type="number" step="0.01" value={form.importe} onChange={e => set('importe', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input className="form-input" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Notas</label>
          <input className="form-input" value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Transferencia, Bizum..." />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => onConfirm({ ...form, importe: parseFloat(form.importe) })}>
            Confirmar liquidación
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

// ─── Modal reembolso parcial ──────────────────────────────────────────────────
function ModalReembolso({ gasto, pagos, onClose, onSave }) {
  const pagosGasto = pagos.filter(p => p.gasto_id === gasto.id && p.tipo !== 'reembolso')
  const pagadoP = pagosGasto.filter(p => p.pagado_por === 'pablo').reduce((s,p) => s + (parseFloat(p.importe)||0), 0)
  const pagadoA = pagosGasto.filter(p => p.pagado_por === 'alberto').reduce((s,p) => s + (parseFloat(p.importe)||0), 0)
  const reembolsadoAP = pagos.filter(p => p.gasto_id === gasto.id && p.tipo === 'reembolso' && p.pagado_por === 'alberto').reduce((s,p) => s + (parseFloat(p.importe)||0), 0)
  const reembolsadoPA = pagos.filter(p => p.gasto_id === gasto.id && p.tipo === 'reembolso' && p.pagado_por === 'pablo').reduce((s,p) => s + (parseFloat(p.importe)||0), 0)

  const mP = gasto.modo_pablo || 'pct'
  const mA = gasto.modo_alberto || 'pct'
  const corrP = mP === 'fijo' ? (parseFloat(gasto.fijo_pablo)||0) : (parseFloat(gasto.importe)||0) * (parseFloat(gasto.pct_pablo)||0) / 100
  const corrA = mA === 'fijo' ? (parseFloat(gasto.fijo_alberto)||0) : (parseFloat(gasto.importe)||0) * (parseFloat(gasto.pct_alberto)||0) / 100

  // Determinar quién debe a quién
  const deudaA = corrA - reembolsadoAP  // Alberto debe a Pablo
  const deudaP = corrP - reembolsadoPA  // Pablo debe a Alberto
  const quienPago = pagadoP > pagadoA ? 'pablo' : 'alberto'
  const quienDebe = pagadoP > pagadoA ? 'alberto' : 'pablo'
  const pendiente = pagadoP > pagadoA ? deudaA : deudaP

  const [form, setForm] = useState({
    gasto_id: gasto.id,
    pagado_por: quienDebe,
    importe: pendiente > 0 ? pendiente.toFixed(2) : '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
    tipo: 'reembolso',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const [saving, setSaving] = useState(false)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 460, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text0)' }}>Registrar reembolso parcial</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{gasto.nombre}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}><CloseIcon /></button>
        </div>
        <div style={{ padding: 20 }}>
          {/* Resumen situación actual */}
          <div style={{ padding: '12px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Situación actual</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { name: 'Pablo', pagado: pagadoP, corresponde: corrP, reembolsado: reembolsadoPA, color: '#6366f1' },
                { name: 'Alberto', pagado: pagadoA, corresponde: corrA, reembolsado: reembolsadoAP, color: '#06b6d4' },
              ].map(p => (
                <div key={p.name} style={{ flex: 1, padding: '10px', background: 'var(--bg1)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: p.color, marginBottom: 6 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Pagado: <span style={{ color: 'var(--text1)', fontFamily: 'var(--mono)' }}>{formatDec(p.pagado)}</span></div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Le corresponde: <span style={{ color: 'var(--text1)', fontFamily: 'var(--mono)' }}>{formatDec(p.corresponde)}</span></div>
                  {p.reembolsado > 0 && <div style={{ fontSize: 11, color: 'var(--amber)' }}>Ya reembolsado: {formatDec(p.reembolsado)}</div>}
                </div>
              ))}
            </div>
            {pendiente > 0.01 && (
              <div style={{ marginTop: 10, textAlign: 'center', fontSize: 13, color: 'var(--text0)' }}>
                <span style={{ color: 'var(--red)', fontWeight: 600 }}>{quienDebe === 'pablo' ? 'Pablo' : 'Alberto'}</span>
                {' debe a '}
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>{quienPago === 'pablo' ? 'Pablo' : 'Alberto'}</span>
                {': '}
                <strong style={{ fontFamily: 'var(--mono)', color: 'var(--amber)' }}>{formatDec(pendiente)}</strong>
                {' (pendiente)'}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">Quién hace el reembolso</label>
              <select className="form-select" value={form.pagado_por} onChange={e => set('pagado_por', e.target.value)}>
                <option value="pablo">Pablo → Alberto</option>
                <option value="alberto">Alberto → Pablo</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Importe reembolsado (€)</label>
              <input className="form-input" type="number" step="0.01" value={form.importe} onChange={e => set('importe', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input className="form-input" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Notas <span style={{ fontSize: 10, color: 'var(--text3)' }}>(Bizum, transferencia...)</span></label>
              <input className="form-input" value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Ref. Bizum, transferencia..." />
            </div>
          </div>

          {/* Nuevo pendiente tras este reembolso */}
          {form.importe && parseFloat(form.importe) > 0 && (
            <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--text2)', textAlign: 'center' }}>
              Tras este reembolso quedará pendiente:{' '}
              <strong style={{ fontFamily: 'var(--mono)', color: Math.max(0, pendiente - parseFloat(form.importe)) < 0.01 ? 'var(--green)' : 'var(--amber)' }}>
                {formatDec(Math.max(0, pendiente - parseFloat(form.importe)))}
              </strong>
              {Math.max(0, pendiente - parseFloat(form.importe)) < 0.01 && ' — Saldado ✓'}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" disabled={saving || !form.importe} onClick={async () => {
              setSaving(true)
              await onSave({ ...form, importe: parseFloat(form.importe), periodo: '' })
              setSaving(false)
            }}>
              {saving ? 'Registrando...' : 'Registrar reembolso'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── Modal Calendario de Gastos ────────────────────────────────────────────────
function ModalCalendarioGastos({ gastos, onClose }) {
  const hoy = new Date()
  const [mesVista, setMesVista] = useState(hoy.getMonth())
  const [anoVista, setAnoVista] = useState(hoy.getFullYear())
  const [filtro, setFiltro] = useState('todos') // todos | mensual | anual | unico | trimestral

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DIAS_SEMANA = ['L','M','X','J','V','S','D']

  // Calcular días del mes
  const primerDia = new Date(anoVista, mesVista, 1)
  const ultimoDia = new Date(anoVista, mesVista + 1, 0)
  const diasEnMes = ultimoDia.getDate()
  // Lunes=0 ... Domingo=6
  let inicioSemana = primerDia.getDay() - 1
  if (inicioSemana < 0) inicioSemana = 6

  // Obtener gastos activos con filtro
  const activos = gastos.filter(g => g.activo !== false)
  const filtrados = filtro === 'todos' ? activos : activos.filter(g => g.frecuencia === filtro)

  // Construir mapa dia → gastos que caen en ese dia este mes
  const gastosPorDia = {}

  filtrados.forEach(g => {
    const imp = parseFloat(g.importe) || 0

    if (g.frecuencia === 'mensual') {
      const dia = g.dia_cobro ? parseInt(g.dia_cobro) : (g.fecha_cobro ? new Date(g.fecha_cobro).getDate() : null)
      if (dia && dia >= 1 && dia <= diasEnMes) {
        if (!gastosPorDia[dia]) gastosPorDia[dia] = []
        gastosPorDia[dia].push({ ...g, imp })
      }
    }

    if (g.frecuencia === 'trimestral' || g.frecuencia === 'semestral' || g.frecuencia === 'anual') {
      if (g.fecha_cobro) {
        const fc = new Date(g.fecha_cobro + 'T12:00:00')
        const mesesIntervalo = g.frecuencia === 'trimestral' ? 3 : g.frecuencia === 'semestral' ? 6 : 12
        // Proyectar todas las ocurrencias y ver si alguna cae en este mes/año
        let fecha = new Date(fc)
        // Ir hacia atrás hasta antes del inicio del periodo
        while (fecha > new Date(anoVista, mesVista, 1)) {
          fecha = new Date(fecha.getFullYear(), fecha.getMonth() - mesesIntervalo, fecha.getDate())
        }
        // Avanzar hasta encontrar si cae en el mes visible
        while (fecha.getFullYear() < anoVista || (fecha.getFullYear() === anoVista && fecha.getMonth() <= mesVista)) {
          if (fecha.getMonth() === mesVista && fecha.getFullYear() === anoVista) {
            const dia = fecha.getDate()
            if (!gastosPorDia[dia]) gastosPorDia[dia] = []
            gastosPorDia[dia].push({ ...g, imp })
            break
          }
          fecha = new Date(fecha.getFullYear(), fecha.getMonth() + mesesIntervalo, fecha.getDate())
        }
      } else if (g.dia_cobro) {
        // Sin fecha exacta: para anual solo en enero, para trim en ene/abr/jul/oct, etc.
        const dia = parseInt(g.dia_cobro)
        if (dia >= 1 && dia <= diasEnMes) {
          let mostrar = false
          if (g.frecuencia === 'trimestral') mostrar = [1,4,7,10].includes(mesVista + 1)
          else if (g.frecuencia === 'semestral') mostrar = [1,7].includes(mesVista + 1)
          else if (g.frecuencia === 'anual') mostrar = mesVista === 0
          if (mostrar) {
            if (!gastosPorDia[dia]) gastosPorDia[dia] = []
            gastosPorDia[dia].push({ ...g, imp })
          }
        }
      }
    }

    if (g.frecuencia === 'unico') {
      // Pago único: usar fecha_cobro si existe
      const fechaRef = g.fecha_cobro || null
      if (fechaRef) {
        const fc = new Date(fechaRef + 'T12:00:00')
        if (fc.getMonth() === mesVista && fc.getFullYear() === anoVista) {
          const dia = fc.getDate()
          if (!gastosPorDia[dia]) gastosPorDia[dia] = []
          gastosPorDia[dia].push({ ...g, imp })
        }
      }
      // Si no tiene fecha, mostrar en el mes actual con dia 1 para que sea visible
    }
  })

  // Total del mes
  const totalMes = Object.values(gastosPorDia).flat().reduce((s,g) => s + g.imp, 0)

  // Colores por frecuencia
  const colorFrecuencia = { mensual:'#6366f1', trimestral:'#f59e0b', semestral:'#8b5cf6', anual:'#ef4444', unico:'#10b981' }

  const irMes = (delta) => {
    let m = mesVista + delta, a = anoVista
    if (m > 11) { m = 0; a++ }
    if (m < 0) { m = 11; a-- }
    setMesVista(m); setAnoVista(a)
  }

  // Construir celdas del calendario
  const celdas = []
  for (let i = 0; i < inicioSemana; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'var(--bg1)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:780, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', border:'1px solid var(--border)' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:'var(--text0)' }}>Calendario de gastos</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Total visible: <strong style={{ fontFamily:'var(--mono)', color:'var(--text0)' }}>{formatDec(totalMes)}</strong></div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {/* Filtros */}
            <div style={{ display:'flex', gap:4 }}>
              {[
                { id:'todos', label:'Todos' },
                { id:'mensual', label:'Mensual' },
                { id:'trimestral', label:'Trim.' },
                { id:'semestral', label:'Sem.' },
                { id:'anual', label:'Anual' },
                { id:'unico', label:'Único' },
              ].map(f => (
                <button key={f.id} onClick={() => setFiltro(f.id)} style={{ padding:'4px 10px', borderRadius:20, fontSize:11, cursor:'pointer', border:`1px solid ${filtro===f.id ? (colorFrecuencia[f.id]||'var(--accent)') : 'var(--border2)'}`, background: filtro===f.id ? (colorFrecuencia[f.id]||'var(--accent)')+'20' : 'none', color: filtro===f.id ? (colorFrecuencia[f.id]||'var(--accent2)') : 'var(--text3)', fontWeight: filtro===f.id ? 600 : 400 }}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={onClose} style={{ background:'var(--bg3)', border:'none', borderRadius:20, width:32, height:32, cursor:'pointer', color:'var(--text2)', fontSize:18, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          </div>
        </div>

        {/* Nav mes */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <button onClick={() => irMes(-1)} style={{ background:'var(--bg3)', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', color:'var(--text1)', fontSize:18 }}>‹</button>
          <div style={{ fontSize:18, fontWeight:700, color:'var(--text0)' }}>{MESES[mesVista]} {anoVista}</div>
          <button onClick={() => irMes(1)} style={{ background:'var(--bg3)', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', color:'var(--text1)', fontSize:18 }}>›</button>
        </div>

        {/* Leyenda */}
        <div style={{ display:'flex', gap:12, padding:'8px 20px', borderBottom:'1px solid var(--border)', flexShrink:0, flexWrap:'wrap' }}>
          {Object.entries(colorFrecuencia).map(([k,v]) => (
            <div key={k} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text3)' }}>
              <div style={{ width:10, height:10, borderRadius:3, background:v }} />
              {k.charAt(0).toUpperCase()+k.slice(1)}
            </div>
          ))}
        </div>

        {/* Calendário */}
        <div style={{ overflowY:'auto', flex:1, padding:'0 16px 16px' }}>
          {/* Días semana */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4, marginTop:12, marginBottom:4 }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'var(--text3)', padding:'4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Celdas */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4 }}>
            {celdas.map((dia, i) => {
              if (!dia) return <div key={`empty-${i}`} style={{ minHeight:80 }} />
              const gastosHoy = gastosPorDia[dia] || []
              const esHoy = dia === hoy.getDate() && mesVista === hoy.getMonth() && anoVista === hoy.getFullYear()
              const totalDia = gastosHoy.reduce((s,g) => s+g.imp, 0)
              return (
                <div key={dia} style={{ minHeight:80, padding:'6px 6px 4px', borderRadius:8, background: esHoy ? 'rgba(99,102,241,0.12)' : gastosHoy.length > 0 ? 'var(--bg3)' : 'var(--bg2)', border: esHoy ? '1px solid var(--accent)' : '1px solid var(--border)', position:'relative' }}>
                  <div style={{ fontSize:12, fontWeight: esHoy ? 700 : 500, color: esHoy ? 'var(--accent2)' : 'var(--text2)', marginBottom:4 }}>{dia}</div>
                  {gastosHoy.map((g,gi) => (
                    <div key={gi} title={`${g.nombre} — ${formatDec(g.imp)}`} style={{ marginBottom:2, padding:'2px 5px', borderRadius:4, background: (colorFrecuencia[g.frecuencia]||'#6366f1')+'25', borderLeft:`2px solid ${colorFrecuencia[g.frecuencia]||'#6366f1'}`, cursor:'default' }}>
                      <div style={{ fontSize:10, fontWeight:600, color:'var(--text0)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{g.nombre}</div>
                      <div style={{ fontSize:10, fontFamily:'var(--mono)', color: colorFrecuencia[g.frecuencia]||'#6366f1' }}>{formatDec(g.imp)}</div>
                    </div>
                  ))}
                  {totalDia > 0 && (
                    <div style={{ position:'absolute', bottom:3, right:5, fontSize:9, fontFamily:'var(--mono)', color:'var(--text3)', fontWeight:600 }}>{formatDec(totalDia)}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Lista del mes */}
        {Object.keys(gastosPorDia).length > 0 && (
          <div style={{ borderTop:'1px solid var(--border)', padding:'12px 20px', maxHeight:180, overflowY:'auto', flexShrink:0 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>
              Gastos en {MESES[mesVista]} ({Object.values(gastosPorDia).flat().length})
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {Object.entries(gastosPorDia).sort(([a],[b])=>parseInt(a)-parseInt(b)).map(([dia, gs]) =>
                gs.map((g,i) => (
                  <div key={`${dia}-${i}`} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, padding:'4px 8px', background:'var(--bg3)', borderRadius:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:2, background: colorFrecuencia[g.frecuencia]||'#6366f1', flexShrink:0 }} />
                      <span style={{ color:'var(--text0)', fontWeight:500 }}>Día {dia}</span>
                      <span style={{ color:'var(--text2)' }}>{g.nombre}</span>
                      <span style={{ fontSize:10, padding:'1px 6px', borderRadius:10, background:'var(--bg4)', color:'var(--text3)' }}>{g.frecuencia}</span>
                    </div>
                    <span style={{ fontFamily:'var(--mono)', fontWeight:600, color: colorFrecuencia[g.frecuencia]||'var(--text0)' }}>{formatDec(g.imp)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


// ─── Subcomponente facturas por gasto ─────────────────────────────────────────
function FacturasGasto({ gastoId, facturas, subirFactura, eliminarFactura }) {
  const [subiendo, setSubiendo] = useState(false)
  const facturasGasto = facturas.filter(f => f.gasto_id === gastoId)

  return (
    <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: facturasGasto.length > 0 ? 8 : 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Facturas adjuntas ({facturasGasto.length})
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg3)', cursor: subiendo ? 'wait' : 'pointer', fontSize: 11, color: 'var(--accent2)', fontWeight: 500 }}>
          <UploadIcon /> {subiendo ? 'Subiendo...' : 'Adjuntar factura'}
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }} disabled={subiendo} onChange={async e => {
            const file = e.target.files[0]
            if (!file) return
            setSubiendo(true)
            await subirFactura(gastoId, file)
            setSubiendo(false)
            e.target.value = ''
          }} />
        </label>
      </div>
      {facturasGasto.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {facturasGasto.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg3)', borderRadius: 6 }}>
              <FileIcon />
              <span style={{ fontSize: 12, color: 'var(--text1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.nombre}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>{f.tamano ? `${(f.tamano/1024).toFixed(0)} KB` : ''}</span>
              <a href={f.url} target="_blank" rel="noopener noreferrer" download style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent2)', textDecoration: 'none', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)' }}>
                <DownloadIcon /> Ver / Descargar
              </a>
              <button className="btn-icon" style={{ width: 24, height: 24, color: 'var(--red)', flexShrink: 0 }} onClick={() => eliminarFactura(f.id, f.storage_path)} title="Eliminar factura"><TrashIcon /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Gastos() {
  const { gastos, crear, actualizar, eliminar } = useGastos()
  const { pagos, registrar: registrarPago, eliminar: eliminarPago } = usePagosGastos()
  const { facturas, subir: subirFactura, eliminar: eliminarFactura } = useFacturasGastos()
  const { liquidaciones, crear: crearLiquidacion } = useLiquidaciones()
  const [modal, setModal] = useState(null)
  const [pagoModal, setPagoModal] = useState(null)
  const [liquidacionModal, setLiquidacionModal] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroCat, setFiltroCat] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [verHistorial, setVerHistorial] = useState(null)
  const [reembolsoModal, setReembolsoModal] = useState(null)
  const [calendarioModal, setCalendarioModal] = useState(false)

  const activos = gastos.filter(g => g.activo !== false)

  // ── Cálculos KPI ────────────────────────────────────────────────────────────
  const totalMensual = activos.reduce((s, g) => s + importeMensual(g), 0)
  const totalAnual = activos.reduce((s, g) => s + importeAnual(g), 0)
  const totalFijo = activos.filter(g => g.tipo === 'fijo').reduce((s, g) => s + importeMensual(g), 0)
  const totalVariable = activos.filter(g => g.tipo === 'variable').reduce((s, g) => s + importeMensual(g), 0)

  // Total pagado por cada uno (pagos registrados reales)
  const totalPagadoP = pagos.filter(p => p.pagado_por === 'pablo').reduce((s, p) => s + (parseFloat(p.importe) || 0), 0)
  const totalPagadoA = pagos.filter(p => p.pagado_por === 'alberto').reduce((s, p) => s + (parseFloat(p.importe) || 0), 0)

  // Lo que debería pagar cada uno según % (mensual)
  // Calcular lo que debería pagar cada uno respetando imputar y modo fijo/pct
  const calcParte = (g, persona) => {
    const imp = importeMensual(g)
    if (imp <= 0) return 0
    const modo = g[`modo_${persona}`] || 'pct'
    if (modo === 'fijo') {
      const fijo = parseFloat(g[`fijo_${persona}`]) || 0
      const impTotal = parseFloat(g.importe) || 0
      return impTotal > 0 ? imp * (fijo / impTotal) : 0
    }
    return imp * (parseFloat(g[`pct_${persona}`]) || 0) / 100
  }
  const deberiaP = activos.reduce((s, g) => s + calcParte(g, 'pablo'), 0)
  const deberiaA = activos.reduce((s, g) => s + calcParte(g, 'alberto'), 0)

  // Total liquidaciones
  const totalLiqP = liquidaciones.filter(l => l.pagador === 'pablo').reduce((s, l) => s + (parseFloat(l.importe)||0), 0)
  const totalLiqA = liquidaciones.filter(l => l.pagador === 'alberto').reduce((s, l) => s + (parseFloat(l.importe)||0), 0)

  // Deuda neta: pagado - debería pagar + liquidaciones recibidas - liquidaciones pagadas
  const saldoP = totalPagadoP - deberiaP * (pagos.length > 0 ? 1 : 0) + totalLiqA - totalLiqP
  const saldoA = totalPagadoA - deberiaA * (pagos.length > 0 ? 1 : 0) + totalLiqP - totalLiqA

  // Deuda simple: quien pagó más de lo que le tocaba
  let deudorNombre = null, acreedorNombre = null, cantidadDeuda = 0
  if (pagos.length > 0) {
    const diffP = totalPagadoP - deberiaP
    const diffA = totalPagadoA - deberiaA
    if (diffA < -0.01) { deudorNombre = 'Alberto'; acreedorNombre = 'Pablo'; cantidadDeuda = Math.abs(diffA) }
    else if (diffP < -0.01) { deudorNombre = 'Pablo'; acreedorNombre = 'Alberto'; cantidadDeuda = Math.abs(diffP) }
  }

  // Gastos del mes pendientes de confirmar pago
  const pendientesMes = activos.filter(g => {
    if (g.frecuencia !== 'mensual') return false
    const yaRegistrado = pagos.some(p => p.gasto_id === g.id && p.periodo?.startsWith(`${ANO_ACTUAL}-${String(MES_ACTUAL).padStart(2,'0')}`))
    return !yaRegistrado
  })

  // Gráfico mensual
  const dataMensual = MESES.map((label, i) => ({
    label,
    valor: activos.filter(g => g.tipo === 'fijo').reduce((s, g) => {
      const m = i + 1
      if (g.frecuencia === 'mensual') return s + parseFloat(g.importe)
      if (g.frecuencia === 'trimestral' && m % 3 === 1) return s + parseFloat(g.importe)
      if (g.frecuencia === 'semestral' && (m === 1 || m === 7)) return s + parseFloat(g.importe)
      if (g.frecuencia === 'anual' && m === 1) return s + parseFloat(g.importe)
      return s
    }, 0) + activos.filter(g => g.tipo === 'variable').reduce((s, g) => g.frecuencia === 'mensual' ? s + parseFloat(g.importe) : s, 0),
    highlight: i + 1 === MES_ACTUAL
  }))
  const maxMensual = Math.max(...dataMensual.map(d => d.valor), 1)

  // Por categoría
  const allCats = [...new Set(activos.map(g => g.categoria))]
  const porCategoria = allCats.map(cat => ({
    label: cat?.slice(0, 4).toUpperCase() || 'OTRO',
    fullLabel: cat,
    valor: activos.filter(g => g.categoria === cat).reduce((s, g) => s + importeAnual(g), 0),
    color: CAT_COLORS[cat] || '#6b7280'
  })).filter(d => d.valor > 0).sort((a, b) => b.valor - a.valor)
  const maxCat = Math.max(...porCategoria.map(d => d.valor), 1)

  const gastosFiltrados = useMemo(() => {
    let lista = [...gastos]
    if (filtroTipo !== 'todos') lista = lista.filter(g => g.tipo === filtroTipo)
    if (filtroCat) lista = lista.filter(g => g.categoria === filtroCat)
    return lista
  }, [gastos, filtroTipo, filtroCat])

  const handleSave = async (form) => {
    if (form.id) await actualizar(form.id, form)
    else await crear(form)
    setModal(null)
  }

  // Resumen para compartir por WA
  const generarResumenWA = () => {
    const lines = [
      `*Resumen gastos ${MES_LABEL} ${ANO_ACTUAL}*`,
      ``,
      `Total mensual: ${formatDec(totalMensual)}`,
      `Pablo pagado: ${formatDec(totalPagadoP)} | Debería: ${formatDec(deberiaP)}`,
      `Alberto pagado: ${formatDec(totalPagadoA)} | Debería: ${formatDec(deberiaA)}`,
      ``,
      deudorNombre ? `*${deudorNombre} debe a ${acreedorNombre}: ${formatDec(cantidadDeuda)}*` : `*Sin deudas pendientes*`,
      ``,
      `Pagos sin confirmar este mes: ${pendientesMes.length}`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    alert('Resumen copiado al portapapeles')
  }

  return (
    <Layout title="Gastos empresa" subtitle="Control de costes y reparto" actions={
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setCalendarioModal(true)} style={{ gap: 5 }} title="Ver calendario de gastos"><CalendarIcon /> Calendario</button>
        <button className="btn btn-ghost btn-sm" onClick={generarResumenWA} style={{ gap: 5 }}><ShareIcon /> Resumen</button>
        <button className="btn btn-primary" onClick={() => setModal({})}><PlusIcon /> Nuevo gasto</button>
      </div>
    }>

      {/* Alerta pendientes del mes */}
      {pendientesMes.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--amber)' }}>⚠ {pendientesMes.length} gasto{pendientesMes.length > 1 ? 's' : ''} mensual{pendientesMes.length > 1 ? 'es' : ''} sin confirmar pago en {MES_LABEL}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{pendientesMes.map(g => g.nombre).join(', ')}</span>
        </div>
      )}

      {/* Próximos cobros */}
      {(() => {
        const hoy = new Date()
        const en7dias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)
        const cobrosProximos = activos.filter(g => {
          if (!['mensual','trimestral','semestral','anual'].includes(g.frecuencia)) return false
          if (g.fecha_cobro) {
            const fc = new Date(g.fecha_cobro)
            return fc >= hoy && fc <= en7dias
          }
          if (!g.dia_cobro) return false
          const dia = parseInt(g.dia_cobro)
          const mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), dia)
          const mesSig = new Date(hoy.getFullYear(), hoy.getMonth() + 1, dia)
          return (mesActual >= hoy && mesActual <= en7dias) || (mesSig >= hoy && mesSig <= en7dias)
        }).map(g => {
          let fecha
          if (g.fecha_cobro) {
            fecha = new Date(g.fecha_cobro)
          } else {
            const dia = parseInt(g.dia_cobro)
            const mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), dia)
            fecha = mesActual >= hoy ? mesActual : new Date(hoy.getFullYear(), hoy.getMonth() + 1, dia)
          }
          const diasRestantes = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24))
          return { ...g, fecha, diasRestantes }
        }).sort((a, b) => a.diasRestantes - b.diasRestantes)

        if (cobrosProximos.length === 0) return null
        return (
          <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 'var(--radius)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent2)', flexShrink: 0 }}>📅 Próximos 7 días:</span>
            {cobrosProximos.map(g => (
              <span key={g.id} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: g.diasRestantes === 0 ? 'rgba(239,68,68,0.15)' : g.diasRestantes <= 2 ? 'rgba(245,158,11,0.15)' : 'var(--bg4)', color: g.diasRestantes === 0 ? 'var(--red)' : g.diasRestantes <= 2 ? 'var(--amber)' : 'var(--text2)', fontWeight: 500 }}>
                {g.nombre} — día {g.dia_cobro} ({g.diasRestantes === 0 ? 'hoy' : `en ${g.diasRestantes}d`}) — {formatDec(g.importe)}
              </span>
            ))}
          </div>
        )
      })()}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Coste mensual', value: formatDec(totalMensual), sub: 'todos los gastos activos', color: 'var(--accent2)', big: true },
          { label: 'Coste anual', value: formatDec(totalAnual), sub: 'proyección anual', color: 'var(--text0)' },
          { label: 'Fijos / mes', value: formatDec(totalFijo), sub: `${totalMensual > 0 ? Math.round(totalFijo/totalMensual*100) : 0}% del total`, color: '#6366f1' },
          { label: 'Variables / mes', value: formatDec(totalVariable), sub: `${totalMensual > 0 ? Math.round(totalVariable/totalMensual*100) : 0}% del total`, color: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
            <div style={{ fontSize: s.big ? 22 : 18, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <SplitGastosWidget onLiquidacion={() => setLiquidacionModal(true)} />
      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text0)', marginBottom: 4 }}>Gastos por mes — {ANO_ACTUAL}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>Mes actual destacado</div>
          <BarChart data={dataMensual} maxVal={maxMensual} height={130} />
        </div>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text0)', marginBottom: 4 }}>Por categoría (anual)</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>Proyección {ANO_ACTUAL}</div>
          {porCategoria.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '30px 0' }}>Sin datos</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {porCategoria.slice(0, 6).map(d => (
                <div key={d.fullLabel} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text2)', width: 90, textTransform: 'capitalize' }}>{d.fullLabel}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(d.valor / maxCat) * 100}%`, background: d.color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text1)', width: 80, textAlign: 'right' }}>{formatDec(d.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista gastos */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text0)' }}>Todos los gastos ({gastos.length})</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {['todos', 'fijo', 'variable'].map(t => (
                <button key={t} onClick={() => setFiltroTipo(t)} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: `1px solid ${filtroTipo === t ? 'var(--accent)' : 'var(--border2)'}`, background: filtroTipo === t ? 'var(--accent-dim)' : 'none', color: filtroTipo === t ? 'var(--accent2)' : 'var(--text3)', fontWeight: filtroTipo === t ? 600 : 400 }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <select className="form-select" style={{ height: 28, fontSize: 11, padding: '0 8px', width: 140 }} value={filtroCat} onChange={e => setFiltroCat(e.target.value)}>
              <option value="">Todas las categorías</option>
              {[...new Set(gastos.map(g => g.categoria))].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {gastosFiltrados.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            {gastos.length === 0 ? 'Añade tu primer gasto' : 'Sin gastos con estos filtros'}
          </div>
        ) : (
          <div>
            {gastosFiltrados.map((g, i) => {
              const catColor = CAT_COLORS[g.categoria] || '#6b7280'
              const mensual = importeMensual(g)
              const anual = importeAnual(g)
              const pagosGasto = pagos.filter(p => p.gasto_id === g.id)
              const totalPagadoGasto = pagosGasto.filter(p => p.tipo !== 'reembolso').reduce((s, p) => s + (parseFloat(p.importe)||0), 0)
              const esMes = g.frecuencia === 'mensual'
              const yaConfirmadoMes = esMes && pagosGasto.some(p => p.periodo?.startsWith(`${ANO_ACTUAL}-${String(MES_ACTUAL).padStart(2,'0')}`))
              const isExpanded = expanded === g.id

              return (
                <div key={g.id} style={{ borderBottom: i < gastosFiltrados.length - 1 ? '1px solid var(--border)' : 'none', opacity: g.activo === false ? 0.5 : 1 }}>
                  {/* Fila principal */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: catColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text0)' }}>{g.nombre}</span>
                        <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: g.tipo === 'fijo' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)', color: g.tipo === 'fijo' ? '#6366f1' : 'var(--amber)', fontWeight: 500 }}>
                          {g.tipo === 'fijo' ? 'Fijo' : 'Variable'}
                        </span>
                        <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: 'var(--bg4)', color: 'var(--text3)' }}>{g.categoria}</span>
                        {esMes && (
                          <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: yaConfirmadoMes ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: yaConfirmadoMes ? 'var(--green)' : 'var(--amber)', fontWeight: 500 }}>
                            {yaConfirmadoMes ? '✓ ' + MES_LABEL : '⏳ ' + MES_LABEL}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {formatDec(parseFloat(g.importe))} {g.frecuencia === 'mensual' ? '/mes' : g.frecuencia === 'trimestral' ? '/trimestre' : g.frecuencia === 'semestral' ? '/semestre' : g.frecuencia === 'anual' ? '/año' : '(único)'}
                        {g.fecha_cobro ? ` · próx. cobro: ${g.fecha_cobro}` : g.dia_cobro ? ` · día ${g.dia_cobro}` : ''}
                        {` · P:${g.pct_pablo||50}% A:${g.pct_alberto||50}%`}
                        {pagosGasto.length > 0 ? ` · ${pagosGasto.length} pago${pagosGasto.length > 1 ? 's' : ''} (${formatDec(totalPagadoGasto)})` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {mensual > 0 && <div style={{ textAlign: 'right', marginRight: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text0)' }}>{formatDec(mensual)}<span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'inherit', fontWeight: 400 }}>/mes</span></div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{formatDec(anual)}/año</div>
                      </div>}
                      <button className="btn btn-ghost btn-sm" onClick={() => setPagoModal(g)} style={{ fontSize: 11, gap: 4, color: 'var(--green)', borderColor: 'rgba(16,185,129,0.3)' }} title="Registrar pago">
                        <CheckIcon /> Pago
                      </button>
                      <button className="btn-icon" style={{ width: 28, height: 28, color: 'var(--text3)' }} onClick={() => setModal(g)}><EditIcon /></button>
                      <button className="btn-icon" style={{ width: 28, height: 28, color: 'var(--red)' }} onClick={() => setConfirmDelete(g)}><TrashIcon /></button>
                      <button className="btn-icon" style={{ width: 28, height: 28, color: 'var(--text3)' }} onClick={() => setExpanded(isExpanded ? null : g.id)}><ChevronIcon open={isExpanded} /></button>
                    </div>
                  </div>

                  {/* Historial de pagos expandible */}
                  {isExpanded && (
                    <div style={{ padding: '0 18px 14px 66px', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                          Historial de pagos ({pagosGasto.length})
                          {pagosGasto.length > 0 && <span style={{ fontFamily: 'var(--mono)', color: 'var(--text1)', marginLeft: 10, textTransform: 'none', fontWeight: 400 }}>Total: {formatDec(totalPagadoGasto)}</span>}
                        </div>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, gap: 4, color: 'var(--amber)' }} onClick={() => setReembolsoModal(g)}>
                          + Reembolso parcial
                        </button>
                      </div>
                      {pagosGasto.length === 0 ? (
                        <div style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>Sin pagos registrados aún</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {pagosGasto.map(p => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: p.tipo === 'reembolso' ? 'rgba(245,158,11,0.08)' : 'var(--bg3)', borderRadius: 8, border: p.tipo === 'reembolso' ? '1px solid rgba(245,158,11,0.2)' : 'none' }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: p.pagado_por === 'pablo' ? 'rgba(99,102,241,0.15)' : 'rgba(6,182,212,0.15)', color: p.pagado_por === 'pablo' ? '#6366f1' : '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                {p.tipo === 'reembolso' ? '↩' : (p.pagado_por === 'pablo' ? 'P' : 'A')}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text0)' }}>
                                  {p.tipo === 'reembolso'
                                    ? <span style={{ color: 'var(--amber)' }}>Reembolso: {p.pagado_por === 'pablo' ? 'Pablo' : 'Alberto'} → {p.pagado_por === 'pablo' ? 'Alberto' : 'Pablo'}</span>
                                    : (p.pagado_por === 'pablo' ? 'Pablo' : 'Alberto')}
                                  <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>· {formatDate(p.fecha)}</span>
                                  {p.periodo && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8 }}>Periodo: {p.periodo}</span>}
                                </div>
                                {p.notas && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.notas}</div>}
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: p.tipo === 'reembolso' ? 'var(--amber)' : 'var(--green)' }}>{formatDec(p.importe)}</span>
                              <button className="btn-icon" style={{ width: 24, height: 24, color: 'var(--red)' }} onClick={() => eliminarPago(p.id)} title="Eliminar registro"><TrashIcon /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Facturas adjuntas */}
                      <FacturasGasto gastoId={g.id} facturas={facturas} subirFactura={subirFactura} eliminarFactura={eliminarFactura} />

                      {/* Split esperado */}
                      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                        {[{ name: 'Pablo', key: 'pablo' }, { name: 'Alberto', key: 'alberto' }].map(p => {
                          const imputado = g[`imputar_${p.key}`] !== false
                          const modo = g[`modo_${p.key}`] || 'pct'
                          const pct = parseFloat(g[`pct_${p.key}`]) || 0
                          const fijo = parseFloat(g[`fijo_${p.key}`]) || 0
                          const fraccion = modo === 'fijo' && parseFloat(g.importe) > 0 ? fijo / parseFloat(g.importe) : pct / 100
                          const pagadoPers = pagosGasto.filter(pg => pg.pagado_por === p.key).reduce((s, pg) => s + (parseFloat(pg.importe)||0), 0)
                          const deberiaTotal = imputado ? totalPagadoGasto * fraccion : 0
                          const diff = pagadoPers - deberiaTotal
                          return (
                            <div key={p.name} style={{ flex: 1, padding: '8px 10px', background: 'var(--bg2)', borderRadius: 8, textAlign: 'center' }}>
                              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{p.name}{imputado ? ` (${modo==='fijo' ? formatDec(fijo)+' fijo' : pct+'%'})` : ' (no imputado)'}</div>
                              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)', color: Math.abs(diff) < 0.01 ? 'var(--green)' : diff > 0 ? 'var(--green)' : 'var(--red)' }}>
                                {formatDec(pagadoPers)} pagado
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text3)' }}>Debería: {formatDec(deberiaTotal)}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Totales filtrados */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 18px', borderTop: '2px solid var(--border)', gap: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                Filtrado/mes: <strong style={{ color: 'var(--text0)', fontFamily: 'var(--mono)' }}>{formatDec(gastosFiltrados.filter(g=>g.activo!==false).reduce((s,g)=>s+importeMensual(g),0))}</strong>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                Filtrado/año: <strong style={{ color: 'var(--text0)', fontFamily: 'var(--mono)' }}>{formatDec(gastosFiltrados.filter(g=>g.activo!==false).reduce((s,g)=>s+importeAnual(g),0))}</strong>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                Total pagado: <strong style={{ color: 'var(--green)', fontFamily: 'var(--mono)' }}>{formatDec(totalPagadoP + totalPagadoA)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {modal !== null && <ModalGasto gasto={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />}
      {calendarioModal && <ModalCalendarioGastos gastos={gastos} onClose={() => setCalendarioModal(false)} />}
      {reembolsoModal && <ModalReembolso gasto={reembolsoModal} pagos={pagos} onClose={() => setReembolsoModal(null)} onSave={async (data) => { await registrarPago(data); setReembolsoModal(null) }} />}
      {pagoModal && <ModalRegistrarPago gasto={pagoModal} onClose={() => setPagoModal(null)} onSave={async (data) => { await registrarPago(data); setPagoModal(null) }} />}
      {liquidacionModal && deudorNombre && (
        <ModalLiquidacion
          deudor={deudorNombre} acreedor={acreedorNombre} importe={cantidadDeuda}
          onClose={() => setLiquidacionModal(false)}
          onConfirm={async (data) => { await crearLiquidacion(data); setLiquidacionModal(false) }}
        />
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: '24px', maxWidth: 360, width: '100%', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)', marginBottom: 8 }}>Eliminar "{confirmDelete.nombre}"?</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>Se eliminarán también todos los pagos registrados.</div>
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
