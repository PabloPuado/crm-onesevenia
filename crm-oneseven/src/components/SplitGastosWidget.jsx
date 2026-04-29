import { useState } from 'react'
import { useGastos, usePagosGastos, useLiquidaciones } from '../hooks/useData'
import { formatDate } from '../lib/constants'

const fmt2 = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(Math.abs(parseFloat(n) || 0))

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const HOY = new Date()
const MES_ACTUAL = HOY.getMonth()
const ANO_ACTUAL = HOY.getFullYear()

function importeMensualizado(g) {
  const imp = parseFloat(g.importe) || 0
  switch (g.frecuencia) {
    case 'mensual': return imp
    case 'trimestral': return imp / 3
    case 'semestral': return imp / 6
    case 'anual': return imp / 12
    default: return 0
  }
}

function corrPersona(g, persona) {
  const imp = parseFloat(g.importe) || 0
  const modo = g[`modo_${persona}`] || 'pct'
  if (modo === 'fijo') return parseFloat(g[`fijo_${persona}`]) || 0
  return imp * (parseFloat(g[`pct_${persona}`]) || 0) / 100
}

// ─── Modal liquidación ─────────────────────────────────────────────────────────
function ModalLiquidacion({ deudor, acreedor, importeSugerido, gastosPendientes, onClose, onConfirm }) {
  const [modo, setModo] = useState('total') // total | gasto
  const [importeTotal, setImporteTotal] = useState(importeSugerido.toFixed(2))
  const [gastoSeleccionado, setGastoSeleccionado] = useState(gastosPendientes[0]?.id || '')
  const [importeGasto, setImporteGasto] = useState(gastosPendientes[0]?.pendiente.toFixed(2) || '')
  const [fecha, setFecha] = useState(HOY.toISOString().split('T')[0])
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)

  const gastoSel = gastosPendientes.find(g => g.id === gastoSeleccionado)

  const handleConfirm = async () => {
    setSaving(true)
    if (modo === 'total') {
      await onConfirm([{
        pagador: deudor.toLowerCase(),
        receptor: acreedor.toLowerCase(),
        importe: parseFloat(importeTotal),
        fecha, notas,
        tipo: 'liquidacion_total'
      }])
    } else {
      await onConfirm([{
        gasto_id: gastoSeleccionado,
        pagado_por: deudor.toLowerCase(),
        importe: parseFloat(importeGasto),
        fecha, notas,
        tipo: 'reembolso',
        periodo: `${ANO_ACTUAL}-${String(MES_ACTUAL+1).padStart(2,'0')}`
      }])
    }
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'var(--bg1)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:500, border:'1px solid var(--border)', overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--text0)' }}>Registrar liquidación</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
              <span style={{ color:'var(--red)' }}>{deudor}</span> paga a <span style={{ color:'var(--green)' }}>{acreedor}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:18 }}>×</button>
        </div>

        {/* Selector modo */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
          {[
            { id:'total', label:'Pago total', desc:'Saldar toda la deuda de golpe' },
            { id:'gasto', label:'Por gasto', desc:'Pagar un gasto concreto' },
          ].map(m => (
            <button key={m.id} onClick={() => setModo(m.id)} style={{ flex:1, padding:'12px', border:'none', background:'none', cursor:'pointer', borderBottom:`2px solid ${modo===m.id ? 'var(--accent)' : 'transparent'}`, color: modo===m.id ? 'var(--accent2)' : 'var(--text2)' }}>
              <div style={{ fontSize:13, fontWeight:modo===m.id ? 600 : 400 }}>{m.label}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{m.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ padding:20 }}>
          {modo === 'total' ? (
            <>
              <div style={{ padding:'12px 14px', background:'rgba(239,68,68,0.08)', borderRadius:'var(--radius)', marginBottom:16, display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, color:'var(--text2)' }}>Total deuda acumulada</span>
                <span style={{ fontSize:16, fontWeight:700, fontFamily:'var(--mono)', color:'var(--red)' }}>{fmt2(importeSugerido)}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
                <div className="form-group">
                  <label className="form-label">Importe a liquidar (€)</label>
                  <input className="form-input" type="number" step="0.01" value={importeTotal} onChange={e => setImporteTotal(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input className="form-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Gasto a liquidar</label>
                <select className="form-select" value={gastoSeleccionado} onChange={e => {
                  setGastoSeleccionado(e.target.value)
                  const g = gastosPendientes.find(g => g.id === e.target.value)
                  if (g) setImporteGasto(g.pendiente.toFixed(2))
                }}>
                  {gastosPendientes.map(g => (
                    <option key={g.id} value={g.id}>{g.nombre} — {fmt2(g.pendiente)} pendiente</option>
                  ))}
                </select>
              </div>
              {gastoSel && (
                <div style={{ padding:'10px 12px', background:'var(--bg3)', borderRadius:'var(--radius)', marginBottom:12, fontSize:12, color:'var(--text2)' }}>
                  Le corresponde a {deudor}: {fmt2(gastoSel.corrDeudor)} · Ya reembolsado: {fmt2(gastoSel.yaReembolsado)} · <strong style={{ color:'var(--amber)' }}>Pendiente: {fmt2(gastoSel.pendiente)}</strong>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
                <div className="form-group">
                  <label className="form-label">Importe (€)</label>
                  <input className="form-input" type="number" step="0.01" value={importeGasto} onChange={e => setImporteGasto(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input className="form-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
                </div>
              </div>
            </>
          )}
          <div className="form-group" style={{ marginBottom:20 }}>
            <label className="form-label">Notas <span style={{ fontSize:10, color:'var(--text3)' }}>(Bizum, transferencia...)</span></label>
            <input className="form-input" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ref. Bizum, banco..." />
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" disabled={saving} onClick={handleConfirm}>
              {saving ? 'Guardando...' : 'Confirmar liquidación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Widget principal ─────────────────────────────────────────────────────────
export default function SplitGastosWidget({ compact = false }) {
  const { gastos } = useGastos()
  const { pagos, registrar: registrarPago } = usePagosGastos()
  const { liquidaciones, crear: crearLiquidacion } = useLiquidaciones()
  const [modalLiq, setModalLiq] = useState(false)
  const [verDetalle, setVerDetalle] = useState(false)

  const activos = gastos.filter(g => g.activo !== false)
  if (activos.length === 0) return null

  // ── Calcular por gasto ────────────────────────────────────────────────────
  const resumenGastos = activos.map(g => {
    const pagosG = pagos.filter(p => p.gasto_id === g.id)
    const pagP = pagosG.filter(p => p.pagado_por==='pablo' && p.tipo!=='reembolso').reduce((s,p)=>s+(parseFloat(p.importe)||0),0)
    const pagA = pagosG.filter(p => p.pagado_por==='alberto' && p.tipo!=='reembolso').reduce((s,p)=>s+(parseFloat(p.importe)||0),0)
    const reAP = pagosG.filter(p => p.tipo==='reembolso' && p.pagado_por==='alberto').reduce((s,p)=>s+(parseFloat(p.importe)||0),0)
    const rePA = pagosG.filter(p => p.tipo==='reembolso' && p.pagado_por==='pablo').reduce((s,p)=>s+(parseFloat(p.importe)||0),0)
    const corrP = corrPersona(g, 'pablo')
    const corrA = corrPersona(g, 'alberto')
    const totalPagado = pagP + pagA

    let deudor=null, acreedor=null, pendiente=0, corrDeudor=0, yaReembolsado=0
    if (totalPagado > 0 && corrA > 0.01 && corrP > 0.01) {
      if (pagP > corrP) {
        const debe = corrA - reAP
        if (debe > 0.01) { deudor='Alberto'; acreedor='Pablo'; pendiente=debe; corrDeudor=corrA; yaReembolsado=reAP }
      } else if (pagA > corrA) {
        const debe = corrP - rePA
        if (debe > 0.01) { deudor='Pablo'; acreedor='Alberto'; pendiente=debe; corrDeudor=corrP; yaReembolsado=rePA }
      }
    }
    return { ...g, corrP, corrA, pagP, pagA, reAP, rePA, totalPagado, deudor, acreedor, pendiente, corrDeudor, yaReembolsado }
  })

  // ── Totales globales ──────────────────────────────────────────────────────
  const totalCorrespP = resumenGastos.reduce((s,g)=>s+g.corrP,0)
  const totalCorrespA = resumenGastos.reduce((s,g)=>s+g.corrA,0)
  const totalPagadoP = resumenGastos.reduce((s,g)=>s+g.pagP,0)
  const totalPagadoA = resumenGastos.reduce((s,g)=>s+g.pagA,0)

  // Deuda neta = suma de pendientes por línea
  const pendienteAP = resumenGastos.filter(g=>g.deudor==='Alberto').reduce((s,g)=>s+g.pendiente,0)
  const pendientePA = resumenGastos.filter(g=>g.deudor==='Pablo').reduce((s,g)=>s+g.pendiente,0)
  const liqAP = liquidaciones.filter(l=>l.pagador==='alberto').reduce((s,l)=>s+(parseFloat(l.importe)||0),0)
  const liqPA = liquidaciones.filter(l=>l.pagador==='pablo').reduce((s,l)=>s+(parseFloat(l.importe)||0),0)
  const netoAP = pendienteAP - liqAP
  const netoPA = pendientePA - liqPA

  let deudorFinal=null, acreedorFinal=null, cantidadFinal=0
  if (netoAP > 0.01) { deudorFinal='Alberto'; acreedorFinal='Pablo'; cantidadFinal=netoAP }
  else if (netoPA > 0.01) { deudorFinal='Pablo'; acreedorFinal='Alberto'; cantidadFinal=netoPA }

  const tienePagos = totalPagadoP > 0 || totalPagadoA > 0
  const gastosPendientes = resumenGastos.filter(g=>g.pendiente > 0.01)

  // ── Mes actual ────────────────────────────────────────────────────────────
  const mesLabel = `${MESES[MES_ACTUAL]} ${ANO_ACTUAL}`
  const gastosEsMes = activos.filter(g => ['mensual','trimestral','semestral','anual'].includes(g.frecuencia))
  const totalMesP = gastosEsMes.reduce((s,g) => s + importeMensualizado(g) * (parseFloat(g.pct_pablo)||0) / 100, 0)
  const totalMesA = gastosEsMes.reduce((s,g) => s + importeMensualizado(g) * (parseFloat(g.pct_alberto)||0) / 100, 0)

  const handleLiquidacion = async (items) => {
    for (const item of items) {
      if (item.tipo === 'liquidacion_total') {
        await crearLiquidacion({ pagador: item.pagador, receptor: item.receptor, importe: item.importe, fecha: item.fecha, notas: item.notas })
      } else {
        await registrarPago(item)
      }
    }
  }

  return (
    <div className="card" style={{ marginBottom:16 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em' }}>
          Reparto de gastos — Pablo vs Alberto
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {deudorFinal && (
            <button className="btn btn-ghost btn-sm" onClick={() => setModalLiq(true)} style={{ gap:5, color:'var(--green)', fontSize:11 }}>
              ✓ Registrar liquidación
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setVerDetalle(!verDetalle)} style={{ fontSize:11 }}>
            {verDetalle ? 'Ocultar detalle' : 'Ver detalle'}
          </button>
        </div>
      </div>

      {/* Mes actual */}
      <div style={{ padding:'10px 14px', background:'var(--bg3)', borderRadius:'var(--radius)', border:'1px solid var(--border)', marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--accent2)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>
          {mesLabel} — gastos recurrentes
        </div>
        <div style={{ display:'flex', gap:12 }}>
          {[
            { name:'Pablo', val: totalMesP, color:'#6366f1' },
            { name:'Alberto', val: totalMesA, color:'#06b6d4' },
          ].map(p => (
            <div key={p.name} style={{ flex:1, padding:'8px 12px', background:'var(--bg1)', borderRadius:8, textAlign:'center' }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:3 }}>{p.name} — le corresponde/mes</div>
              <div style={{ fontSize:16, fontWeight:700, fontFamily:'var(--mono)', color:p.color }}>{fmt2(p.val)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tarjetas acumulado */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        {[
          { nombre:'Pablo', corresp:totalCorrespP, pagado:totalPagadoP, saldo: totalPagadoP - totalCorrespP + liqAP - liqPA, color:'#6366f1' },
          { nombre:'Alberto', corresp:totalCorrespA, pagado:totalPagadoA, saldo: totalPagadoA - totalCorrespA + liqPA - liqAP, color:'#06b6d4' },
        ].map(p => (
          <div key={p.nombre} style={{ padding:'12px 14px', background:'var(--bg3)', borderRadius:'var(--radius)', border:`1px solid ${p.color}25` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:14, fontWeight:600, color:p.color }}>{p.nombre}</span>
              {tienePagos && (
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background: p.saldo >= -0.01 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: p.saldo >= -0.01 ? 'var(--green)' : 'var(--red)', fontWeight:500 }}>
                  {p.saldo >= -0.01 ? `+${fmt2(p.saldo)} a favor` : `${fmt2(Math.abs(p.saldo))} debe`}
                </span>
              )}
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', display:'flex', flexDirection:'column', gap:3 }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span>Total corresponde (acum.)</span>
                <span style={{ fontFamily:'var(--mono)', color:'var(--text1)' }}>{fmt2(p.corresp)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span>Total pagado (registrado)</span>
                <span style={{ fontFamily:'var(--mono)', color:p.color, fontWeight:600 }}>{fmt2(p.pagado)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resultado final */}
      {!tienePagos ? (
        <div style={{ padding:'10px 14px', borderRadius:'var(--radius)', background:'var(--bg3)', border:'1px solid var(--border)', textAlign:'center', fontSize:12, color:'var(--text3)' }}>
          Sin pagos registrados — ve a Gastos y registra los pagos con el botón "✓ Pago"
        </div>
      ) : deudorFinal ? (
        <div style={{ padding:'12px 16px', borderRadius:'var(--radius)', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: verDetalle && gastosPendientes.length > 0 ? 12 : 0 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text0)' }}>
              <span style={{ color:'var(--red)' }}>{deudorFinal}</span> debe a <span style={{ color:'var(--green)' }}>{acreedorFinal}</span>
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
              Suma de pendientes reales (descontados reembolsos ya realizados)
            </div>
          </div>
          <div style={{ fontSize:24, fontWeight:800, fontFamily:'var(--mono)', color:'var(--red)' }}>{fmt2(cantidadFinal)}</div>
        </div>
      ) : (
        <div style={{ padding:'10px 14px', borderRadius:'var(--radius)', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', textAlign:'center', fontSize:13, color:'var(--green)', fontWeight:500 }}>
          Estáis al día — sin deudas pendientes
        </div>
      )}

      {/* Detalle por gasto */}
      {verDetalle && gastosPendientes.length > 0 && (
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>
            Desglose por gasto — pendiente de cobro
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {gastosPendientes.map(g => (
              <div key={g.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--bg3)', borderRadius:8, border:'1px solid var(--border)' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text0)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.nombre}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                    <span style={{ textTransform:'capitalize' }}>{g.categoria}</span> · {g.frecuencia}
                    {' · '}Le corresponde a {g.deudor}: {fmt2(g.corrDeudor)}
                    {g.yaReembolsado > 0.01 && <span style={{ color:'var(--amber)' }}> · Ya pagado: {fmt2(g.yaReembolsado)}</span>}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color:'var(--amber)' }}>{fmt2(g.pendiente)}</div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>
                    <span style={{ color:'var(--red)' }}>{g.deudor}</span> → <span style={{ color:'var(--green)' }}>{g.acreedor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial liquidaciones */}
      {liquidaciones.length > 0 && verDetalle && (
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Liquidaciones registradas</div>
          {liquidaciones.slice(0,5).map(l => (
            <div key={l.id} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ color:'var(--text2)' }}>
                {formatDate(l.fecha)} · <span style={{ color:'var(--red)', textTransform:'capitalize' }}>{l.pagador}</span> → <span style={{ color:'var(--green)', textTransform:'capitalize' }}>{l.receptor}</span>
                {l.notas ? ` · ${l.notas}` : ''}
              </span>
              <span style={{ fontFamily:'var(--mono)', fontWeight:600, color:'var(--green)' }}>{fmt2(l.importe)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Modal liquidación */}
      {modalLiq && deudorFinal && (
        <ModalLiquidacion
          deudor={deudorFinal}
          acreedor={acreedorFinal}
          importeSugerido={cantidadFinal}
          gastosPendientes={gastosPendientes.filter(g=>g.deudor===deudorFinal)}
          onClose={() => setModalLiq(false)}
          onConfirm={handleLiquidacion}
        />
      )}
    </div>
  )
}
