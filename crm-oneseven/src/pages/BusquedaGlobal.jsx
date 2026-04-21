import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useClientes } from '../hooks/useData'
import { useTareas } from '../hooks/useData'
import { useIngresos } from '../hooks/useData'
import { useActividad } from '../hooks/useData'
import { getStage, formatEur, formatDate } from '../lib/constants'
import { useNavigate } from 'react-router-dom'

function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="5"/><line x1="12.5" y1="12.5" x2="16" y2="16"/></svg>
}

export default function BusquedaGlobal() {
  const [q, setQ] = useState('')
  const { clientes } = useClientes()
  const { tareas } = useTareas()
  const { ingresos } = useIngresos()
  const { actividad } = useActividad()
  const navigate = useNavigate()
  const query = q.toLowerCase().trim()

  const resultados = useMemo(() => {
    if (!query || query.length < 2) return { clientes: [], tareas: [], ingresos: [], actividad: [] }
    return {
      clientes: clientes.filter(c => [c.nombre, c.empresa, c.email, c.telefono, c.notas, c.origen].some(f => f?.toLowerCase().includes(query))).slice(0, 8),
      tareas: tareas.filter(t => [t.titulo, t.descripcion].some(f => f?.toLowerCase().includes(query))).slice(0, 6),
      ingresos: ingresos.filter(i => [i.concepto].some(f => f?.toLowerCase().includes(query))).slice(0, 6),
      actividad: actividad.filter(a => [a.titulo, a.descripcion].some(f => f?.toLowerCase().includes(query))).slice(0, 6),
    }
  }, [query, clientes, tareas, ingresos, actividad])

  const total = Object.values(resultados).flat().length

  return (
    <Layout title="Búsqueda global" subtitle="Busca en clientes, tareas, ingresos y actividad">
      <div style={{ maxWidth: 680 }}>
        <div style={{ position: 'relative', marginBottom: 28 }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}><SearchIcon /></div>
          <input className="form-input" style={{ paddingLeft: 48, fontSize: 16, height: 52, borderRadius: 'var(--radius-lg)' }} placeholder="Buscar clientes, tareas, ingresos, actividad..." value={q} onChange={e => setQ(e.target.value)} autoFocus />
        </div>

        {query.length > 0 && query.length < 2 && <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Escribe al menos 2 caracteres</div>}
        {query.length >= 2 && total === 0 && <div className="card empty-state"><div className="empty-state-text">Sin resultados para "{q}"</div></div>}

        {resultados.clientes.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Clientes · {resultados.clientes.length}</div>
            {resultados.clientes.map(c => {
              const stage = getStage(c.etapa)
              return (
                <div key={c.id} className="card" style={{ padding: '12px 16px', marginBottom: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => navigate('/contactos')}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: stage.color+'22', color: stage.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{(c.nombre||'?')[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text0)' }}>{c.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.empresa || c.email || '—'}</div>
                  </div>
                  <span className={`badge ${stage.badgeClass}`}>{stage.label}</span>
                  {c.valor_deal && <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--green)' }}>{formatEur(c.valor_deal)}</span>}
                </div>
              )
            })}
          </div>
        )}

        {resultados.tareas.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Tareas · {resultados.tareas.length}</div>
            {resultados.tareas.map(t => (
              <div key={t.id} className="card" style={{ padding: '12px 16px', marginBottom: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, opacity: t.completada ? 0.5 : 1 }} onClick={() => navigate('/tareas')}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${t.completada ? 'var(--green)' : 'var(--border2)'}`, background: t.completada ? 'var(--green)' : 'none', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>{t.completada && '✓'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text0)' }}>{t.titulo}</div>
                  {t.fecha_vencimiento && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{formatDate(t.fecha_vencimiento)}</div>}
                </div>
                <span style={{ fontSize: 10, padding: '1px 6px', background: t.responsable === 'pablo' ? '#6366f122' : '#10b98122', color: t.responsable === 'pablo' ? '#6366f1' : '#10b981', borderRadius: 10 }}>{t.responsable === 'pablo' ? 'Pablo' : 'Alberto'}</span>
              </div>
            ))}
          </div>
        )}

        {resultados.ingresos.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Ingresos · {resultados.ingresos.length}</div>
            {resultados.ingresos.map(i => (
              <div key={i.id} className="card" style={{ padding: '12px 16px', marginBottom: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => navigate('/ingresos')}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text0)' }}>{i.concepto}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{formatDate(i.fecha)}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: i.cobrado ? 'var(--green)' : 'var(--amber)' }}>{formatEur(i.importe)}</div>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: i.cobrado ? 'var(--green-dim)' : 'var(--amber-dim)', color: i.cobrado ? 'var(--green)' : 'var(--amber)' }}>{i.cobrado ? 'Cobrado' : 'Pendiente'}</span>
              </div>
            ))}
          </div>
        )}

        {resultados.actividad.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Actividad · {resultados.actividad.length}</div>
            {resultados.actividad.map(a => (
              <div key={a.id} className="card" style={{ padding: '12px 16px', marginBottom: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => navigate('/timeline')}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text0)' }}>{a.titulo}</div>
                  {a.descripcion && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{a.descripcion.slice(0,80)}{a.descripcion.length > 80 ? '...' : ''}</div>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>{formatDate(a.fecha)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
