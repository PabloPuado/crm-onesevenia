import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useActividad } from '../hooks/useData'
import { useClientes } from '../hooks/useData'
import { formatDate, getStage } from '../lib/constants'

const TIPOS = [
  { id: 'nota', label: 'Nota', icon: '📝', color: '#6b7280' },
  { id: 'llamada', label: 'Llamada', icon: '📞', color: '#3b82f6' },
  { id: 'email', label: 'Email', icon: '✉️', color: '#6366f1' },
  { id: 'reunion', label: 'Reunión', icon: '🤝', color: '#8b5cf6' },
  { id: 'propuesta', label: 'Propuesta', icon: '📄', color: '#f59e0b' },
  { id: 'pago', label: 'Pago', icon: '💶', color: '#10b981' },
  { id: 'etapa', label: 'Cambio etapa', icon: '🔄', color: '#06b6d4' },
  { id: 'tarea', label: 'Tarea', icon: '✅', color: '#a855f7' },
]

function getTipo(id) { return TIPOS.find(t => t.id === id) || TIPOS[0] }
function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg> }
function CloseIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg> }

function timeAgo(fecha) {
  const d = new Date(fecha), now = new Date(), diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'Ahora mismo'
  if (diff < 3600) return `Hace ${Math.floor(diff/60)}m`
  if (diff < 86400) return `Hace ${Math.floor(diff/3600)}h`
  if (diff < 604800) return `Hace ${Math.floor(diff/86400)}d`
  return formatDate(fecha)
}

export default function Timeline() {
  const { actividad, crear, eliminar } = useActividad()
  const { clientes } = useClientes()
  const [modalOpen, setModalOpen] = useState(false)
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [form, setForm] = useState({ cliente_id: '', tipo: 'nota', titulo: '', descripcion: '', responsable: 'pablo', fecha: new Date().toISOString().slice(0,16) })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const filtrada = useMemo(() => actividad.filter(a => {
    if (filtroCliente && a.cliente_id !== filtroCliente) return false
    if (filtroTipo && a.tipo !== filtroTipo) return false
    return true
  }), [actividad, filtroCliente, filtroTipo])

  const handleCrear = async () => {
    if (!form.cliente_id || !form.titulo?.trim()) return alert('Cliente y título son obligatorios')
    await crear({ ...form })
    setForm({ cliente_id: '', tipo: 'nota', titulo: '', descripcion: '', responsable: 'pablo', fecha: new Date().toISOString().slice(0,16) })
    setModalOpen(false)
  }

  const grupos = useMemo(() => {
    const map = {}
    filtrada.forEach(a => {
      const d = new Date(a.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      if (!map[d]) map[d] = []
      map[d].push(a)
    })
    return Object.entries(map)
  }, [filtrada])

  return (
    <Layout title="Timeline" subtitle={`${actividad.length} actividades registradas`} actions={
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select className="form-select" style={{ width: 160 }} value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
          <option value="">Todos los clientes</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select className="form-select" style={{ width: 140 }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}><PlusIcon /> Añadir actividad</button>
      </div>
    }>
      {filtrada.length === 0 && <div className="card empty-state"><div className="empty-state-text">Sin actividades. Añade la primera para empezar el historial.</div></div>}
      <div style={{ maxWidth: 720 }}>
        {grupos.map(([fecha, items]) => (
          <div key={fecha} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 28 }}>{fecha}</div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 1, background: 'var(--border2)' }} />
              {items.map(a => {
                const tipo = getTipo(a.tipo)
                const cliente = clientes.find(c => c.id === a.cliente_id)
                return (
                  <div key={a.id} style={{ display: 'flex', gap: 14, marginBottom: 10, position: 'relative' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: tipo.color + '20', border: `2px solid ${tipo.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0, zIndex: 1, marginTop: 2 }}>{tipo.icon}</div>
                    <div className="card" style={{ flex: 1, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, background: tipo.color + '15', color: tipo.color, fontWeight: 500, flexShrink: 0 }}>{tipo.label}</span>
                        {cliente && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text0)' }}>{cliente.nombre}{cliente.empresa && <span style={{ color: 'var(--text3)', fontWeight: 400 }}> · {cliente.empresa}</span>}</span>}
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{timeAgo(a.fecha)}</span>
                          <span style={{ fontSize: 10, padding: '1px 6px', background: a.responsable === 'pablo' ? '#6366f122' : '#10b98122', color: a.responsable === 'pablo' ? '#6366f1' : '#10b981', borderRadius: 10 }}>{a.responsable === 'pablo' ? 'Pablo' : 'Alberto'}</span>
                          <button className="btn-icon" style={{ width: 22, height: 22, color: 'var(--red)' }} onClick={() => eliminar(a.id)}><CloseIcon /></button>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text0)', marginBottom: a.descripcion ? 4 : 0 }}>{a.titulo}</div>
                      {a.descripcion && <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{a.descripcion}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header"><div className="modal-title">Añadir actividad</div><button className="modal-close" onClick={() => setModalOpen(false)}><CloseIcon /></button></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group"><label className="form-label">Cliente *</label><select className="form-select" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}><option value="">Seleccionar...</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Tipo</label><select className="form-select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>{TIPOS.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}</select></div>
            </div>
            <div className="form-group"><label className="form-label">Título *</label><input className="form-input" value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="¿Qué pasó?" autoFocus /></div>
            <div className="form-group"><label className="form-label">Descripción</label><textarea className="form-textarea" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Detalles..." style={{ minHeight: 60 }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group"><label className="form-label">Responsable</label><select className="form-select" value={form.responsable} onChange={e => set('responsable', e.target.value)}><option value="pablo">Pablo</option><option value="alberto">Alberto</option></select></div>
              <div className="form-group"><label className="form-label">Fecha y hora</label><input className="form-input" type="datetime-local" value={form.fecha} onChange={e => set('fecha', e.target.value)} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleCrear}>Guardar actividad</button></div>
          </div>
        </div>
      )}
    </Layout>
  )
}
