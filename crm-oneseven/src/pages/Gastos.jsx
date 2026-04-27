import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useGastos } from '../hooks/useData'
import { formatEur } from '../lib/constants'
const formatDec = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(n) || 0)

function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg> }
function EditIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2l2 2-7 7H2V9L9 2z"/></svg> }
function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h9M5 3V2h3v1M3 3l.5 8h6l.5-8"/></svg> }
function CloseIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg> }

const CATEGORIAS = ['software', 'marketing', 'personal', 'oficina', 'servicios', 'infraestructura', 'formacion', 'legal', 'bancario', 'otros']
const CAT_COLORS = { software: '#6366f1', marketing: '#ec4899', personal: '#f59e0b', oficina: '#10b981', servicios: '#3b82f6', infraestructura: '#8b5cf6', formacion: '#06b6d4', legal: '#ef4444', bancario: '#84cc16', otros: '#6b7280' }
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const ANO_ACTUAL = new Date().getFullYear()
const MES_ACTUAL = new Date().getMonth() + 1

// Calcula el importe mensual de un gasto según su frecuencia
function importeMensual(g) {
  const imp = parseFloat(g.importe) || 0
  switch (g.frecuencia) {
    case 'mensual': return imp
    case 'trimestral': return imp / 3
    case 'semestral': return imp / 6
    case 'anual': return imp / 12
    case 'unico': return 0 // no recurrente
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

// ─── Grafico de barras simple ─────────────────────────────────────────────────
function BarChart({ data, maxVal, height = 160 }) {
  if (!data || !maxVal) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, padding: '0 4px' }}>
      {data.map((d, i) => {
        const pct = maxVal > 0 ? (d.valor / maxVal) * 100 : 0
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.1 }}>
              {d.valor > 0 ? formatEur(d.valor).replace('€','').trim() : ''}
            </div>
            <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: d.highlight ? 'var(--accent)' : 'var(--bg4)', height: `${Math.max(pct, d.valor > 0 ? 4 : 0)}%`, transition: 'height 0.3s', position: 'relative', minHeight: d.valor > 0 ? 4 : 0 }}>
              {d.fijo !== undefined && d.fijo > 0 && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${d.valor > 0 ? (d.fijo/d.valor)*100 : 0}%`, background: '#6366f1', borderRadius: '4px 4px 0 0', minHeight: 2 }} />
              )}
            </div>
            <div style={{ fontSize: 9, color: d.highlight ? 'var(--accent2)' : 'var(--text3)', fontWeight: d.highlight ? 600 : 400, textAlign: 'center' }}>{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Modal gasto ──────────────────────────────────────────────────────────────
function ModalGasto({ gasto, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: '', categoria: 'software', categoria_custom: '', tipo: 'fijo',
    importe: '', frecuencia: 'mensual', dia_cobro: '', activo: true, notas: '',
    ...gasto,
  })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const esPersonalizada = form.categoria === '__custom__'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 500, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text0)' }}>{gasto?.id ? 'Editar gasto' : 'Nuevo gasto'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}><CloseIcon /></button>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="form-group">
            <label className="form-label">Nombre del gasto *</label>
            <input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Suscripcion n8n, Alquiler oficina..." autoFocus />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select className="form-select" value={esPersonalizada ? '__custom__' : form.categoria} onChange={e => {
                if (e.target.value === '__custom__') { set('categoria', '__custom__') }
                else { set('categoria', e.target.value); set('categoria_custom', '') }
              }}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                <option value="__custom__">+ Personalizada...</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                <option value="fijo">Fijo</option>
                <option value="variable">Variable</option>
              </select>
            </div>
          </div>

          {esPersonalizada && (
            <div className="form-group">
              <label className="form-label">Nombre de categoria personalizada *</label>
              <input className="form-input" value={form.categoria_custom} onChange={e => set('categoria_custom', e.target.value)} placeholder="Ej: Subscripciones IA, Transporte..." />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">Importe (EUR)</label>
              <input className="form-input" type="number" step="0.01" value={form.importe} onChange={e => set('importe', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Frecuencia</label>
              <select className="form-select" value={form.frecuencia} onChange={e => set('frecuencia', e.target.value)}>
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
                <option value="unico">Pago unico</option>
              </select>
            </div>
          </div>

          {form.frecuencia !== 'unico' && (
            <div className="form-group">
              <label className="form-label">
                Dia del mes en que se cobra
                <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(opcional — ej: 1, 15, 28...)</span>
              </label>
              <input
                className="form-input"
                type="number"
                min="1" max="31"
                value={form.dia_cobro || ''}
                onChange={e => set('dia_cobro', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Ej: 1 para el primero de cada mes"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Notas <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>(opcional)</span></label>
            <input className="form-input" value={form.notas || ''} onChange={e => set('notas', e.target.value)} placeholder="Detalles adicionales..." />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="activo" checked={form.activo} onChange={e => set('activo', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
            <label htmlFor="activo" style={{ fontSize: 13, color: 'var(--text1)', cursor: 'pointer' }}>Gasto activo (incluir en calculos)</label>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => {
              if (!form.nombre || !form.importe) return alert('Rellena nombre e importe')
              if (esPersonalizada && !form.categoria_custom) return alert('Escribe el nombre de la categoria personalizada')
              const payload = {
                ...form,
                categoria: esPersonalizada ? form.categoria_custom : form.categoria,
                categoria_custom: esPersonalizada ? form.categoria_custom : '',
                importe: parseFloat(form.importe),
                dia_cobro: form.dia_cobro ? parseInt(form.dia_cobro) : null,
              }
              onSave(payload)
            }}>
              {gasto?.id ? 'Guardar cambios' : 'Anadir gasto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Pagina principal ─────────────────────────────────────────────────────────
export default function Gastos() {
  const { gastos, crear, actualizar, eliminar } = useGastos()
  const [modal, setModal] = useState(null) // null | {} | {id,...}
  const [vistaGrafico, setVistaGrafico] = useState('mensual') // mensual | anual
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroCat, setFiltroCat] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const activos = gastos.filter(g => g.activo !== false)

  const totalMensual = activos.reduce((s, g) => s + importeMensual(g), 0)
  const totalAnual = activos.reduce((s, g) => s + importeAnual(g), 0)
  const totalFijo = activos.filter(g => g.tipo === 'fijo').reduce((s, g) => s + importeMensual(g), 0)
  const totalVariable = activos.filter(g => g.tipo === 'variable').reduce((s, g) => s + importeMensual(g), 0)

  // Datos para grafico mensual (12 meses del ano actual)
  const dataMensual = MESES.map((label, i) => {
    const mes = i + 1
    const fijo = activos.filter(g => g.tipo === 'fijo').reduce((s, g) => {
      if (g.frecuencia === 'mensual') return s + parseFloat(g.importe)
      if (g.frecuencia === 'trimestral' && mes % 3 === 1) return s + parseFloat(g.importe)
      if (g.frecuencia === 'semestral' && (mes === 1 || mes === 7)) return s + parseFloat(g.importe)
      if (g.frecuencia === 'anual' && mes === 1) return s + parseFloat(g.importe)
      return s
    }, 0)
    const variable = activos.filter(g => g.tipo === 'variable').reduce((s, g) => {
      if (g.frecuencia === 'mensual') return s + parseFloat(g.importe)
      return s
    }, 0)
    return { label, valor: fijo + variable, fijo, highlight: mes === MES_ACTUAL }
  })

  // Datos para grafico anual (por categoria)
  const porCategoria = CATEGORIAS.map(cat => {
    const total = activos.filter(g => g.categoria === cat).reduce((s, g) => s + importeAnual(g), 0)
    return { label: cat.slice(0, 3).toUpperCase(), valor: total, color: CAT_COLORS[cat] }
  }).filter(d => d.valor > 0).sort((a, b) => b.valor - a.valor)

  const maxMensual = Math.max(...dataMensual.map(d => d.valor), 1)
  const maxCat = Math.max(...porCategoria.map(d => d.valor), 1)

  // Lista filtrada
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

  return (
    <Layout title="Gastos empresa" subtitle="Control de costes fijos y variables" actions={
      <button className="btn btn-primary" onClick={() => setModal({})}><PlusIcon /> Nuevo gasto</button>
    }>
      {/* KPIs principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Coste mensual total', value: formatDec(totalMensual), sub: 'gastos activos', color: 'var(--accent2)', big: true },
          { label: 'Coste anual total', value: formatDec(totalAnual), sub: 'proyeccion', color: 'var(--text0)' },
          { label: 'Costes fijos / mes', value: formatDec(totalFijo), sub: `${totalMensual > 0 ? Math.round(totalFijo/totalMensual*100) : 0}% del total`, color: '#6366f1' },
          { label: 'Costes variables / mes', value: formatDec(totalVariable), sub: `${totalMensual > 0 ? Math.round(totalVariable/totalMensual*100) : 0}% del total`, color: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
            <div style={{ fontSize: s.big ? 22 : 18, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Graficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {/* Grafico mensual */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text0)' }}>Gastos por mes — {ANO_ACTUAL}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Morado = fijo · Gris = variable</div>
            </div>
          </div>
          <BarChart data={dataMensual} maxVal={maxMensual} height={140} />
          <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1' }} /> Fijo
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--bg4)' }} /> Variable
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--accent2)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)' }} /> Mes actual
            </div>
          </div>
        </div>

        {/* Grafico por categoria */}
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text0)' }}>Distribucion anual por categoria</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Total proyectado {ANO_ACTUAL}</div>
          </div>
          {porCategoria.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '30px 0' }}>Sin datos todavia</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {porCategoria.slice(0, 6).map(d => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[gastos.find(g => g.categoria?.slice(0,3).toUpperCase() === d.label)?.categoria] || '#6b7280', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text2)', width: 90, textTransform: 'capitalize' }}>{d.label}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(d.valor / maxCat) * 100}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text1)', width: 80, textAlign: 'right' }}>{formatEur(d.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista de gastos */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header lista */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text0)' }}>Todos los gastos ({gastos.length})</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Filtro tipo */}
            <div style={{ display: 'flex', gap: 4 }}>
              {['todos', 'fijo', 'variable'].map(t => (
                <button key={t} onClick={() => setFiltroTipo(t)} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: `1px solid ${filtroTipo === t ? 'var(--accent)' : 'var(--border2)'}`, background: filtroTipo === t ? 'var(--accent-dim)' : 'none', color: filtroTipo === t ? 'var(--accent2)' : 'var(--text3)', fontWeight: filtroTipo === t ? 600 : 400 }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <select className="form-select" style={{ height: 28, fontSize: 11, padding: '0 8px', width: 130 }} value={filtroCat} onChange={e => setFiltroCat(e.target.value)}>
              <option value="">Todas las categorias</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {gastosFiltrados.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            {gastos.length === 0 ? 'Anadir tu primer gasto para empezar' : 'No hay gastos con estos filtros'}
          </div>
        ) : (
          <div>
            {gastosFiltrados.map((g, i) => {
              const catColor = CAT_COLORS[g.categoria] || '#6b7280'
              const mensual = importeMensual(g)
              const anual = importeAnual(g)
              return (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < gastosFiltrados.length - 1 ? '1px solid var(--border)' : 'none', opacity: g.activo === false ? 0.5 : 1 }}>
                  {/* Indicador categoria */}
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: catColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text0)' }}>{g.nombre}</span>
                      <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: g.tipo === 'fijo' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)', color: g.tipo === 'fijo' ? '#6366f1' : 'var(--amber)', fontWeight: 500 }}>
                        {g.tipo === 'fijo' ? 'Fijo' : 'Variable'}
                      </span>
                      <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: 'var(--bg4)', color: 'var(--text3)' }}>
                        {g.categoria}
                      </span>
                      {g.activo === false && <span style={{ fontSize: 10, color: 'var(--red)' }}>Inactivo</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {formatEur(parseFloat(g.importe))} {g.frecuencia === 'mensual' ? '/mes' : g.frecuencia === 'trimestral' ? '/trimestre' : g.frecuencia === 'semestral' ? '/semestre' : g.frecuencia === 'anual' ? '/ano' : '(pago unico)'}
                      {g.dia_cobro ? ` · cobra el dia ${g.dia_cobro}` : ''}
                      {g.notas ? ` · ${g.notas}` : ''}
                    </div>
                  </div>

                  {/* Importes */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {mensual > 0 && <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text0)' }}>{formatDec(mensual)}<span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'inherit', fontWeight: 400 }}>/mes</span></div>}
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{formatDec(anual)}/ano</div>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button className="btn-icon" style={{ width: 28, height: 28, color: 'var(--text3)' }} onClick={() => setModal(g)}><EditIcon /></button>
                    <button className="btn-icon" style={{ width: 28, height: 28, color: 'var(--red)' }} onClick={() => setConfirmDelete(g)}><TrashIcon /></button>
                  </div>
                </div>
              )
            })}

            {/* Total lista */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 18px', borderTop: '2px solid var(--border)', gap: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                Total filtrado: <strong style={{ color: 'var(--text0)', fontFamily: 'var(--mono)' }}>{formatDec(gastosFiltrados.filter(g=>g.activo!==false).reduce((s,g)=>s+importeMensual(g),0))}/mes</strong>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                Anual: <strong style={{ color: 'var(--text0)', fontFamily: 'var(--mono)' }}>{formatDec(gastosFiltrados.filter(g=>g.activo!==false).reduce((s,g)=>s+importeAnual(g),0))}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <ModalGasto gasto={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: '24px', maxWidth: 360, width: '100%', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)', marginBottom: 8 }}>Eliminar "{confirmDelete.nombre}"?</div>
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
