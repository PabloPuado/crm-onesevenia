import { useState, useRef } from 'react'
import Layout from '../components/Layout'
import { useDocumentos } from '../hooks/useData'
import { useClientes } from '../hooks/useData'
import { whatsappUrl } from '../lib/constants'

function UploadIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 10V3M5 6l3-3 3 3"/><path d="M3 12h10"/></svg>
}
function DocIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 2H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-5-5z"/><path d="M11 2v5h5"/></svg>
}
function CloseIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>
}

const CATEGORIAS = ['Contrato modelo', 'Presupuesto modelo', 'Propuesta modelo', 'Plantilla email', 'Otro']

const formatSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

export default function Documentos() {
  const { documentos, loading, subir, eliminar } = useDocumentos()
  const { clientes } = useClientes()
  const [categFiltro, setCategFiltro] = useState('Todos')
  const [uploading, setUploading] = useState(false)
  const [uploadCateg, setUploadCateg] = useState('Contrato modelo')
  const [shareModal, setShareModal] = useState(null)
  const [shareClienteId, setShareClienteId] = useState('')
  const fileRef = useRef()

  const filtrados = documentos.filter(d => categFiltro === 'Todos' || d.categoria === categFiltro)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    await subir(file, uploadCateg)
    setUploading(false)
    e.target.value = ''
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    setUploading(true)
    await subir(file, uploadCateg)
    setUploading(false)
  }

  const handleShareWa = (doc) => {
    const cliente = clientes.find(c => c.id === shareClienteId)
    if (!cliente?.telefono) return alert('El cliente no tiene teléfono registrado')
    const text = `Hola ${cliente.nombre}, te envío el documento: ${doc.nombre}\n\nPuedes descargarlo aquí: ${doc.url}`
    window.open(whatsappUrl(cliente.telefono, text), '_blank')
    setShareModal(null)
  }

  const handleShareEmail = (doc) => {
    const cliente = clientes.find(c => c.id === shareClienteId)
    if (!cliente?.email) return alert('El cliente no tiene email registrado')
    const subject = encodeURIComponent(`Documento: ${doc.nombre}`)
    const body = encodeURIComponent(`Hola ${cliente.nombre},\n\nTe envío el documento solicitado: ${doc.nombre}\n\nPuedes descargarlo aquí: ${doc.url}\n\nSaludos,\nONESEVEN IA`)
    window.open(`mailto:${cliente.email}?subject=${subject}&body=${body}`)
    setShareModal(null)
  }

  return (
    <Layout title="Documentos" subtitle="Contratos, presupuestos y propuestas modelo">
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'flex-start' }}>
        {/* Upload panel */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Subir documento</div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="form-select" value={uploadCateg} onChange={e => setUploadCateg(e.target.value)}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: '1.5px dashed var(--border2)', borderRadius: 'var(--radius)',
                padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            >
              <UploadIcon />
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
                {uploading ? 'Subiendo...' : 'Arrastra o haz clic para subir'}
              </div>
              <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFile} />
            </div>
          </div>

          {/* Filtro categoría */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>Categorías</div>
            {['Todos', ...CATEGORIAS].map(c => (
              <button
                key={c}
                onClick={() => setCategFiltro(c)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)',
                  background: categFiltro === c ? 'var(--accent-dim)' : 'none',
                  color: categFiltro === c ? 'var(--accent2)' : 'var(--text1)',
                  border: 'none', cursor: 'pointer', fontSize: 13, transition: 'all 0.15s', fontFamily: 'var(--font)',
                }}
              >
                {c}
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {c === 'Todos' ? documentos.length : documentos.filter(d => d.categoria === c).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Documentos grid */}
        <div>
          {filtrados.length === 0 && !loading && (
            <div className="card empty-state">
              <div className="empty-state-icon"><DocIcon /></div>
              <div className="empty-state-text">No hay documentos en esta categoría. Sube el primero.</div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {filtrados.map(doc => (
              <div key={doc.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ color: 'var(--accent2)' }}><DocIcon /></div>
                  <button className="btn-icon" style={{ width: 24, height: 24, color: 'var(--red)' }} onClick={() => eliminar(doc.id, doc.storage_path)}>
                    <CloseIcon />
                  </button>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text0)', lineHeight: 1.4, wordBreak: 'break-word' }}>{doc.nombre}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{doc.categoria}</div>
                  {doc.tamano && <div style={{ fontSize: 10, color: 'var(--text3)' }}>{formatSize(doc.tamano)}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
                  <a
                    href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm" style={{ justifyContent: 'center', fontSize: 11 }}
                  >
                    Ver / Descargar
                  </a>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)', justifyContent: 'center', fontSize: 11 }}
                    onClick={() => { setShareModal(doc); setShareClienteId('') }}
                  >
                    Enviar a cliente
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share modal */}
      {shareModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShareModal(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">Enviar a cliente</div>
              <button className="modal-close" onClick={() => setShareModal(null)}><CloseIcon /></button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
              Documento: <span style={{ color: 'var(--text0)', fontWeight: 500 }}>{shareModal.nombre}</span>
            </div>
            <div className="form-group">
              <label className="form-label">Seleccionar cliente</label>
              <select className="form-select" value={shareClienteId} onChange={e => setShareClienteId(e.target.value)}>
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` — ${c.empresa}` : ''}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                className="wa-btn"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => handleShareWa(shareModal)}
                disabled={!shareClienteId}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </button>
              <button
                className="email-btn"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => handleShareEmail(shareModal)}
                disabled={!shareClienteId}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 3l6 5 6-5"/><rect x="1" y="2" width="12" height="10" rx="1"/></svg>
                Email
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
