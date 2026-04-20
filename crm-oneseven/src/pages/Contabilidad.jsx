import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useClientes } from '../hooks/useData'
import { useIngresos } from '../hooks/useData'
import { formatEur, getStage, ETAPAS_CONTABILIDAD } from '../lib/constants'

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg>
}
function CloseIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>
}
function ChevronIcon({ open }) {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M2 5l5 5 5-5"/></svg>
}

export default function Contabilidad() {
  const { clientes } = useClientes()
  const { ingresos, crear, actualizar, eliminar } = useIngresos()
  const [expandido, setExpandido] = useState({})
  const [modalCliente, setModalCliente] = useState(null)
  const [form, setForm] = useState({ concepto: '', importe: '', fecha: new Date().toISOString().split('T')[0], cobrado: false, responsable: 'pablo' })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const clientesActivos = useMemo(() =>
    clientes.filter(c => ETAPAS_CONTABILIDAD.includes(c.etapa))
      .sort((a, b) => {
        const order = ['ganado', 'desarrollando', 'terminado', 'activo']
        return order.indexOf(a.etapa) - order.indexOf(b.etapa)
      }),
    [clientes]
  )

  const ingresosPorCliente = useMemo(() => {
    const map = {}
    ingresos.forEach(i => {
      if (!i.cliente_id) return
      if (!map[i.cliente_id]) map[i.cliente_id] = []
      map[i.cliente_id].push(i)
    })
    return map
  }, [ingresos])

  const statsCliente = (c) => {
    const pagos = ingresosPorCliente[c.id] || []
    const totalDeal = c.valor_deal || 0
    const cobrado = pagos.filter(p => p.cobrado).reduce((s, p) => s + (p.importe || 0), 0)
    const pendienteCobro = pagos.filter(p => !p.cobrado).reduce((s, p) => s + (p.importe || 0), 0)
    const faltaPorFacturar = Math.max(0, totalDeal - cobrado - pendienteCobro)
    const pct = totalDeal > 0 ? Math.min(100, Math.round((cobrado / totalDeal) * 100)) : 0
    return { pagos, totalDeal, cobrado, pendienteCobro, faltaPorFacturar, pct }
  }

  const totales = useMemo(() => {
    const totalDeal = clientesActivos.reduce((s, c) => s + (c.valor_deal || 0), 0)
    const cobrado = ingresos.filter(i => i.cobrado && clientesActivos.find(c => c.id === i.cliente_id)).reduce((s, i) => s + (i.importe || 0), 0)
    const pendiente = ingresos.filter(i => !i.cobrado && clientesActivos.find(c => c.id === i.cliente_id)).reduce((s, i) => s + (i.importe || 0), 0)
    return { totalDeal, cobrado, pendiente, falta: Math.max(0, totalDeal - cobrado - pendiente) }
  }, [clientesActivos, ingresos])

  const handleCrear = async () => {
    if (!form.concepto?.trim() || !form.importe) return alert('Concepto e importe son obligatorios')
    await crear({ ...form, cliente_id: modalCliente.id, importe: parseFloat(form.importe) })
    setForm({ concepto: '', importe: '', fecha: new Date().toISOString().split('T')[0], cobrado: false, responsable: 'pablo' })
    setModalCliente(null)
  }

  const toggleExpand = (id) => setExpandido(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <Layout title="Contabilidad" subtitle="Control de pagos por cliente">
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total contratado</div>
          <div className="stat-value">{formatEur(totales.totalDeal)}</div>
          <div className="stat-sub">{clientesActivos.length} clientes activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cobrado</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{formatEur(totales.cobrado)}</div>
          <div className="stat-sub">Pagos confirmados</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendiente de cobro</div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{formatEur(totales.pendiente)}</div>
          <div className="stat-sub">Facturado, no cobrado</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Por facturar</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{formatEur(totales.falta)}</div>
          <div className="stat-sub">Queda por emitir</div>
        </div>
      </div>

      {clientesActivos.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-text">
            Aún no hay clientes en etapa cerrado ganado o superior. Mueve clientes en el pipeline para verlos aquí.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {clientesActivos.map(c => {
          const { pagos, totalDeal, cobrado, pendienteCobro, faltaPorFacturar, pct } = statsCliente(c)
          const stage = getStage(c.etapa)
          const abierto = expandido[c.id]

          return (
            <div key={c.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
                onClick={() => toggleExpand(c.id)}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: stage.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: stage.color, flexShrink: 0 }}>
                  {(c.nombre || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>{c.nombre}</span>
                    {c.empresa && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{c.empresa}</span>}
                    <span className={`badge ${stage.badgeClass}`}>{stage.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="progress-bar" style={{ flex: 1, height: 5 }}>
                      <div className="progress-fill" style={{ width: pct + '%', background: pct === 100 ? 'var(--green)' : 'var(--accent)' }} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                      {formatEur(cobrado)} / {totalDeal ? formatEur(totalDeal) : '—'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Por facturar</div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)', color: faltaPorFacturar > 0 ? 'var(--blue)' : 'var(--text3)' }}>{formatEur(faltaPorFacturar)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Pend. cobro</div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)', color: pendienteCobro > 0 ? 'var(--amber)' : 'var(--text3)' }}>{formatEur(pendienteCobro)}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: pct === 100 ? 'var(--green)' : 'var(--text3)', minWidth: 44, textAlign: 'right' }}>
                    {pct}%
                  </div>
                  <ChevronIcon open={abierto} />
                </div>
              </div>

              {abierto && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '0 20px 16px' }}>
                  <div style={{ display: 'flex', gap: 24, padding: '14px 0 12px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Valor deal</div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)' }}>{totalDeal ? formatEur(totalDeal) : '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Cobrado</div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--green)' }}>{formatEur(cobrado)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Pendiente cobro</div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)', color: pendienteCobro > 0 ? 'var(--amber)' : 'var(--text3)' }}>{formatEur(pendienteCobro)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Por facturar</div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)', color: faltaPorFacturar > 0 ? 'var(--blue)' : 'var(--text3)' }}>{formatEur(faltaPorFacturar)}</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => { e.stopPropagation(); setModalCliente(c); setForm({ concepto: '', importe: '', fecha: new Date().toISOString().split('T')[0], cobrado: false, responsable: c.responsable || 'pablo' }) }}
                      >
                        <PlusIcon /> Añadir pago
                      </button>
                    </div>
                  </div>

                  {pagos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 13 }}>
                      Sin pagos registrados. Añade el primero.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {pagos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text0)' }}>{p.concepto}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{p.fecha}</div>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: p.cobrado ? 'var(--green)' : 'var(--amber)' }}>
                            {formatEur(p.importe)}
                          </div>
                          <button
                            onClick={() => actualizar(p.id, { cobrado: !p.cobrado })}
                            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', border: 'none', fontFamily: 'var(--font)', background: p.cobrado ? 'var(--green-dim)' : 'var(--amber-dim)', color: p.cobrado ? 'var(--green)' : 'var(--amber)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                          >
                            {p.cobrado ? '✓ Cobrado' : '⏳ Pendiente'}
                          </button>
                          <button className="btn-icon" style={{ width: 26, height: 26, color: 'var(--red)', flexShrink: 0 }} onClick={() => eliminar(p.id)}>
                            <CloseIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {modalCliente && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalCliente(null)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Añadir pago</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{modalCliente.nombre}{modalCliente.empresa ? ` · ${modalCliente.empresa}` : ''}</div>
              </div>
              <button className="modal-close" onClick={() => setModalCliente(null)}><CloseIcon /></button>
            </div>
            {modalCliente.valor_deal && (() => {
              const s = statsCliente(modalCliente)
              return (
                <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 16, fontSize: 12, color: 'var(--text3)' }}>
                  Deal: <span style={{ fontWeight: 600, color: 'var(--text0)', fontFamily: 'var(--mono)' }}>{formatEur(modalCliente.valor_deal)}</span>
                  <span style={{ margin: '0 8px' }}>·</span>
                  Cobrado: <span style={{ fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--mono)' }}>{formatEur(s.cobrado)}</span>
                  <span style={{ margin: '0 8px' }}>·</span>
                  Falta: <span style={{ fontWeight: 600, color: 'var(--blue)', fontFamily: 'var(--mono)' }}>{formatEur(s.faltaPorFacturar)}</span>
                </div>
              )
            })()}
            <div className="form-group">
              <label className="form-label">Concepto *</label>
              <input className="form-input" value={form.concepto} onChange={e => set('concepto', e.target.value)} placeholder="Ej: Primer pago, retainer enero..." autoFocus />
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
                  <option value="pendiente">Pendiente de cobro</option>
                  <option value="cobrado">Ya cobrado</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalCliente(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCrear}>Guardar pago</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
                    }
