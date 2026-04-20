import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useIngresos } from '../hooks/useData'
import { useClientes } from '../hooks/useData'
import { formatEur, formatDate, OBJETIVO_ANUAL } from '../lib/constants'

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg>
}
function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
}

const OBJETIVO_MENSUAL_ALBERTO = 8000

export default function Ingresos() {
  const { ingresos, crear, actualizar, eliminar } = useIngresos()
  const { clientes } = useClientes()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ cliente_id: '', concepto: '', importe: '', fecha: new Date().toISOString().split('T')[0], cobrado: false, responsable: 'pablo' })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const ahora = new Date()
  const mesActual = ahora.getMonth()
  const anioActual = ahora.getFullYear()

  const stats = useMemo(() => {
    const cobrados = ingresos.filter(i => i.cobrado)
    const anual = cobrados.filter(i => new Date(i.fecha).getFullYear() === anioActual).reduce((s, i) => s + (i.importe || 0), 0)
    const mensual = cobrados.filter(i => { const d = new Date(i.fecha); return d.getMonth() === mesActual && d.getFullYear() === anioActual }).reduce((s, i) => s + (i.importe || 0), 0)
    const mensualAlberto = cobrados.filter(i => { const d = new Date(i.fecha); return d.getMonth() === mesActual && d.getFullYear() === anioActual && i.responsable === 'alberto' }).reduce((s, i) => s + (i.importe || 0), 0)
    const pendiente = ingresos.filter(i => !i.cobrado).reduce((s, i) => s + (i.importe || 0), 0)
    return { anual, mensual, mensualAlberto, pendiente }
  }, [ingresos, mesActual, anioActual])

  const pctAnual = Math.min(100, Math.round((stats.anual / OBJETIVO_ANUAL) * 100))
  const pctMes = Math.min(100, Math.round((stats.mensualAlberto / OBJETIVO_MENSUAL_ALBERTO) * 100))

  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const porMes = useMemo(() => {
    return meses.map((m, i) => {
      const total = ingresos.filter(ing => ing.cobrado && new Date(ing.fecha).getMonth() === i && new Date(ing.fecha).getFullYear() === anioActual).reduce((s, ing) => s + (ing.importe || 0), 0)
      return { m, total }
    })
  }, [ingresos, anioActual])
  const maxMes = Math.max(...porMes.map(p => p.total), 1)

  const handleCrear = async () => {
    if (!form.concepto?.trim() || !form.importe) return alert('Concepto e importe son obligatorios')
    await crear({ ...form, importe: parseFloat(form.importe) })
    setForm({ cliente_id: '', concepto: '', importe: '', fecha: new Date().toISOString().split('T')[0], cobrado: false, responsable: 'pablo' })
    setModalOpen(false)
  }

  const handleExport = () => {
    const header = ['Fecha','Cliente','Concepto','Importe','Cobrado','Responsable']
    const rows = ingresos.map(i => [i.fecha, i.clientes?.nombre || '', i.concepto, i.importe, i.cobrado ? 'Sí' : 'No', i.responsable])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `ingresos_oneseven_${anioActual}.csv`
    a.click()
  }

  return (
    <Layout
      title="Ingresos"
      subtitle="Facturación y cobros"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleExport}>Exportar CSV</button>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><PlusIcon /> Nuevo ingreso</button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Facturado {anioActual}</div>
          <div className="stat-value">{formatEur(stats.anual)}</div>
          <div className="progress-bar" style={{ marginTop: 10 }}>
            <div className="progress-fill" style={{ width: pctAnual + '%', background: 'var(--accent)' }} />
          </div>
          <div className="stat-sub">{pctAnual}% de {formatEur(OBJETIVO_ANUAL)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Este mes (total)</div>
          <div className="stat-value">{formatEur(stats.mensual)}</div>
          <div className="stat-sub">Cobrado en {meses[mesActual]}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Alberto este mes</div>
          <div className="stat-value">{formatEur(stats.mensualAlberto)}</div>
          <div className="progress-bar" style={{ marginTop: 10 }}>
            <div className="progress-fill" style={{ width: pctMes + '%', background: 'var(--green)' }} />
          </div>
          <div className="stat-sub">{pctMes}% de {formatEur(OBJETIVO_MENSUAL_ALBERTO)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendiente de cobro</div>
          <div className="stat-value" style={{ color: stats.pendiente > 0 ? 'var(--amber)' : 'var(--text0)' }}>{formatEur(stats.pendiente)}</div>
          <div className="stat-sub">{ingresos.filter(i => !i.cobrado).length} facturas pendientes</div>
        </div>
      </div>

      {/* Gráfico por mes */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 20 }}>Facturación mensual {anioActual}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
          {porMes.map(({ m, total }) => {
            const h = Math.max(4, Math.round((total / maxMes) * 100))
            const isCurrent = meses[mesActual] === m
            return (
              <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                  {total > 0 ? (total >= 1000 ? Math.round(total/1000) + 'k' : total) : ''}
                </div>
                <div style={{ width: '100%', height: h + '%', background: isCurrent ? 'var(--accent)' : 'var(--bg4)', borderRadius: '4px 4px 0 0', transition: 'height 0.6s ease', minHeight: 4 }} />
                <div style={{ fontSize: 10, color: isCurrent ? 'var(--accent2)' : 'var(--text3)', fontWeight: isCurrent ? 600 : 400 }}>{m}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Concepto</th>
                <th>Importe</th>
                <th>Responsable</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ingresos.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Sin ingresos registrados</td></tr>
              )}
              {ingresos.map(i => (
                <tr key={i.id}>
                  <td style={{ fontSize: 12, fontFamily: 'var(--mono)' }}>{formatDate(i.fecha)}</td>
                  <td style={{ fontSize: 13 }}>{i.clientes?.nombre || '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text0)' }}>{i.concepto}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: i.cobrado ? 'var(--green)' : 'var(--amber)' }}>{formatEur(i.importe)}</td>
                  <td>
                    <span style={{ fontSize: 11, padding: '2px 8px', background: i.responsable === 'pablo' ? '#6366f122' : '#10b98122', color: i.responsable === 'pablo' ? '#6366f1' : '#10b981', borderRadius: 10 }}>
                      {i.responsable === 'pablo' ? 'Pablo' : 'Alberto'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => actualizar(i.id, { cobrado: !i.cobrado })}
                      style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', border: 'none', fontFamily: 'var(--font)',
                        background: i.cobrado ? 'var(--green-dim)' : 'var(--amber-dim)',
                        color: i.cobrado ? 'var(--green)' : 'var(--amber)',
                        transition: 'all 0.15s'
                      }}
                    >
                      {i.cobrado ? '✓ Cobrado' : '⏳ Pendiente'}
                    </button>
                  </td>
                  <td>
                    <button className="btn-icon" style={{ width: 28, height: 28, color: 'var(--red)' }} onClick={() => eliminar(i.id)}>
                      <CloseIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div className="modal-title">Nuevo ingreso</div>
              <button className="modal-close" onClick={() => setModalOpen(false)}><CloseIcon /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Cliente</label>
              <select className="form-select" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}>
                <option value="">Sin cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` (${c.empresa})` : ''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Concepto *</label>
              <input className="form-input" value={form.concepto} onChange={e => set('concepto', e.target.value)} placeholder="Web desarrollo, retainer mensual..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Importe (€) *</label>
                <input className="form-input" type="number" value={form.importe} onChange={e => set('importe', e.target.value)} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input className="form-input" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Responsable</label>
                <select className="form-select" value={form.responsable} onChange={e => set('responsable', e.target.value)}>
                  <option value="pablo">Pablo</option>
                  <option value="alberto">Alberto</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-select" value={form.cobrado ? 'cobrado' : 'pendiente'} onChange={e => set('cobrado', e.target.value === 'cobrado')}>
                  <option value="pendiente">Pendiente</option>
                  <option value="cobrado">Cobrado</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCrear}>Guardar ingreso</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
