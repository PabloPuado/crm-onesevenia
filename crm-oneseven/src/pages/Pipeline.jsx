import { useState } from 'react'
import Layout from '../components/Layout'
import { useClientes } from '../hooks/useData'
import { STAGES, getStage, formatEur, whatsappUrl } from '../lib/constants'
import ClienteModal from '../components/ClienteModal'

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg>
}

export default function Pipeline() {
  const { clientes, crear, actualizar } = useClientes()
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filtroResp, setFiltroResp] = useState('todos')

  const filtrados = clientes.filter(c =>
    filtroResp === 'todos' || c.responsable === filtroResp
  ).filter(c => c.etapa !== 'perdido')

  const handleDrop = async (e, stageId) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('clienteId')
    if (id) await actualizar(id, { etapa: stageId })
  }

  const displayStages = STAGES.filter(s => s.id !== 'perdido')

  return (
    <Layout
      title="Pipeline"
      subtitle="Vista kanban de oportunidades"
      actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="tabs">
            <button className={`tab-btn ${filtroResp === 'todos' ? 'active' : ''}`} onClick={() => setFiltroResp('todos')}>Todos</button>
            <button className={`tab-btn ${filtroResp === 'pablo' ? 'active' : ''}`} onClick={() => setFiltroResp('pablo')}>Pablo</button>
            <button className={`tab-btn ${filtroResp === 'alberto' ? 'active' : ''}`} onClick={() => setFiltroResp('alberto')}>Alberto</button>
          </div>
          <button className="btn btn-primary" onClick={() => { setSelected(null); setModalOpen(true) }}>
            <PlusIcon /> Nuevo cliente
          </button>
        </div>
      }
    >
      <div className="kanban-board">
        {displayStages.map(stage => {
          const cols = filtrados.filter(c => c.etapa === stage.id)
          const total = cols.reduce((s, c) => s + (c.valor_deal || 0), 0)
          return (
            <div
              key={stage.id}
              className={`kanban-col stage-${stage.id}`}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, stage.id)}
            >
              <div className="kanban-col-header">
                <div>
                  <div className="kanban-col-title">{stage.label}</div>
                  {total > 0 && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{formatEur(total)}</div>}
                </div>
                <span className="kanban-count">{cols.length}</span>
              </div>
              <div className="kanban-cards">
                {cols.map(c => (
                  <div
                    key={c.id}
                    className="kanban-card"
                    draggable
                    onDragStart={e => e.dataTransfer.setData('clienteId', c.id)}
                    onClick={() => { setSelected(c); setModalOpen(true) }}
                  >
                    <div className="kanban-card-name">{c.nombre}</div>
                    <div className="kanban-card-company">{c.empresa || 'Sin empresa'}</div>
                    {c.servicios && (
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 8 }}>{Array.isArray(c.servicios) ? c.servicios.join(', ') : c.servicios}</div>
                    )}
                    <div className="kanban-card-footer">
                      <div className="kanban-card-value">
                        {c.valor_deal ? formatEur(c.valor_deal) : '—'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {c.telefono && (
                          <a
                            href={whatsappUrl(c.telefono)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ display: 'flex', alignItems: 'center', color: '#25d366', fontSize: 14 }}
                            title="Abrir WhatsApp"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          </a>
                        )}
                        <div
                          className="kanban-card-owner"
                          style={{
                            background: c.responsable === 'pablo' ? '#6366f122' : '#10b98122',
                            color: c.responsable === 'pablo' ? '#6366f1' : '#10b981',
                          }}
                        >
                          {c.responsable === 'pablo' ? 'P' : 'A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  style={{ width: '100%', padding: '8px', background: 'none', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', color: 'var(--text3)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)' }}
                  onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text3)' }}
                  onClick={() => { setSelected({ etapa: stage.id }); setModalOpen(true) }}
                >
                  <PlusIcon /> Añadir
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {modalOpen && (
        <ClienteModal
          cliente={selected}
          onClose={() => { setModalOpen(false); setSelected(null) }}
          onSave={async (data) => {
            if (selected?.id) {
              await actualizar(selected.id, data)
            } else {
              await crear(data)
            }
            setModalOpen(false)
            setSelected(null)
          }}
        />
      )}
    </Layout>
  )
}
