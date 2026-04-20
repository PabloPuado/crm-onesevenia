import { useMemo } from 'react'
import Layout from '../components/Layout'
import { useClientes } from '../hooks/useData'
import { useIngresos } from '../hooks/useData'
import { useTareas } from '../hooks/useData'
import { useAuth } from '../context/AuthContext'
import { formatEur, OBJETIVO_ANUAL, getStage } from '../lib/constants'
import { formatDate } from '../lib/constants'

const OBJETIVO_MENSUAL_ALBERTO = 8000

export default function Dashboard() {
  const { clientes } = useClientes()
  const { ingresos } = useIngresos()
  const { tareas } = useTareas()
  const { getUserName } = useAuth()
  const userName = getUserName()

  const ahora = new Date()
  const mesActual = ahora.getMonth()
  const anioActual = ahora.getFullYear()

  const stats = useMemo(() => {
    const cobrados = ingresos.filter(i => i.cobrado)
    const totalAnual = cobrados
      .filter(i => new Date(i.fecha).getFullYear() === anioActual)
      .reduce((s, i) => s + (i.importe || 0), 0)
    const totalMesAlberto = cobrados
      .filter(i => {
        const d = new Date(i.fecha)
        return d.getMonth() === mesActual && d.getFullYear() === anioActual && i.responsable === 'alberto'
      })
      .reduce((s, i) => s + (i.importe || 0), 0)

    const dealsAbiertos = clientes.filter(c => !['ganado','perdido','activo'].includes(c.etapa))
    const valorPipeline = dealsAbiertos.reduce((s, c) => s + (c.valor_deal || 0), 0)
    const pendientes = tareas.filter(t => !t.completada).length
    const hoy = new Date().toISOString().split('T')[0]
    const vencidas = tareas.filter(t => !t.completada && t.fecha_vencimiento && t.fecha_vencimiento < hoy).length

    return { totalAnual, totalMesAlberto, dealsAbiertos: dealsAbiertos.length, valorPipeline, pendientes, vencidas }
  }, [ingresos, clientes, tareas, mesActual, anioActual])

  const pctAnual = Math.min(100, Math.round((stats.totalAnual / OBJETIVO_ANUAL) * 100))
  const pctMesAlberto = Math.min(100, Math.round((stats.totalMesAlberto / OBJETIVO_MENSUAL_ALBERTO) * 100))

  const tareasProximas = tareas.filter(t => !t.completada).slice(0, 5)
  const clientesRecientes = clientes.slice(0, 5)

  return (
    <Layout title="Dashboard" subtitle={`Hola, ${userName === 'pablo' ? 'Pablo' : 'Alberto'} 👋`}>
      {/* Stats top */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Facturado este año</div>
          <div className="stat-value">{formatEur(stats.totalAnual)}</div>
          <div className="stat-sub">{pctAnual}% del objetivo anual</div>
          <div className="progress-bar" style={{ marginTop: 10 }}>
            <div className="progress-fill" style={{ width: pctAnual + '%', background: 'var(--accent)' }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Objetivo mensual Alberto</div>
          <div className="stat-value">{formatEur(stats.totalMesAlberto)}</div>
          <div className="stat-sub">{pctMesAlberto}% de {formatEur(OBJETIVO_MENSUAL_ALBERTO)}</div>
          <div className="progress-bar" style={{ marginTop: 10 }}>
            <div className="progress-fill" style={{ width: pctMesAlberto + '%', background: 'var(--green)' }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Deals activos</div>
          <div className="stat-value">{stats.dealsAbiertos}</div>
          <div className="stat-sub">Valor pipeline: {formatEur(stats.valorPipeline)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tareas pendientes</div>
          <div className="stat-value">{stats.pendientes}</div>
          {stats.vencidas > 0 && (
            <div className="stat-sub" style={{ color: 'var(--red)' }}>{stats.vencidas} vencidas</div>
          )}
          {stats.vencidas === 0 && <div className="stat-sub">Sin vencidas</div>}
        </div>
      </div>

      {/* Objetivo anual */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Objetivo anual {anioActual}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              {formatEur(stats.totalAnual)} facturados de {formatEur(OBJETIVO_ANUAL)}
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: pctAnual >= 80 ? 'var(--green)' : pctAnual >= 50 ? 'var(--amber)' : 'var(--accent2)' }}>
            {pctAnual}%
          </div>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div className="progress-fill" style={{ width: pctAnual + '%', background: 'linear-gradient(90deg, var(--accent) 0%, var(--green) 100%)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>0€</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{formatEur(OBJETIVO_ANUAL)}</span>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Tareas próximas */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Próximas tareas
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{stats.pendientes} pendientes</span>
          </div>
          {tareasProximas.length === 0 && (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-text">Sin tareas pendientes</div>
            </div>
          )}
          {tareasProximas.map(t => {
            const vencida = t.fecha_vencimiento && t.fecha_vencimiento < new Date().toISOString().split('T')[0]
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid var(--border2)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text0)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.titulo}</div>
                  <div style={{ fontSize: 11, color: vencida ? 'var(--red)' : 'var(--text3)', marginTop: 2 }}>
                    {t.clientes?.nombre && <span>{t.clientes.nombre} · </span>}
                    {t.fecha_vencimiento ? formatDate(t.fecha_vencimiento) : 'Sin fecha'}
                    {vencida && ' · Vencida'}
                  </div>
                </div>
                <div style={{ fontSize: 10, padding: '2px 6px', background: 'var(--bg4)', borderRadius: 4, color: 'var(--text3)', flexShrink: 0 }}>
                  {t.responsable}
                </div>
              </div>
            )
          })}
        </div>

        {/* Clientes recientes */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Clientes recientes</div>
          {clientesRecientes.length === 0 && (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-text">Sin clientes todavía</div>
            </div>
          )}
          {clientesRecientes.map(c => {
            const stage = getStage(c.etapa)
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: stage.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: stage.color, flexShrink: 0 }}>
                  {(c.nombre || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.empresa || '—'}</div>
                </div>
                <div>
                  <span className={`badge ${stage.badgeClass}`}>{stage.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
