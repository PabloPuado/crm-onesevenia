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
  const { clientes, actualizar: actualizarCliente } = useClientes()
  const { ingresos, crear, actualizar, eliminar } = useIngresos()
  const [expandido, setExpandido] = useState({})
  const [modalPago, setModalPago] = useState(null)
  const [modalSolucion, setModalSolucion] = useState(null)
  const [formPago, setFormPago] = useState({ concepto: '', importe: '', fecha: new Date().toISOString().split('T')[0], cobrado: false, responsable: 'pablo' })
  const [formSolucion, setFormSolucion] = useState({ nombre: '', importe: '' })
  const setP = (k, v) => setFormPago(prev => ({ ...prev, [k]: v }))
  const setS = (k, v) => setFormSolucion(prev => ({ ...prev, [k]: v }))

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

  const getValorTotal = (c) => {
    const base = c.valor_deal || 0
    const extras = (c.soluciones_extra || []).reduce((s, sol) => s + (sol.importe || 0), 0)
    return base + extras
  }

  const statsCliente = (c) => {
    const pagos = ingresosPorCliente[c.id] || []
    const totalDeal = getValorTotal(c)
    const cobrado = pagos.filter(p => p.cobrado).reduce((s, p) => s + (p.importe || 0), 0)
    const pendienteCobro = pagos.filter(p => !p.cobrado).reduce((s, p) => s + (p.importe || 0), 0)
    const porFacturar = Math.max(0, totalDeal - cobrado - pendienteCobro)
    const pct = totalDeal > 0 ? Math.min(100, Math.round((cobrado / totalDeal) * 100)) : 0
    return { pagos, totalDeal, cobrado, pendienteCobro, porFacturar, pct }
  }

  const totales = useMemo(() => {
    let totalDeal = 0, cobrado = 0, pendiente = 0, porFacturar = 0
    clientesActivos.forEach(c => {
      const s = statsCliente(c)
      totalDeal += s.totalDeal
      cobrado += s.cobrado
      pendiente += s.pendienteCobro
      porFacturar += s.porFacturar
    })
    return { totalDeal, cobrado, pendiente, porFacturar }
  }, [clientesActivos, ingresos])

  const handleCrearPago = async () => {
    if (!formPago.concepto?.trim() || !formPago.importe) return alert('Concepto e importe son obligatorios')
    await crear({ ...formPago, cliente_id: modalPago.id, importe: parseFloat(formPago.importe) })
    setFormPago({ concepto: '', importe: '', fecha: new Date().toISOString().split('T')[0], cobrado: false, responsable: 'pablo' })
    setModalPago(null)
  }

  const handleCrearSolucion = async () => {
    if (!formSolucion.nombre?.trim() || !formSolucion.importe) return alert('Nombre e importe son obligatorios')
    const cliente = clientesActivos.find(c => c.id === modalSolucion.id)
    const extras = [...(cliente.soluciones_extra || []), { id: Date.now(), nombre: formSolucion.nombre, importe: parseFloat(formSolucion.importe) }]
    await actualizarCliente(modalSolucion.id, { soluciones_extra: extras })
    setFormSolucion({ nombre: '', importe: '' })
    setModalSolucion(null)
  }

  const eliminarSolucion = async (clienteId, solId) => {
    const cliente = clientesActivos.find(c => c.id === clienteId)
    const extras = (cliente.soluciones_extra || []).filter(s => s.id !== solId)
    await actualizarCliente(clienteId, { soluciones_extra: extras })
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
          <div className="stat-sub">Facturado, esperando pago</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Por facturar</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{formatEur(totales.porFacturar)}</div>
          <div className="stat-sub">Ni facturado aún</div>
        </div>
      </div>

      {clientesActivos.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-text">Aún no hay clientes en etapa cerrado ganado o superior.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {clientesActivos.map(c => {
          const { pagos, totalDeal, cobrado, pendienteCobro, porFacturar, pct } = statsCliente(c)
          const stage = getStage(c.etapa)
          const abierto = expandido[c.id]
          const solExtras = c.soluciones_extra || []

          return (
            <div key={c.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }} onClick={() => toggleExpand(c.id)}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: stage.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: stage.color, flexShrink: 0 }}>
                  {(c.nombre || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>{c.nombre}</span>
                    {c.empresa && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{c.empresa}</span>}
                    <span className={`badge ${stage.badgeClass}`}>{stage.label}</span>
                    {solExtras.length > 0 && <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--accent-dim)', color: 'var(--accent2)', borderRadius: 10 }}>+{solExtras.length} solución{solExtras.length > 1 ? 'es' : ''}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="progress-bar" style={{ flex: 1, height: 5 }}>
                      <div className="progress-fill" style={{ width: pct + '%', background: pct === 100 ? 'var(--green)' : 'var(--accent)' }} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', whiteSpace: 'nowrap' }}>{formatEur(cobrado)} / {totalDeal ? formatEur(totalDeal) : '—'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Pend. cobro</div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)', color: pendienteCobro > 0 ? 'var(--amber)' : 'var(--text3)' }}>{formatEur(pendienteCobro)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Por facturar</div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)', color: porFacturar > 0 ? 'var(--blue)' : 'var(--text3)' }}>{formatEur(porFacturar)}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: pct === 100 ? 'var(--green)' : 'var(--text3)', minWidth: 44, textAlign: 'right' }}>{pct}%</div>
                  <ChevronIcon open={abierto} />
                </div>
              </div>

              {abierto && (
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Soluciones contratadas</div>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={(e) => { e.stopPropagation(); setModalSolucion(c); setFormSolucion({ nombre: '', importe: '' }) }}><PlusIcon /> Añadir solución</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: solExtras.length > 0 ? 6 : 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--text0)', fontWeight: 500 }}>Solución principal{c.servicios?.length > 0 && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8 }}>{Array.isArray(c.servicios) ? c.servicios.join(', ') : c.servicios}</span>}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text0)' }}>{c.valor_deal ? formatEur(c.valor_deal) : '—'}</div>
                    </div>
                    {solExtras.map(sol => (
                      <div key={sol.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent2)', flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: 13, color: 'var(--text0)', fontWeight: 500 }}>{sol.nombre}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent2)' }}>{formatEur(sol.importe)}</div>
                        <button className="btn-icon" style={{ width: 24, height: 24, color: 'var(--red)', flexShrink: 0 }} onClick={() => eliminarSolucion(c.id, sol.id)}><CloseIcon /></button>
                      </div>
                    ))}
                    {solExtras.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)', marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text3)', marginRight: 8 }}>Total contratado:</span>
                        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text0)' }}>{formatEur(totalDeal)}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 24, padding: '14px 20px 12px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                    <div><div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Total deal</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)' }}>{totalDeal ? formatEur(totalDeal) : '—'}</div></div>
                    <div><div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Cobrado</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--green)' }}>{formatEur(cobrado)}</div></div>
                    <div><div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Pendiente cobro</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)', color: pendienteCobro > 0 ? 'var(--amber)' : 'var(--text3)' }}>{formatEur(pendienteCobro)}</div></div>
                    <div><div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Por facturar</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)', color: porFacturar > 0 ? 'var(--blue)' : 'var(--text3)' }}>{formatEur(porFacturar)}</div></div>
                    <div style={{ marginLeft: 'auto' }}><button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setModalPago(c); setFormPago({ concepto: '', importe: '', fecha: new Date().toISOString().split('T')[0], cobrado: false, responsable: c.responsable || 'pablo' }) }}><PlusIcon /> Registrar pago</button></div>
                  </div>
                  <div style={{ padding: '12px 20px 16px' }}>
                    {pagos.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text3)', fontSize: 13 }}>Sin pagos registrados.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {pagos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(p => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text0)' }}>{p.concepto}</div>
                              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{p.fecha}</div>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: p.cobrado ? 'var(--green)' : 'var(--amber)' }}>{formatEur(p.importe)}</div>
                            <button onClick={() => actualizar(p.id, { cobrado: !p.cobrado })} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', border: 'none', fontFamily: 'var(--font)', background: p.cobrado ? 'var(--green-dim)' : 'var(--amber-dim)', color: p.cobrado ? 'var(--green)' : 'var(--amber)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>{p.cobrado ? '✓ Cobrado' : '⏳ Pendiente'}</button>
                            <button className="btn-icon" style={{ width: 26, height: 26, color: 'var(--red)', flexShrink: 0 }} onClick={() => eliminar(p.id)}><CloseIcon /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {modalPago && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalPago(null)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Registrar pago</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{modalPago.nombre}{modalPago.empresa ? ` · ${modalPago.empresa}` : ''}</div>
              </div>
              <button className="modal-close" onClick={() => setModalPago(null)}><CloseIcon /></button>
            </div>
            {(() => { const s = statsCliente(modalPago); return <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 16, fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 16, flexWrap: 'wrap' }}><span>Total: <b style={{ color: 'var(--text0)', fontFamily: 'var(--mono)' }}>{formatEur(s.totalDeal)}</b></span><span>Cobrado: <b style={{ color: 'var(--green)', fontFamily: 'var(--mono)' }}>{formatEur(s.cobrado)}</b></span><span>Pend: <b style={{ color: 'var(--amber)', fontFamily: 'var(--mono)' }}>{formatEur(s.pendienteCobro)}</b></span><span>X facturar: <b style={{ color: 'var(--blue)', fontFamily: 'var(--mono)' }}>{formatEur(s.porFacturar)}</b></span></div> })()}
            <div className="form-group"><label className="form-label">Concepto *</label><input className="form-input" value={formPago.concepto} onChange={e => setP('concepto', e.target.value)} placeholder="Ej: Primer pago, retainer enero..." autoFocus /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group"><label className="form-label">Importe (€) *</label><input className="form-input" type="number" value={formPago.importe} onChange={e => setP('importe', e.target.value)} placeholder="0" /></div>
              <div className="form-group"><label className="form-label">Fecha</label><input className="form-input" type="date" value={formPago.fecha} onChange={e => setP('fecha', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group"><label className="form-label">Responsable</label><select className="form-select" value={formPago.responsable} onChange={e => setP('responsable', e.target.value)}><option value="pablo">Pablo</option><option value="alberto">Alberto</option></select></div>
              <div className="form-group"><label className="form-label">Estado</label><select className="form-select" value={formPago.cobrado ? 'cobrado' : 'pendiente'} onChange={e => setP('cobrado', e.target.value === 'cobrado')}><option value="pendiente">Pendiente de cobro</option><option value="cobrado">Ya cobrado</option></select></div>
            </div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModalPago(null)}>Cancelar</button><button className="btn btn-primary" onClick={handleCrearPago}>Guardar pago</button></div>
          </div>
        </div>
      )}

      {modalSolucion && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalSolucion(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div><div className="modal-title">Añadir solución</div><div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{modalSolucion.nombre}</div></div>
              <button className="modal-close" onClick={() => setModalSolucion(null)}><CloseIcon /></button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.6 }}>El importe de esta solución se sumará al total contratado del cliente.</div>
            <div className="form-group"><label className="form-label">Nombre de la solución *</label><input className="form-input" value={formSolucion.nombre} onChange={e => setS('nombre', e.target.value)} placeholder="Ej: Agente IA WhatsApp, Automatización facturas..." autoFocus /></div>
            <div className="form-group"><label className="form-label">Importe (€) *</label><input className="form-input" type="number" value={formSolucion.importe} onChange={e => setS('importe', e.target.value)} placeholder="0" /></div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModalSolucion(null)}>Cancelar</button><button className="btn btn-primary" onClick={handleCrearSolucion}>Añadir solución</button></div>
          </div>
        </div>
      )}
    </Layout>
  )
            }
