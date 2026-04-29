import { useGastos, usePagosGastos, useLiquidaciones } from '../hooks/useData'
function calcularSplitGastos(gastos, pagos, liquidaciones) {
  const activos = (gastos || []).filter(g => g.activo !== false)
  const todosPagos = pagos || []
  const todasLiq = liquidaciones || []
  let totalCorrespP = 0, totalCorrespA = 0, totalPagadoRealP = 0, totalPagadoRealA = 0
  const lineasDeuda = []
  activos.forEach(g => {
    const imp = parseFloat(g.importe) || 0
    if (imp <= 0) return
    const mP = g.modo_pablo || 'pct', mA = g.modo_alberto || 'pct'
    const corrP = mP === 'fijo' ? (parseFloat(g.fijo_pablo)||0) : imp * (parseFloat(g.pct_pablo)||0) / 100
    const corrA = mA === 'fijo' ? (parseFloat(g.fijo_alberto)||0) : imp * (parseFloat(g.pct_alberto)||0) / 100
    totalCorrespP += corrP; totalCorrespA += corrA
    const pagosGasto = todosPagos.filter(p => p.gasto_id === g.id)
    const pagP = pagosGasto.filter(p => p.pagado_por === 'pablo' && p.tipo !== 'reembolso').reduce((s,p) => s+(parseFloat(p.importe)||0), 0)
    const pagA = pagosGasto.filter(p => p.pagado_por === 'alberto' && p.tipo !== 'reembolso').reduce((s,p) => s+(parseFloat(p.importe)||0), 0)
    const reAP = pagosGasto.filter(p => p.tipo === 'reembolso' && p.pagado_por === 'alberto').reduce((s,p) => s+(parseFloat(p.importe)||0), 0)
    const rePA = pagosGasto.filter(p => p.tipo === 'reembolso' && p.pagado_por === 'pablo').reduce((s,p) => s+(parseFloat(p.importe)||0), 0)
    totalPagadoRealP += pagP; totalPagadoRealA += pagA
    const totalPagGasto = pagP + pagA
    if (totalPagGasto > 0 && (corrP > 0.01 || corrA > 0.01)) {
      let deudorG = null, acreedorG = null, pendienteG = 0
      if (pagP > corrP && corrA > 0.01) { const debe = corrA - reAP; if (debe > 0.01) { deudorG = 'Alberto'; acreedorG = 'Pablo'; pendienteG = debe } }
      else if (pagA > corrA && corrP > 0.01) { const debe = corrP - rePA; if (debe > 0.01) { deudorG = 'Pablo'; acreedorG = 'Alberto'; pendienteG = debe } }
      if (deudorG) lineasDeuda.push({ id: g.id, nombre: g.nombre, categoria: g.categoria, frecuencia: g.frecuencia, deudor: deudorG, acreedor: acreedorG, pendiente: pendienteG, corrP, corrA, reembAP: reAP, reembPA: rePA })
    }
  })
  const liqAP = todasLiq.filter(l => l.pagador === 'alberto').reduce((s,l) => s+(parseFloat(l.importe)||0), 0)
  const liqPA = todasLiq.filter(l => l.pagador === 'pablo').reduce((s,l) => s+(parseFloat(l.importe)||0), 0)
  const saldoNetoP = totalPagadoRealP - totalCorrespP + liqAP - liqPA
  const saldoNetoA = totalPagadoRealA - totalCorrespA + liqPA - liqAP
  let deudorFinal = null, acreedorFinal = null, cantidadFinal = 0
  if (saldoNetoA < -0.01) { deudorFinal = 'Alberto'; acreedorFinal = 'Pablo'; cantidadFinal = Math.abs(saldoNetoA) }
  else if (saldoNetoP < -0.01) { deudorFinal = 'Pablo'; acreedorFinal = 'Alberto'; cantidadFinal = Math.abs(saldoNetoP) }
  return { totalCorrespP, totalCorrespA, totalPagadoRealP, totalPagadoRealA, saldoNetoP, saldoNetoA, deudorFinal, acreedorFinal, cantidadFinal, lineasDeuda, tienePagos: totalPagadoRealP > 0 || totalPagadoRealA > 0 }
}

const fmt2 = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(Math.abs(parseFloat(n) || 0))

export default function SplitGastosWidget({ onLiquidacion }) {
  // Carga sus propios datos — siempre frescos
  const { gastos } = useGastos()
  const { pagos } = usePagosGastos()
  const { liquidaciones } = useLiquidaciones()

  const {
    totalCorrespP, totalCorrespA,
    totalPagadoRealP, totalPagadoRealA,
    saldoNetoP, saldoNetoA,
    deudorFinal, acreedorFinal, cantidadFinal,
    lineasDeuda,
    tienePagos,
  } = calcularSplitGastos(gastos, pagos, liquidaciones)

  const activos = gastos.filter(g => g.activo !== false)
  if (activos.length === 0) return null

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Reparto de gastos — Pablo vs Alberto
        </div>
        {onLiquidacion && deudorFinal && (
          <button className="btn btn-ghost btn-sm" onClick={onLiquidacion} style={{ gap: 5, color: 'var(--green)', fontSize: 11 }}>
            ✓ Registrar liquidación
          </button>
        )}
      </div>

      {/* Tarjetas por persona */}
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
                  {p.saldo >= -0.01 ? `+${fmt2(p.saldo)} a favor` : `${fmt2(Math.abs(p.saldo))} debe`}
                </span>
              )}
            </div>
            {[
              { label: 'Le corresponde', value: fmt2(p.corresp) },
              { label: 'Ha pagado (real)', value: fmt2(p.pagado), bold: true, color: p.color },
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

      {/* Resultado global */}
      {!tienePagos ? (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--bg3)', border: '1px solid var(--border)', textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
          Sin pagos registrados aún — ve a Gastos y usa el botón "✓ Pago"
        </div>
      ) : deudorFinal ? (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: lineasDeuda.length > 0 ? 12 : 0 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>
              <span style={{ color: 'var(--red)' }}>{deudorFinal}</span> debe a <span style={{ color: 'var(--green)' }}>{acreedorFinal}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Basado en pagos reales registrados</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--red)' }}>{fmt2(cantidadFinal)}</div>
        </div>
      ) : (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center', fontSize: 13, color: 'var(--green)', fontWeight: 500, marginBottom: lineasDeuda.length > 0 ? 12 : 0 }}>
          Estáis al día — sin deudas pendientes
        </div>
      )}

      {/* Desglose por línea */}
      {tienePagos && lineasDeuda.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, marginTop: 4 }}>
            Desglose por gasto
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {lineasDeuda.map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {l.nombre}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    <span style={{ textTransform: 'capitalize' }}>{l.categoria}</span>
                    {' · '}
                    {l.frecuencia}
                    {' · '}
                    Le corresponde a {l.deudor}: {fmt2(l.deudor === 'Alberto' ? l.corrA : l.corrP)}
                    {(l.reembAP > 0 || l.reembPA > 0) && (
                      <span style={{ color: 'var(--amber)' }}> · Ya reembolsado: {fmt2(l.deudor === 'Alberto' ? l.reembAP : l.reembPA)}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--amber)' }}>
                    {fmt2(l.pendiente)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                    <span style={{ color: 'var(--red)' }}>{l.deudor}</span> → <span style={{ color: 'var(--green)' }}>{l.acreedor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
