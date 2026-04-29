import { useMemo } from 'react'
import Layout from '../components/Layout'
import { useGastos, useClientes } from '../hooks/useData'
import { useIngresos } from '../hooks/useData'
import { useTareas } from '../hooks/useData'
import { useAuth } from '../context/AuthContext'
import { formatEur, OBJETIVO_ANUAL, getStage } from '../lib/constants'
import { formatDate } from '../lib/constants'

const OBJETIVO_MENSUAL_ALBERTO = 8000


// ─── Widget split de gastos ────────────────────────────────────────────────────
function SplitGastosWidget({ gastos }) {
  const activos = (gastos || []).filter(g => g.activo !== false)

  // Calcular lo que debe pagar cada uno según % acordado (mensual)
  const importeMensual = (g) => {
    const imp = parseFloat(g.importe) || 0
    switch (g.frecuencia) {
      case 'mensual': return imp
      case 'trimestral': return imp / 3
      case 'semestral': return imp / 6
      case 'anual': return imp / 12
      default: return 0
    }
  }

  // Lo que cada uno DEBERÍA pagar según su % acordado
  let deberiaP = 0, deberiaA = 0
  // Lo que cada uno HA PAGADO realmente
  let pagadoP = 0, pagadoA = 0

  activos.forEach(g => {
    const mensual = importeMensual(g)
    if (mensual <= 0) return
    const pctP = parseFloat(g.pct_pablo) || 50
    const pctA = parseFloat(g.pct_alberto) || 50

    // Lo que deberían pagar
    deberiaP += mensual * pctP / 100
    deberiaA += mensual * pctA / 100

    // Lo que han pagado realmente
    if (g.pagado_por === 'pablo') { pagadoP += mensual }
    else if (g.pagado_por === 'alberto') { pagadoA += mensual }
    else { pagadoP += mensual * pctP / 100; pagadoA += mensual * pctA / 100 }
  })

  // Deuda: si Pablo pagó más de lo que le toca, Alberto le debe a Pablo
  const totalPagado = pagadoP + pagadoA
  const deudaP = deberiaP - pagadoP  // positivo = Pablo debe más de lo que pagó
  const deudaA = deberiaA - pagadoA

  // Si deudaP > 0: Pablo ha pagado menos de lo que le toca → Pablo le debe a Alberto
  // Si deudaA > 0: Alberto ha pagado menos → Alberto le debe a Pablo
  const fmt = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(Math.abs(n))

  let deudorNombre = null, acreedorNombre = null, cantidadDeuda = 0
  if (deudaA > 0.01) { deudorNombre = 'Alberto'; acreedorNombre = 'Pablo'; cantidadDeuda = deudaA }
  else if (deudaP > 0.01) { deudorNombre = 'Pablo'; acreedorNombre = 'Alberto'; cantidadDeuda = Math.abs(deudaP) }

  if (activos.length === 0) return null

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>
        Reparto de gastos — Pablo vs Alberto
      </div>

      {/* Barras comparativas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { nombre: 'Pablo', deberia: deberiaP, pagado: pagadoP, color: '#6366f1' },
          { nombre: 'Alberto', deberia: deberiaA, pagado: pagadoA, color: '#06b6d4' },
        ].map(p => {
          const maxVal = Math.max(deberiaP, deberiaA, 1)
          const diff = p.pagado - p.deberia
          return (
            <div key={p.nombre} style={{ padding: '12px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: `1px solid ${p.color}30` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: p.color }}>{p.nombre}</span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: diff >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: diff >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                  {diff >= 0 ? `+${fmt(diff)} a favor` : `${fmt(diff)} pendiente`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
                <span>Debería pagar/mes</span>
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--text1)' }}>{fmt(p.deberia)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
                <span>Ha pagado/mes</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: p.color }}>{fmt(p.pagado)}</span>
              </div>
              {/* Barra progreso */}
              <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((p.pagado / Math.max(p.deberia, 0.01)) * 100, 100)}%`, background: diff >= 0 ? 'var(--green)' : p.color, borderRadius: 3, transition: 'width 0.4s' }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Resultado: quién debe a quién */}
      {deudorNombre ? (
        <div style={{ padding: '14px 18px', borderRadius: 'var(--radius)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>↕</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>
                <span style={{ color: 'var(--red)' }}>{deudorNombre}</span> debe a <span style={{ color: 'var(--green)' }}>{acreedorNombre}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Diferencia acumulada en gastos del mes</div>
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--red)' }}>
            {fmt(cantidadDeuda)}
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 18px', borderRadius: 'var(--radius)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center', fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>
          Estais al dia — sin deudas entre vosotros
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { clientes } = useClientes()
  const { gastos } = useGastos()
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
      <SplitGastosWidget gastos={gastos} />
    </Layout>
  )
}
