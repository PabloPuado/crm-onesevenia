// Utilidad compartida para cálculo de split de gastos
// Se usa en Dashboard.jsx y Gastos.jsx

export function calcularSplitGastos(gastos, pagos, liquidaciones) {
  const activos = (gastos || []).filter(g => g.activo !== false)
  const todosPagos = pagos || []
  const todasLiq = liquidaciones || []

  let totalCorrespP = 0, totalCorrespA = 0
  let totalPagadoRealP = 0, totalPagadoRealA = 0

  const lineasDeuda = [] // desglose por gasto

  activos.forEach(g => {
    const imp = parseFloat(g.importe) || 0
    if (imp <= 0) return

    const mP = g.modo_pablo || 'pct'
    const mA = g.modo_alberto || 'pct'
    const corrP = mP === 'fijo' ? (parseFloat(g.fijo_pablo)||0) : imp * (parseFloat(g.pct_pablo)||0) / 100
    const corrA = mA === 'fijo' ? (parseFloat(g.fijo_alberto)||0) : imp * (parseFloat(g.pct_alberto)||0) / 100

    totalCorrespP += corrP
    totalCorrespA += corrA

    const pagosGasto = todosPagos.filter(p => p.gasto_id === g.id)
    const pagP = pagosGasto.filter(p => p.pagado_por === 'pablo' && p.tipo !== 'reembolso').reduce((s,p) => s+(parseFloat(p.importe)||0), 0)
    const pagA = pagosGasto.filter(p => p.pagado_por === 'alberto' && p.tipo !== 'reembolso').reduce((s,p) => s+(parseFloat(p.importe)||0), 0)
    const reAP = pagosGasto.filter(p => p.tipo === 'reembolso' && p.pagado_por === 'alberto').reduce((s,p) => s+(parseFloat(p.importe)||0), 0)
    const rePA = pagosGasto.filter(p => p.tipo === 'reembolso' && p.pagado_por === 'pablo').reduce((s,p) => s+(parseFloat(p.importe)||0), 0)

    totalPagadoRealP += pagP
    totalPagadoRealA += pagA

    // Deuda de este gasto concreto
    const totalPagGasto = pagP + pagA
    if (totalPagGasto > 0 && (corrP > 0.01 || corrA > 0.01)) {
      let deudorG = null, acreedorG = null, pendienteG = 0
      if (pagP > corrP && corrA > 0.01) {
        // Pablo pagó más → Alberto le debe
        const debe = corrA - reAP
        if (debe > 0.01) { deudorG = 'Alberto'; acreedorG = 'Pablo'; pendienteG = debe }
      } else if (pagA > corrA && corrP > 0.01) {
        const debe = corrP - rePA
        if (debe > 0.01) { deudorG = 'Pablo'; acreedorG = 'Alberto'; pendienteG = debe }
      }
      if (deudorG) {
        lineasDeuda.push({
          id: g.id,
          nombre: g.nombre,
          categoria: g.categoria,
          frecuencia: g.frecuencia,
          deudor: deudorG,
          acreedor: acreedorG,
          pendiente: pendienteG,
          corrP, corrA,
          pagP, pagA,
          reembAP: reAP,
          reembPA: rePA,
        })
      }
    }
  })

  // Liquidaciones globales
  const liqAP = todasLiq.filter(l => l.pagador === 'alberto').reduce((s,l) => s+(parseFloat(l.importe)||0), 0)
  const liqPA = todasLiq.filter(l => l.pagador === 'pablo').reduce((s,l) => s+(parseFloat(l.importe)||0), 0)

  const saldoNetoP = totalPagadoRealP - totalCorrespP + liqAP - liqPA
  const saldoNetoA = totalPagadoRealA - totalCorrespA + liqPA - liqAP

  let deudorFinal = null, acreedorFinal = null, cantidadFinal = 0
  if (saldoNetoA < -0.01) {
    deudorFinal = 'Alberto'; acreedorFinal = 'Pablo'; cantidadFinal = Math.abs(saldoNetoA)
  } else if (saldoNetoP < -0.01) {
    deudorFinal = 'Pablo'; acreedorFinal = 'Alberto'; cantidadFinal = Math.abs(saldoNetoP)
  }

  const tienePagos = totalPagadoRealP > 0 || totalPagadoRealA > 0

  return {
    totalCorrespP, totalCorrespA,
    totalPagadoRealP, totalPagadoRealA,
    saldoNetoP, saldoNetoA,
    deudorFinal, acreedorFinal, cantidadFinal,
    lineasDeuda,
    tienePagos,
  }
}
