import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import ClienteModal from '../components/ClienteModal'
import { useClientes } from '../hooks/useData'
import { getStage, formatEur, whatsappUrl } from '../lib/constants'

function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="4"/><line x1="9.5" y1="9.5" x2="13" y2="13"/></svg>
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg>
}
function EditIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.5 1.5l2 2-7 7H2.5v-2l7-7z"/></svg>
}

export default function Contactos() {
  const { clientes, crear, actualizar, eliminar } = useClientes()
  const [search, setSearch] = useState('')
  const [filtroResp, setFiltroResp] = useState('todos')
  const [filtroEtapa, setFiltroEtapa] = useState('todas')
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const filtrados = useMemo(() => clientes.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || [c.nombre, c.empresa, c.email, c.telefono].some(f => f?.toLowerCase().includes(q))
    const matchResp = filtroResp === 'todos' || c.responsable === filtroResp
    const matchEtapa = filtroEtapa === 'todas' || c.etapa === filtroEtapa
    return matchSearch && matchResp && matchEtapa
  }), [clientes, search, filtroResp, filtroEtapa])

  const handleExport = () => {
    const header = ['Nombre','Empresa','Email','Teléfono','Etapa','Valor','Responsable','Origen','Servicios','Notas']
    const rows = filtrados.map(c => [
      c.nombre, c.empresa, c.email, c.telefono,
      getStage(c.etapa).label, c.valor_deal || '',
      c.responsable, c.origen,
      Array.isArray(c.servicios) ? c.servicios.join('; ') : c.servicios || '',
      c.notas || ''
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `clientes_oneseven_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <Layout
      title="Contactos"
      subtitle={`${clientes.length} clientes`}
      actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="search-wrap">
            <SearchIcon />
            <input className="search-input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 120 }} value={filtroResp} onChange={e => setFiltroResp(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="pablo">Pablo</option>
            <option value="alberto">Alberto</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={handleExport}>Exportar CSV</button>
          <button className="btn btn-primary" onClick={() => { setSelected(null); setModalOpen(true) }}>
            <PlusIcon /> Nuevo
          </button>
        </div>
      }
    >
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Empresa</th>
                <th>Etapa</th>
                <th>Valor</th>
                <th>Responsable</th>
                <th>Contactar</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
                    {search ? 'Sin resultados para esa búsqueda' : 'Sin clientes todavía. Crea el primero.'}
                  </td>
                </tr>
              )}
              {filtrados.map(c => {
                const stage = getStage(c.etapa)
                return (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => { setSelected(c); setModalOpen(true) }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: stage.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: stage.color, flexShrink: 0 }}>
                          {(c.nombre || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text0)' }}>{c.nombre}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{c.empresa || '—'}</td>
                    <td><span className={`badge ${stage.badgeClass}`}>{stage.label}</span></td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--green)' }}>{c.valor_deal ? formatEur(c.valor_deal) : '—'}</td>
                    <td>
                      <span style={{ fontSize: 12, padding: '2px 8px', background: c.responsable === 'pablo' ? '#6366f122' : '#10b98122', color: c.responsable === 'pablo' ? '#6366f1' : '#10b981', borderRadius: 10 }}>
                        {c.responsable === 'pablo' ? 'Pablo' : 'Alberto'}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.telefono && (
                          <a className="wa-btn" style={{ padding: '4px 8px', fontSize: 11 }} href={whatsappUrl(c.telefono)} target="_blank" rel="noopener noreferrer">
                            WA
                          </a>
                        )}
                        {c.email && (
                          <a className="email-btn" style={{ padding: '4px 8px', fontSize: 11 }} href={`mailto:${c.email}`}>
                            Email
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={e => { e.stopPropagation(); setSelected(c); setModalOpen(true) }}>
                        <EditIcon />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <ClienteModal
          cliente={selected}
          onClose={() => { setModalOpen(false); setSelected(null) }}
          onSave={async (data) => {
            if (selected?.id) await actualizar(selected.id, data)
            else await crear(data)
            setModalOpen(false); setSelected(null)
          }}
        />
      )}
    </Layout>
  )
}
