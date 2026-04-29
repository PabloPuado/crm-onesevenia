import { useMemo } from 'react'
import Layout from '../components/Layout'
import { useGastos, useClientes, usePagosGastos, useLiquidaciones } from '../hooks/useData'
import { useIngresos } from '../hooks/useData'
import { useTareas } from '../hooks/useData'
import { useAuth } from '../context/AuthContext'
import { formatEur, OBJETIVO_ANUAL, getStage } from '../lib/constants'
import { formatDate } from '../lib/constants'

const OBJETIVO_MENSUAL_ALBERTO = 8000
const fmt2 = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(Math.abs(parseFloat(n) || 0))

// ─── Widget split de gastos (con pagos reales) ─────────────────────────────────
function SplitGastosWidget({ gastos, pagos, liquidaciones }) {
  const activos = (gastos || []).filter(g => g.activo !== false)
  const todosPagos = pagos || []
  const todasLiq = liquidaciones || []

  // Calcular para cada gasto: cuánto corresponde a cada uno
  // y cuánto han pagado/reembolsado realmente
  let totalCorrespP = 0, totalCorrespA = 0
  let totalPagadoRealP = 0, totalPagadoRealA = 0
  let totalReembAP = 0, totalReembPA = 0 // reembolsos entre ellos

  activos.forEach(g => {
    const imp = parseFloat(g.importe) || 0
    if (imp <= 0) return

    const mP = g.modo_pablo || 'pct'
    const mA = g.modo_alberto || 'pct'
    const corrP = mP === 'fijo' ? (parseFloat(g.fijo_pablo)||0) : imp * (parseFloat(g.pct_pablo)||0) / 100
    const corrA = mA === 'fijo' ? (parseFloat(g.fijo_alberto)||0) : imp * (parseFloat(g.pct_alberto)||0) / 100

    totalCorrespP += corrP
    totalCorrespA += corrA

    // Pagos reales registrados para este gasto
    const pagosGasto = todosPagos.filter(p => p.gasto_id === g.id)
    const pagP = pagosGasto.filter(p => p.pagado_por === 'pablo' && p.tipo !== 'reembolso').reduce((s,p) => s + (parseFloat(p.importe)||0), 0)
    const pagA = pagosGasto.filter(p => p.pagado_por === 'alberto' && p.tipo !== 'reembolso').reduce((s,p) => s + (parseFloat(p.importe)||0), 0)
    const reAP = pagosGasto.filter(p => p.tipo === 'reembolso' && p.pagado_por === 'alberto').reduce((s,p) => s + (parseFloat(p.importe)||0), 0)
    const rePA = pagosGasto.filter(p => p.tipo === 'reembolso' && p.pagado_por === 'pablo').reduce((s,p) => s + (parseFloat(p.importe)||0), 0)

    totalPagadoRealP += pagP
    totalPagadoRealA += pagA
    totalReembAP += reAP
    totalReembPA += rePA
  })

  // Liquidaciones globales (pagos directos entre ellos fuera de gastos concretos)
  const liqAP = todasLiq.filter(l => l.pagador === 'alberto').reduce((s,l) => s + (parseFloat(l.importe)||0), 0)
  const liqPA = todasLiq.filter(l => l.pagador === 'pablo').reduce((s,l) => s + (parseFloat(l.importe)||0), 0)

  // Saldo neto: cuánto ha pagado Pablo de más respecto a lo que le corresponde
  // (incluyendo reembolsos recibidos)
  const saldoNetoP = totalPagadoRealP - totalCorrespP + totalReembAP - totalReembPA + liqAP - liqPA
  const saldoNetoA = totalPagadoRealA - totalCorrespA + totalReembPA - totalReembAP + liqPA - liqAP

  // Deuda final
  let deudorNombre = null, acreedorNombre = null, cantidadDeuda = 0
  if (saldoNetoA < -0.01) {
    // Alberto tiene saldo negativo → debe a Pablo
    deudorNombre = 'Alberto'; acreedorNombre = 'Pablo'; cantidadDeuda = Math.abs(saldoNetoA)
  } else if (saldoNetoP < -0.01) {
    deudorNombre = 'Pablo'; acreedorNombre = 'Alberto'; cantidadDeuda = Math.abs(saldoNetoP)
  }

  const tienePagos = totalPagadoRealP > 0 || totalPagadoRealA > 0
  if (activos.length === 0) return null

  return (
    <div className="card" style={{ marginBottom: 16, marginTop: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>
        Reparto de gastos — Pablo vs Alberto
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        {[
          { nombre: 'Pablo', corresp: totalCorrespP, pagado: totalPagadoRealP, saldo: saldoNetoP, color: '#6366f1' },
          { nombre: 'Alberto', corresp: totalCorrespA, pagado: totalPagadoRealA, saldo: saldoNetoA, color: '#06b6d4' },
        ].map(p => (
          <div key={p.nombre} style={{ padding: '12px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: `1px solid ${p.color}25` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: p.color }}>{p.nombre}</span>
              {tienePagos && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: p.saldo >= -0.01 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: p.saldo >= -0.01 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                  {p.saldo >= -0.01 ? `+${fmt2(p.saldo)} a favor` : `${fmt2(p.saldo)} debe`}
                </span>
              )}
            </div>
            {[
              { label: 'Le corresponde pagar', value: fmt2(p.corresp) },
              { label: 'Ha pagado (registrado)', value: fmt2(p.pagado), bold: true, color: p.color },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text3)' }}>{r.label}</span>
                <span style={{ fontFamily: 'var(--mono)', color: r.color || 'var(--text1)', fontWeight: r.bold ? 700 : 400 }}>{r.value}</span>
              </div>
            ))}
            {tienePagos && (
              <div style={{ marginTop: 8, height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(p.corresp > 0 ? (p.pagado/p.corresp)*100 : 0, 100)}%`, background: p.saldo >= 0 ? 'var(--green)' : p.color, borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {!tienePagos ? (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--bg3)', border: '1px solid var(--border)', textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
          Sin pagos registrados — ve a Gastos y registra los pagos para ver las deudas
        </div>
      ) : deudorNombre ? (
        <div style={{ padding: '14px 18px', borderRadius: 'var(--radius)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>
              <span style={{ color: 'var(--red)' }}>{deudorNombre}</span> debe a <span style={{ color: 'var(--green)' }}>{acreedorNombre}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Basado en pagos reales registrados</div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--red)' }}>{fmt2(cantidadDeuda)}</div>
        </div>
      ) : (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center', fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>
          Estáis al día — sin deudas pendientes
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { clientes } = useClientes()
  const { gastos } = useGastos()
  const { pagos } = usePagosGastos()
  const { liquidaciones } = useLiquidaciones()
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
          {stats.vencidas > 0 && <div className="stat-sub" style={{ color: 'var(--red)' }}>{stats.vencidas} vencidas</div>}
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

      <SplitGastosWidget gastos={gastos} pagos={pagos} liquidaciones={liquidaciones} />
    </Layout>
  )
}
