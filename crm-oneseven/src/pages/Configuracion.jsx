import { useState } from 'react'
import Layout from '../components/Layout'
import { useEmpresaConfig, useDesarrolladores } from '../hooks/useData'

const ESPECIALIDADES = ['Frontend', 'Backend', 'Full Stack', 'Mobile', 'IA / ML', 'Diseño UI/UX', 'DevOps', 'QA / Testing', 'Otro']

function EditIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2l2 2-7 7H2V9L9 2z"/></svg> }
function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h9M5 3V2h3v1M3 3l.5 8h6l.5-8"/></svg> }
function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg> }
function CloseIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg> }
function CheckIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l4 4 6-6"/></svg> }

// ─── Sección empresa ──────────────────────────────────────────────────────────
function SeccionEmpresa() {
  const { config, guardar } = useEmpresaConfig()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Inicializar form cuando config carga
  if (config && form === null) {
    setForm({
      nombre: '', cif: '', direccion: '', ciudad: '', cp: '', pais: 'España',
      telefono: '', email: '', web: '', iban: '', banco: '', nota_pie: '',
      logo_url: 'https://onesevenia.com/lovable-uploads/20e6c263-0631-43ca-acf0-a255777708ba.png',
      ...config,
    })
  }

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleGuardar = async () => {
    setSaving(true)
    await guardar(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!form) return <div style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text0)' }}>Datos de mi empresa</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
            Aparecen en todos los PDFs — presupuestos, propuestas y contratos
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleGuardar}
          disabled={saving}
          style={{ gap: 6, minWidth: 140 }}
        >
          {saved ? <><CheckIcon /> Guardado</> : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Identificación</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0 16px' }}>
          <div className="form-group">
            <label className="form-label">Nombre de la empresa *</label>
            <input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="ONESEVEN IA S.L." />
          </div>
          <div className="form-group">
            <label className="form-label">CIF / NIF</label>
            <input className="form-input" value={form.cif} onChange={e => set('cif', e.target.value)} placeholder="B12345678" />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Dirección</div>
        <div className="form-group">
          <label className="form-label">Dirección</label>
          <input className="form-input" value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Calle Ejemplo 123, 1A" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '0 12px' }}>
          <div className="form-group">
            <label className="form-label">CP</label>
            <input className="form-input" value={form.cp} onChange={e => set('cp', e.target.value)} placeholder="28001" />
          </div>
          <div className="form-group">
            <label className="form-label">Ciudad</label>
            <input className="form-input" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder="Madrid" />
          </div>
          <div className="form-group">
            <label className="form-label">País</label>
            <input className="form-input" value={form.pais} onChange={e => set('pais', e.target.value)} placeholder="España" />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Contacto</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input className="form-input" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+34 600 000 000" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="pablo@onesevenia.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Web</label>
            <input className="form-input" value={form.web} onChange={e => set('web', e.target.value)} placeholder="onesevenia.com" />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Datos bancarios</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0 12px' }}>
          <div className="form-group">
            <label className="form-label">IBAN</label>
            <input className="form-input" value={form.iban} onChange={e => set('iban', e.target.value)} placeholder="ES00 0000 0000 0000 0000 0000" />
          </div>
          <div className="form-group">
            <label className="form-label">Banco</label>
            <input className="form-input" value={form.banco} onChange={e => set('banco', e.target.value)} placeholder="BBVA, Santander..." />
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>PDFs</div>
        <div className="form-group">
          <label className="form-label">URL del logo <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>(se muestra en los PDFs)</span></label>
          <input className="form-input" value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Nota al pie de los PDFs <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>(opcional)</span></label>
          <input className="form-input" value={form.nota_pie} onChange={e => set('nota_pie', e.target.value)} placeholder="Ej: Sujeto a retención de IRPF del 15%" />
        </div>
      </div>

      {saved && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--green)' }}>
          <CheckIcon /> Datos guardados — se reflejarán en todos los documentos generados
        </div>
      )}
    </div>
  )
}

// ─── Modal desarrollador ──────────────────────────────────────────────────────
function ModalDesarrollador({ dev, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', especialidad: 'Full Stack',
    nif: '', iban: '', banco: '', notas: '', activo: true,
    ...dev,
  })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.nombre?.trim()) return alert('El nombre es obligatorio')
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 540, border: '1px solid var(--border)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg1)', zIndex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text0)' }}>
            {dev?.id ? 'Editar desarrollador' : 'Nuevo desarrollador'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}><CloseIcon /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">Nombre completo *</label>
              <input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre del desarrollador" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Especialidad</label>
              <select className="form-select" value={form.especialidad} onChange={e => set('especialidad', e.target.value)}>
                {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="dev@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input className="form-input" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+34 600..." />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">NIF / CIF</label>
            <input className="form-input" value={form.nif} onChange={e => set('nif', e.target.value)} placeholder="12345678A" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">IBAN</label>
              <input className="form-input" value={form.iban} onChange={e => set('iban', e.target.value)} placeholder="ES00 0000 0000 0000 0000 0000" />
            </div>
            <div className="form-group">
              <label className="form-label">Banco</label>
              <input className="form-input" value={form.banco} onChange={e => set('banco', e.target.value)} placeholder="BBVA..." />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notas <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>(opcional)</span></label>
            <textarea className="form-textarea" value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Especialidades, tarifas habituales, referencias..." style={{ minHeight: 70 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="dev-activo" checked={form.activo} onChange={e => set('activo', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
            <label htmlFor="dev-activo" style={{ fontSize: 13, color: 'var(--text1)', cursor: 'pointer' }}>Disponible para nuevos proyectos</label>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : dev?.id ? 'Guardar cambios' : 'Añadir desarrollador'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sección desarrolladores ──────────────────────────────────────────────────
function SeccionDesarrolladores() {
  const { desarrolladores, crear, actualizar, eliminar } = useDesarrolladores()
  const [modal, setModal] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleSave = async (form) => {
    if (form.id) await actualizar(form.id, form)
    else await crear(form)
    setModal(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text0)' }}>Perfiles de desarrolladores</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
            Guarda los datos una vez y selecciónalos al crear subcontrataciones
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})} style={{ gap: 6 }}>
          <PlusIcon /> Añadir desarrollador
        </button>
      </div>

      {desarrolladores.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-text">Añade tu primer desarrollador de confianza</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {desarrolladores.map(d => (
            <div key={d.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Avatar */}
              <div style={{ width: 42, height: 42, borderRadius: 12, background: d.activo ? 'rgba(99,102,241,0.15)' : 'var(--bg4)', color: d.activo ? 'var(--accent2)' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                {d.nombre[0].toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)' }}>{d.nombre}</span>
                  {d.especialidad && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(99,102,241,0.1)', color: 'var(--accent2)' }}>
                      {d.especialidad}
                    </span>
                  )}
                  {!d.activo && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--bg4)', color: 'var(--text3)' }}>
                      No disponible
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
                  {d.email && <span>{d.email}</span>}
                  {d.telefono && <span>{d.telefono}</span>}
                  {d.nif && <span>NIF: {d.nif}</span>}
                  {d.iban && <span style={{ color: 'var(--green)' }}>IBAN: {d.iban.slice(0, 10)}...</span>}
                </div>
                {d.notas && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, fontStyle: 'italic' }}>{d.notas}</div>
                )}
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--text2)' }} onClick={() => setModal(d)} title="Editar">
                  <EditIcon />
                </button>
                <button className="btn-icon" style={{ width: 32, height: 32, color: 'var(--red)' }} onClick={() => setConfirmDelete(d)} title="Eliminar">
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <ModalDesarrollador dev={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: '24px', maxWidth: 360, width: '100%', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text0)', marginBottom: 8 }}>Eliminar a {confirmDelete.nombre}?</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>El perfil se eliminará pero las subcontrataciones existentes no se verán afectadas.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn" style={{ background: 'var(--red)', color: '#fff', border: 'none' }} onClick={async () => { await eliminar(confirmDelete.id); setConfirmDelete(null) }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Configuracion() {
  const [tab, setTab] = useState('empresa')

  const tabs = [
    { id: 'empresa', label: 'Mi empresa', icon: '🏢' },
    { id: 'desarrolladores', label: 'Desarrolladores', icon: '👨‍💻' },
  ]

  return (
    <Layout title="Configuración" subtitle="Datos de empresa y perfiles de colaboradores">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--accent2)' : 'var(--text2)',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.15s',
            }}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 760 }}>
        {tab === 'empresa' && <SeccionEmpresa />}
        {tab === 'desarrolladores' && <SeccionDesarrolladores />}
      </div>
    </Layout>
  )
}
