import { useMemo } from 'react'
import Layout from '../components/Layout'
import { useClientes } from '../hooks/useData'
import { useIngresos } from '../hooks/useData'
import { formatEur, STAGES } from '../lib/constants'

export default function Metricas() {
  const { clientes } = useClientes()
  const { ingresos } = useIngresos()

  const stats = useMemo(() => {
    const total = clientes.length
    const cerrados = clientes.filter(c => ['ganado','activo','desarrollando','terminado'].includes(c.etapa))
    const perdidos = clientes.filter(c => c.etapa === 'perdido')
    const activos = clientes.filter(c => !['ganado','perdido','activo','desarrollando','terminado'].includes(c.etapa))
    const tasaConversion = total > 0 ? Math.round((cerrados.length / total) * 100) : 0
    const ticketMedio = cerrados.length > 0 ? Math.round(cerrados.reduce((s, c) => s + (c.valor_deal || 0), 0) / cerrados.length) : 0
    const valorPipeline = activos.reduce((s, c) => s + (c.valor_deal || 0), 0)
    const porEtapa = STAGES.map(s => ({ ...s, count: clientes.filter(c => c.etapa === s.id).length, valor: clientes.filter(c => c.etapa === s.id).reduce((sum, c) => sum + (c.valor_deal || 0), 0) })).filter(s => s.count > 0)
    const servicioMap = {}
    clientes.forEach(c => {
      const servicios = Array.isArray(c.servicios) ? c.servicios : []
      servicios.forEach(s => {
        if (!servicioMap[s]) servicioMap[s] = { count: 0, valor: 0, cerrados: 0 }
        servicioMap[s].count++
        servicioMap[s].valor += c.valor_deal || 0
        if (['ganado','activo','desarrollando','terminado'].includes(c.etapa)) servicioMap[s].cerrados++
      })
    })
    const porServicio = Object.entries(servicioMap).map(([nombre, d]) => ({ nombre, ...d, conversion: d.count > 0 ? Math.round((d.cerrados / d.count) * 100) : 0 })).sort((a, b) => b.valor - a.valor)
    const origenMap = {}
    clientes.forEach(c => {
      const o = c.origen || 'Sin especificar'
      if (!origenMap[o]) origenMap[o] = { count: 0, cerrados: 0 }
      origenMap[o].count++
      if (['ganado','activo','desarrollando','terminado'].includes(c.etapa)) origenMap[o].cerrados++
    })
    const porOrigen = Object.entries(origenMap).map(([nombre, d]) => ({ nombre, ...d, conversion: d.count > 0 ? Math.round((d.cerrados / d.count) * 100) : 0 })).sort((a, b) => b.count - a.count)
    const pC = clientes.filter(c => c.responsable === 'pablo'), aC = clientes.filter(c => c.responsable === 'alberto')
    const pCerr = pC.filter(c => ['ganado','activo','desarrollando','terminado'].includes(c.etapa))
    const aCerr = aC.filter(c => ['ganado','activo','desarrollando','terminado'].includes(c.etapa))
    return { total, cerrados: cerrados.length, perdidos: perdidos.length, activos: activos.length, tasaConversion, ticketMedio, valorPipeline, porEtapa, porServicio, porOrigen, pablo: { total: pC.length, cerrados: pCerr.length, valor: pCerr.reduce((s,c) => s+(c.valor_deal||0),0) }, alberto: { total: aC.length, cerrados: aCerr.length, valor: aCerr.reduce((s,c) => s+(c.valor_deal||0),0) } }
  }, [clientes])

  const maxEtapa = Math.max(...stats.porEtapa.map(e => e.count), 1)
  const maxServicio = Math.max(...stats.porServicio.map(s => s.valor), 1)
  const maxOrigen = Math.max(...stats.porOrigen.map(o => o.count), 1)

  return (
    <Layout title="Métricas" subtitle="Análisis de conversión y rendimiento">
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-label">Tasa de conversión</div><div className="stat-value" style={{ color: stats.tasaConversion > 30 ? 'var(--green)' : 'var(--amber)' }}>{stats.tasaConversion}%</div><div className="stat-sub">{stats.cerrados} cerrados de {stats.total}</div></div>
        <div className="stat-card"><div className="stat-label">Ticket medio</div><div className="stat-value">{formatEur(stats.ticketMedio)}</div><div className="stat-sub">Sobre deals cerrados</div></div>
        <div className="stat-card"><div className="stat-label">Pipeline activo</div><div className="stat-value" style={{ color: 'var(--blue)' }}>{formatEur(stats.valorPipeline)}</div><div className="stat-sub">{stats.activos} deals en curso</div></div>
        <div className="stat-card"><div className="stat-label">Deals perdidos</div><div className="stat-value" style={{ color: stats.perdidos > 0 ? 'var(--red)' : 'var(--text0)' }}>{stats.perdidos}</div><div className="stat-sub">{stats.total > 0 ? Math.round((stats.perdidos/stats.total)*100) : 0}% del total</div></div>
      </div>
      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Clientes por etapa</div>
          {stats.porEtapa.map(e => (
            <div key={e.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color }} /><span style={{ fontSize: 12, color: 'var(--text0)' }}>{e.label}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontSize: 12, fontWeight: 600 }}>{e.count}</span>{e.valor > 0 && <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{formatEur(e.valor)}</span>}</div>
              </div>
              <div className="progress-bar" style={{ height: 4 }}><div className="progress-fill" style={{ width: Math.round((e.count/maxEtapa)*100)+'%', background: e.color }} /></div>
            </div>
          ))}
          {stats.porEtapa.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13 }}>Sin datos</div>}
        </div>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Rendimiento por responsable</div>
          {[{ nombre: 'Pablo', color: '#6366f1', data: stats.pablo }, { nombre: 'Alberto', color: '#10b981', data: stats.alberto }].map(r => (
            <div key={r.nombre} style={{ padding: '12px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: r.color+'22', color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{r.nombre[0]}</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>{r.nombre}</span>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div><div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Clientes</div><div style={{ fontSize: 18, fontWeight: 600 }}>{r.data.total}</div></div>
                <div><div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Cerrados</div><div style={{ fontSize: 18, fontWeight: 600, color: 'var(--green)' }}>{r.data.cerrados}</div></div>
                <div><div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Conversión</div><div style={{ fontSize: 18, fontWeight: 600, color: r.color }}>{r.data.total > 0 ? Math.round((r.data.cerrados/r.data.total)*100) : 0}%</div></div>
                <div><div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Valor</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)' }}>{formatEur(r.data.valor)}</div></div>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', letterSpacing: '.06em', textTransform: 'uppercase', margin: '14px 0 8px' }}>Canal de entrada</div>
          {stats.porOrigen.slice(0,5).map(o => (
            <div key={o.nombre} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
              <span style={{ fontSize: 12, color: 'var(--text0)', minWidth: 100 }}>{o.nombre}</span>
              <div className="progress-bar" style={{ flex: 1, height: 4 }}><div className="progress-fill" style={{ width: Math.round((o.count/maxOrigen)*100)+'%', background: 'var(--accent)' }} /></div>
              <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 20 }}>{o.count}</span>
              <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 8, background: o.conversion > 40 ? 'var(--green-dim)' : 'var(--bg4)', color: o.conversion > 40 ? 'var(--green)' : 'var(--text3)' }}>{o.conversion}%</span>
            </div>
          ))}
        </div>
      </div>
      {stats.porServicio.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Rendimiento por servicio</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--text3)', padding: '6px 12px', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Servicio</th>
              <th style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', padding: '6px 12px', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Clientes</th>
              <th style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', padding: '6px 12px', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Cerrados</th>
              <th style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', padding: '6px 12px', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Conv.</th>
              <th style={{ textAlign: 'right', fontSize: 11, color: 'var(--text3)', padding: '6px 12px', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Valor</th>
              <th style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', width: 120 }}></th>
            </tr></thead>
            <tbody>{stats.porServicio.map(s => (
              <tr key={s.nombre}>
                <td style={{ fontSize: 13, fontWeight: 500, color: 'var(--text0)', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>{s.nombre}</td>
                <td style={{ textAlign: 'center', fontSize: 13, color: 'var(--text1)', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>{s.count}</td>
                <td style={{ textAlign: 'center', fontSize: 13, color: 'var(--green)', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>{s.cerrados}</td>
                <td style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}><span style={{ fontSize: 12, fontWeight: 600, color: s.conversion > 40 ? 'var(--green)' : s.conversion > 20 ? 'var(--amber)' : 'var(--red)' }}>{s.conversion}%</span></td>
                <td style={{ textAlign: 'right', fontSize: 13, fontFamily: 'var(--mono)', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>{formatEur(s.valor)}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}><div className="progress-bar" style={{ height: 4 }}><div className="progress-fill" style={{ width: Math.round((s.valor/maxServicio)*100)+'%', background: 'var(--accent)' }} /></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
