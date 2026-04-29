import { useState } from 'react'
import Layout from '../components/Layout'
import { useTareas } from '../hooks/useData'
import { useClientes } from '../hooks/useData'
import { formatDate } from '../lib/constants'

// Sanitize payload — convert empty strings to null (prevents uuid errors in Supabase)
function sanitize(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === '' || v === undefined ? null : v])
  )
}


function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg>
}
function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
}
function CalIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="2" width="11" height="10" rx="1"/><line x1="4" y1="1" x2="4" y2="3"/><line x1="9" y1="1" x2="9" y2="3"/><line x1="1" y1="5" x2="12" y2="5"/></svg>
}

function exportToIcal(tarea) {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const start = tarea.fecha_vencimiento
    ? new Date(tarea.fecha_vencimiento).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    : now
  const end = start
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ONESEVEN CRM//ES',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@onesevenia.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${tarea.titulo}`,
    tarea.descripcion ? `DESCRIPTION:${tarea.descripcion}` : '',
    'END:VEVENT', 'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')

  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  a.download = `tarea_${tarea.titulo.replace(/\s+/g, '_')}.ics`
  a.click()
}

export default function Tareas() {
  const { tareas, crear, actualizar, eliminar } = useTareas()
  const { clientes } = useClientes()
  const [modalOpen, setModalOpen] = useState(false)
  const [filtro, setFiltro] = useState('pendientes')
  const [filtroResp, setFiltroResp] = useState('todos')
  const [form, setForm] = useState({ titulo: '', descripcion: '', fecha_vencimiento: '', responsable: 'pablo', cliente_id: '', prioridad: 'normal' })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const filtradas = tareas.filter(t => {
    const matchFiltro = filtro === 'todas' || (filtro === 'pendientes' && !t.completada) || (filtro === 'completadas' && t.completada)
    const matchResp = filtroResp === 'todos' || t.responsable === filtroResp
    return matchFiltro && matchResp
  })

  const handleCrear = async () => {
    if (!form.titulo?.trim()) return alert('El título es obligatorio')
    const payload = {
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      fecha_vencimiento: form.fecha_vencimiento || null,
      responsable: form.responsable || 'pablo',
      cliente_id: form.cliente_id || null,
      prioridad: form.prioridad || 'normal',
      completada: false,
    }
    const { data, error } = await crear(payload)
    if (error) {
      console.error('Error creando tarea:', error)
      alert('Error: ' + (error.message || JSON.stringify(error)))
      return
    }
    setForm({ titulo: '', descripcion: '', fecha_vencimiento: '', responsable: 'pablo', cliente_id: '', prioridad: 'normal' })
    setModalOpen(false)
  }

  const toggleCompletada = async (t) => {
    await actualizar(t.id, { completada: !t.completada })
  }

  const hoy = new Date().toISOString().split('T')[0]
  const pendientes = tareas.filter(t => !t.completada).length
  const vencidas = tareas.filter(t => !t.completada && t.fecha_vencimiento && t.fecha_vencimiento < hoy).length

  return (
    <Layout
      title="Tareas"
      subtitle={`${pendientes} pendientes${vencidas > 0 ? ` · ${vencidas} vencidas` : ''}`}
      actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="tabs">
            <button className={`tab-btn ${filtro === 'pendientes' ? 'active' : ''}`} onClick={() => setFiltro('pendientes')}>Pendientes</button>
            <button className={`tab-btn ${filtro === 'completadas' ? 'active' : ''}`} onClick={() => setFiltro('completadas')}>Hechas</button>
            <button className={`tab-btn ${filtro === 'todas' ? 'active' : ''}`} onClick={() => setFiltro('todas')}>Todas</button>
          </div>
          <div className="tabs">
            <button className={`tab-btn ${filtroResp === 'todos' ? 'active' : ''}`} onClick={() => setFiltroResp('todos')}>Todos</button>
            <button className={`tab-btn ${filtroResp === 'pablo' ? 'active' : ''}`} onClick={() => setFiltroResp('pablo')}>Pablo</button>
            <button className={`tab-btn ${filtroResp === 'alberto' ? 'active' : ''}`} onClick={() => setFiltroResp('alberto')}>Alberto</button>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <PlusIcon /> Nueva tarea
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 800 }}>
        {filtradas.length === 0 && (
          <div className="card empty-state">
            <div className="empty-state-text">{filtro === 'pendientes' ? 'Sin tareas pendientes. ¡Bien hecho!' : 'Sin tareas en este filtro'}</div>
          </div>
        )}
        {filtradas.map(t => {
          const vencida = !t.completada && t.fecha_vencimiento && t.fecha_vencimiento < hoy
          const esHoy = t.fecha_vencimiento === hoy
          return (
            <div key={t.id} className="card card-sm" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, opacity: t.completada ? 0.5 : 1 }}>
              <button
                onClick={() => toggleCompletada(t)}
                style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  border: `1.5px solid ${t.completada ? 'var(--green)' : 'var(--border2)'}`,
                  background: t.completada ? 'var(--green)' : 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', color: '#fff', fontSize: 11,
                }}
              >
                {t.completada && '✓'}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text0)', textDecoration: t.completada ? 'line-through' : 'none' }}>{t.titulo}</div>
                {t.descripcion && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{t.descripcion}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                  {t.clientes?.nombre && (
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>📋 {t.clientes.nombre}</span>
                  )}
                  {t.fecha_vencimiento && (
                    <span style={{ fontSize: 11, color: vencida ? 'var(--red)' : esHoy ? 'var(--amber)' : 'var(--text3)' }}>
                      {vencida ? '⚠ Vencida: ' : esHoy ? '⏰ Hoy: ' : ''}{formatDate(t.fecha_vencimiento)}
                    </span>
                  )}
                  <span style={{ fontSize: 10, padding: '1px 6px', background: t.responsable === 'pablo' ? '#6366f122' : '#10b98122', color: t.responsable === 'pablo' ? '#6366f1' : '#10b981', borderRadius: 10 }}>
                    {t.responsable === 'pablo' ? 'Pablo' : 'Alberto'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {t.fecha_vencimiento && (
                  <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => exportToIcal(t)} title="Añadir al calendario">
                    <CalIcon />
                  </button>
                )}
                <button className="btn-icon" style={{ width: 28, height: 28, color: 'var(--red)' }} onClick={() => eliminar(t.id)}>
                  <CloseIcon />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="modal-title">Nueva tarea</div>
              <button className="modal-close" onClick={() => setModalOpen(false)}><CloseIcon /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Título *</label>
              <input className="form-input" value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="¿Qué hay que hacer?" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea className="form-textarea" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Detalles adicionales..." style={{ minHeight: 60 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Fecha límite</label>
                <input className="form-input" type="date" value={form.fecha_vencimiento} onChange={e => set('fecha_vencimiento', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Responsable</label>
                <select className="form-select" value={form.responsable} onChange={e => set('responsable', e.target.value)}>
                  <option value="pablo">Pablo</option>
                  <option value="alberto">Alberto</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Cliente relacionado</label>
              <select className="form-select" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}>
                <option value="">Sin cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` (${c.empresa})` : ''}</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCrear}>Crear tarea</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
