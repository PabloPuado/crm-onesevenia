import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { useIngresos } from '../hooks/useData'
import { useClientes } from '../hooks/useData'
import { formatEur, OBJETIVO_ANUAL, getStage } from '../lib/constants'

const OBJETIVO_MENSUAL_ALBERTO = 8000
const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Objetivos() {
  const { ingresos } = useIngresos()
  const { clientes } = useClientes()
  const [anio, setAnio] = useState(new Date().getFullYear())
  const mesActual = new Date().getMonth()

  const stats = useMemo(() => {
    const cobrados = ingresos.filter(i => i.cobrado && new Date(i.fecha).getFullYear() === anio)
    const totalAnual = cobrados.reduce((s, i) => s + (i.importe || 0), 0)

    const porMes = meses.map((m, idx) => {
      const del = cobrados.filter(i => new Date(i.fecha).getMonth() === idx)
      const total = del.reduce((s, i) => s + (i.importe || 0), 0)
      const alberto = del.filter(i => i.responsable === 'alberto').reduce((s, i) => s + (i.importe || 0), 0)
      const pablo = del.filter(i => i.responsable === 'pablo').reduce((s, i) => s + (i.importe || 0), 0)
      return { m, idx, total, alberto, pablo }
    })

    const porEtapa = {}
    clientes.forEach(c => {
      porEtapa[c.etapa] = (porEtapa[c.etapa] || 0) + 1
    })

    const pipelineValor = clientes.filter(c => !['ganado','perdido','activo'].includes(c.etapa)).reduce((s, c) => s + (c.valor_deal || 0), 0)

    return { totalAnual, porMes, porEtapa, pipelineValor }
  }, [ingresos, clientes, anio])

  const pctAnual = Math.min(100, Math.round((stats.totalAnual / OBJETIVO_ANUAL) * 100))
  const restante = Math.max(0, OBJETIVO_ANUAL - stats.totalAnual)
  const mesesRestantes = 11 - mesActual
  const ritmoNecesario = mesesRestantes > 0 ? restante / mesesRestantes : 0

  return (
    <Layout title="Objetivos" subtitle={`Seguimiento anual ${anio}`}>
      {/* Año selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setAnio(a => a - 1)}>←</button>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{anio}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setAnio(a => a + 1)}>→</button>
      </div>

      {/* Objetivo anual */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 6 }}>Objetivo anual {anio}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text0)', fontFamily: 'var(--mono)', lineHeight: 1 }}>{formatEur(stats.totalAnual)}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>de {formatEur(OBJETIVO_ANUAL)} objetivo</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: pctAnual >= 80 ? 'var(--green)' : pctAnual >= 50 ? 'var(--amber)' : 'var(--accent2)', lineHeight: 1 }}>
              {pctAnual}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>completado</div>
          </div>
        </div>
        <div className="progress-bar" style={{ height: 12, marginBottom: 12 }}>
          <div className="progress-fill" style={{ width: pctAnual + '%', background: 'linear-gradient(90deg, var(--accent) 0%, var(--green) 100%)' }} />
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Restante</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--amber)', fontFamily: 'var(--mono)' }}>{formatEur(restante)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Meses restantes</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{mesesRestantes}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Ritmo mensual necesario</div>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--accent2)' }}>{formatEur(ritmoNecesario)}/mes</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Pipeline activo</div>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--blue)' }}>{formatEur(stats.pipelineValor)}</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        {/* Objetivo mensual Alberto */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Objetivo mensual — Alberto</div>
          {meses.map((m, idx) => {
            const data = stats.porMes[idx]
            const pct = Math.min(100, Math.round((data.alberto / OBJETIVO_MENSUAL_ALBERTO) * 100))
            const isPast = idx < mesActual
            const isCurrent = idx === mesActual
            return (
              <div key={m} style={{ marginBottom: 12, opacity: isPast && !isCurrent && data.alberto === 0 ? 0.4 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: isCurrent ? 'var(--text0)' : 'var(--text3)', fontWeight: isCurrent ? 600 : 400 }}>{m.slice(0, 3)}</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: pct >= 100 ? 'var(--green)' : pct > 50 ? 'var(--amber)' : 'var(--text3)' }}>
                    {formatEur(data.alberto)} / {formatEur(OBJETIVO_MENSUAL_ALBERTO)}
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 5 }}>
                  <div className="progress-fill" style={{ width: pct + '%', background: pct >= 100 ? 'var(--green)' : isCurrent ? 'var(--amber)' : 'var(--bg4)' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Facturación mensual Pablo */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Facturación mensual — Pablo</div>
          {meses.map((m, idx) => {
            const data = stats.porMes[idx]
            const isCurrent = idx === mesActual
            const maxVal = Math.max(...stats.porMes.map(p => p.pablo), 1)
            const pct = Math.min(100, Math.round((data.pablo / maxVal) * 100))
            return (
              <div key={m} style={{ marginBottom: 12, opacity: data.pablo === 0 && idx > mesActual ? 0.3 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: isCurrent ? 'var(--text0)' : 'var(--text3)', fontWeight: isCurrent ? 600 : 400 }}>{m.slice(0, 3)}</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{formatEur(data.pablo)}</span>
                </div>
                <div className="progress-bar" style={{ height: 5 }}>
                  <div className="progress-fill" style={{ width: pct + '%', background: isCurrent ? 'var(--accent)' : 'var(--bg4)' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Por etapa */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Distribución de clientes por etapa</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {Object.entries(stats.porEtapa).map(([etapa, count]) => {
            const stage = getStage(etapa)
            return (
              <div key={etapa} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div className="dot" style={{ background: stage.color }} />
                <span style={{ fontSize: 13, color: 'var(--text0)' }}>{stage.label}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: stage.color, fontFamily: 'var(--mono)' }}>{count}</span>
              </div>
            )
          })}
          {Object.keys(stats.porEtapa).length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sin clientes todavía</div>
          )}
        </div>
      </div>
    </Layout>
  )
}
