import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useClientes } from '../hooks/useData'
import { STAGES, ORIGENES, SERVICIOS, getStage, formatEur, formatDate, whatsappUrl } from '../lib/constants'
import ClienteModal from '../components/ClienteModal'
import { useAuth } from '../context/AuthContext'

function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg> }
function FilterIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 3h12M3 7h8M5 11h4"/></svg> }
function SearchIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="4"/><line x1="9.5" y1="9.5" x2="13" y2="13"/></svg> }
function TrashIcon() { return <svg width='13' height='13' viewBox='0 0 13 13' fill='none' stroke='currentColor' strokeWidth='1.5'><path d='M2 3h9M5 3V2h3v1M3 3l.5 8h6l.5-8'/></svg> }
function CopyIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="8" height="8" rx="1"/><path d="M1 9V2a1 1 0 0 1 1-1h7"/></svg> }

// Filtros rápidos predefinidos
const FILTROS_RAPIDOS = [
  { id: 'todos', label: 'Todos', icon: '◉' },
  { id: 'mis_leads', label: 'Mis leads', icon: '👤', fn: (c, user) => (c.etapa === 'lead' || c.etapa === 'cualificado') && c.responsable === user },
  { id: 'activos', label: 'Activos', icon: '🟢', fn: (c) => ['ganado','desarrollando','terminado','activo'].includes(c.etapa) },
  { id: 'propuesta_pendiente', label: 'Con propuesta', icon: '📄', fn: (c) => c.etapa === 'propuesta' || c.etapa === 'negociacion' },
  { id: 'sin_proximo_paso', label: 'Sin próximo paso', icon: '⚠️', fn: (c) => !c.proximo_paso && !['perdido','terminado'].includes(c.etapa) },
  { id: 'perdidos', label: 'Perdidos', icon: '❌', fn: (c) => c.etapa === 'perdido' },
  { id: 'alto_valor', label: 'Alto valor (+5k€)', icon: '💰', fn: (c) => (c.valor_deal || 0) >= 5000 },
  { id: 'alberto', label: 'Alberto', icon: '👤', fn: (c) => c.responsable === 'alberto' },
]

export default function Contactos() {
  const { clientes, crear, actualizar, eliminar } = useClientes()
  const { getUserName } = useAuth()
  const userName = getUserName()

  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filtroRapido, setFiltroRapido] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [filtroEtapa, setFiltroEtapa] = useState('')
  const [filtroOrigen, setFiltroOrigen] = useState('')
  const [filtroResponsable, setFiltroResponsable] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)
  const [sortBy, setSortBy] = useState('reciente')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const clientesFiltrados = useMemo(() => {
    let lista = [...clientes]

    // Filtro rápido
    if (filtroRapido !== 'todos') {
      const fr = FILTROS_RAPIDOS.find(f => f.id === filtroRapido)
      if (fr?.fn) lista = lista.filter(c => fr.fn(c, userName))
    }

    // Filtros avanzados
    if (busqueda) {
      const q = busqueda.toLowerCase()
      lista = lista.filter(c =>
        [c.nombre, c.empresa, c.email, c.telefono].some(f => f?.toLowerCase().includes(q))
      )
    }
    if (filtroEtapa) lista = lista.filter(c => c.etapa === filtroEtapa)
    if (filtroOrigen) lista = lista.filter(c => c.origen === filtroOrigen)
    if (filtroResponsable) lista = lista.filter(c => c.responsable === filtroResponsable)

    // Ordenar
    lista.sort((a, b) => {
      if (sortBy === 'reciente') return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'valor') return (b.valor_deal || 0) - (a.valor_deal || 0)
      if (sortBy === 'nombre') return (a.nombre || '').localeCompare(b.nombre || '')
      return 0
    })

    return lista
  }, [clientes, filtroRapido, busqueda, filtroEtapa, filtroOrigen, filtroResponsable, sortBy, userName])

  const handleDuplicar = async (c) => {
    const { id, created_at, ...datos } = c
    await crear({ ...datos, nombre: `${c.nombre} (copia)`, etapa: 'lead' })
  }

  const hayFiltrosActivos = filtroEtapa || filtroOrigen || filtroResponsable || busqueda

  return (
    <Layout
      title="Contactos"
      subtitle={`${clientesFiltrados.length} de ${clientes.length} contactos`}
      actions={
        <button className="btn btn-primary" onClick={() => { setSelected(null); setModalOpen(true) }}>
          <PlusIcon /> Nuevo contacto
        </button>
      }
    >
      {/* Filtros rápidos */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {FILTROS_RAPIDOS.map(f => (
          <button
            key={f.id}
            onClick={() => setFiltroRapido(f.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: `1px solid ${filtroRapido === f.id ? 'var(--accent)' : 'var(--border2)'}`,
              background: filtroRapido === f.id ? 'var(--accent-dim)' : 'none',
              color: filtroRapido === f.id ? 'var(--accent2)' : 'var(--text2)',
              fontWeight: filtroRapido === f.id ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 11 }}>{f.icon}</span>
            {f.label}
            <span style={{
              fontSize: 10, padding: '1px 5px', borderRadius: 10,
              background: filtroRapido === f.id ? 'var(--accent)' : 'var(--bg4)',
              color: filtroRapido === f.id ? '#fff' : 'var(--text3)',
              marginLeft: 2,
            }}>
              {f.id === 'todos' ? clientes.length : clientes.filter(c => f.fn ? f.fn(c, userName) : true).length}
            </span>
          </button>
        ))}
      </div>

      {/* Barra búsqueda + filtros avanzados */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}><SearchIcon /></div>
          <input
            className="form-input"
            style={{ paddingLeft: 32 }}
            placeholder="Buscar por nombre, empresa, email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <button
          className={`btn ${showFiltros || hayFiltrosActivos ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setShowFiltros(!showFiltros)}
          style={{ gap: 5 }}
        >
          <FilterIcon />
          Filtros
          {hayFiltrosActivos && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '1px 5px' }}>
            {[filtroEtapa, filtroOrigen, filtroResponsable, busqueda].filter(Boolean).length}
          </span>}
        </button>
        <select className="form-select" style={{ width: 140 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="reciente">Más recientes</option>
          <option value="valor">Mayor valor</option>
          <option value="nombre">Por nombre</option>
        </select>
      </div>

      {/* Filtros avanzados expandibles */}
      {showFiltros && (
        <div className="card" style={{ marginBottom: 16, padding: '14px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Etapa</label>
              <select className="form-select" value={filtroEtapa} onChange={e => setFiltroEtapa(e.target.value)}>
                <option value="">Todas las etapas</option>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Origen</label>
              <select className="form-select" value={filtroOrigen} onChange={e => setFiltroOrigen(e.target.value)}>
                <option value="">Todos los orígenes</option>
                {ORIGENES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Responsable</label>
              <select className="form-select" value={filtroResponsable} onChange={e => setFiltroResponsable(e.target.value)}>
                <option value="">Todos</option>
                <option value="pablo">Pablo</option>
                <option value="alberto">Alberto</option>
              </select>
            </div>
          </div>
          {hayFiltrosActivos && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 10, fontSize: 11 }}
              onClick={() => { setFiltroEtapa(''); setFiltroOrigen(''); setFiltroResponsable(''); setBusqueda('') }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Lista de contactos */}
      {clientesFiltrados.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-text">
            {hayFiltrosActivos || filtroRapido !== 'todos'
              ? 'No hay contactos con estos filtros'
              : 'Añade tu primer contacto para empezar'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {clientesFiltrados.map(c => {
            const stage = getStage(c.etapa)
            return (
              <div
                key={c.id}
                className="card"
                style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                onClick={() => { setSelected(c); setModalOpen(true) }}
              >
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: stage.color + '22', color: stage.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                }}>
                  {(c.nombre || '?')[0].toUpperCase()}
                </div>

                {/* Info principal */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>{c.nombre}</span>
                    {c.empresa && <span style={{ fontSize: 12, color: 'var(--text3)' }}>{c.empresa}</span>}
                    <span className={`badge ${stage.badgeClass}`}>{stage.label}</span>
                    {c.origen && <span style={{ fontSize: 10, padding: '1px 6px', background: 'var(--bg4)', color: 'var(--text3)', borderRadius: 10 }}>{c.origen}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
                    {c.email && <span>{c.email}</span>}
                    {c.telefono && <span>{c.telefono}</span>}
                    {c.servicios?.length > 0 && <span>{Array.isArray(c.servicios) ? c.servicios.join(', ') : c.servicios}</span>}
                  </div>
                  {c.proximo_paso && (
                    <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>→</span>
                      <span>{c.proximo_paso}</span>
                      {c.fecha_proximo_paso && <span style={{ opacity: 0.7 }}>· {formatDate(c.fecha_proximo_paso)}</span>}
                    </div>
                  )}
                </div>

                {/* Valor + responsable + acciones */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {c.valor_deal && (
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text0)' }}>
                      {formatEur(c.valor_deal)}
                    </span>
                  )}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                    background: c.responsable === 'pablo' ? '#6366f122' : '#10b98122',
                    color: c.responsable === 'pablo' ? '#6366f1' : '#10b981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {c.responsable === 'pablo' ? 'P' : 'A'}
                  </div>
                  {c.telefono && (
                    <a
                      href={whatsappUrl(c.telefono)}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ color: '#25d366', display: 'flex', alignItems: 'center' }}
                      title="Abrir WhatsApp"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                  )}
                  <button
                    className="btn-icon"
                    style={{ width: 26, height: 26, color: 'var(--text3)' }}
                    onClick={e => { e.stopPropagation(); handleDuplicar(c) }}
                    title="Duplicar contacto"
                  >
                    <CopyIcon />
                  </button>
                  <button
                    className="btn-icon"
                    style={{ width: 26, height: 26, color: 'var(--red)' }}
                    onClick={e => { e.stopPropagation(); setConfirmDelete(c) }}
                    title="Eliminar contacto"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: '28px', maxWidth: 400, width: '100%', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>!</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text0)', marginBottom: 8 }}>Eliminar contacto</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}>
              Eliminar a <strong style={{ color: 'var(--text1)' }}>{confirmDelete.nombre}</strong>?
            </div>
            <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 24, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
              Se eliminara de contactos, pipeline, propuestas, presupuestos, tareas y actividad asociada.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn" style={{ background: 'var(--red)', color: '#fff', border: 'none' }} onClick={async () => { await eliminar(confirmDelete.id); setConfirmDelete(null) }}>
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <ClienteModal
          cliente={selected}
          onClose={() => { setModalOpen(false); setSelected(null) }}
          onSave={async (data) => {
            if (selected?.id) await actualizar(selected.id, data)
            else await crear(data)
            setModalOpen(false)
            setSelected(null)
          }}
        />
      )}
    </Layout>
  )
}
