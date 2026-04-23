import { useState } from 'react'
import { STAGES, SERVICIOS, ORIGENES, whatsappUrl } from '../lib/constants'

function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
}

export default function ClienteModal({ cliente, onClose, onSave }) {
  const isEdit = !!(cliente?.id)
  const [form, setForm] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    etapa: 'lead',
    valor_deal: '',
    responsable: 'pablo',
    origen: '',
    servicios: [],
    notas: '',
    proximo_paso: '',
    fecha_proximo_paso: '',
    cif: '',
    ...cliente,
  })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const toggleServicio = (s) => {
    const arr = form.servicios || []
    set('servicios', arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s])
  }

  const handleSubmit = async () => {
    if (!form.nombre?.trim()) return alert('El nombre es obligatorio')
    await onSave({
      ...form,
      valor_deal: form.valor_deal ? parseFloat(form.valor_deal) : null,
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Editar cliente' : 'Nuevo cliente'}</div>
          <button className="modal-close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre completo" />
          </div>
          <div className="form-group">
            <label className="form-label">Empresa</label>
            <input className="form-input" value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Empresa S.L." />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@ejemplo.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono (con prefijo)</label>
            <input className="form-input" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+34612345678" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="form-group">
            <label className="form-label">CIF / NIF <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>(opcional)</span></label>
            <input className="form-input" value={form.cif || ''} onChange={e => set('cif', e.target.value)} placeholder="B12345678 o 12345678A" />
          </div>
          <div className="form-group">
            <label className="form-label">Valor deal (€)</label>
            <input className="form-input" type="number" value={form.valor_deal} onChange={e => set('valor_deal', e.target.value)} placeholder="0" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
          <div className="form-group">
            <label className="form-label">Etapa</label>
            <select className="form-select" value={form.etapa} onChange={e => set('etapa', e.target.value)}>
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Responsable</label>
            <select className="form-select" value={form.responsable} onChange={e => set('responsable', e.target.value)}>
              <option value="pablo">Pablo</option>
              <option value="alberto">Alberto</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Origen del lead</label>
          <select className="form-select" value={form.origen} onChange={e => set('origen', e.target.value)}>
            <option value="">Seleccionar</option>
            {ORIGENES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Servicios</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {SERVICIOS.map(s => {
              const active = (form.servicios || []).includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleServicio(s)}
                  style={{
                    padding: '4px 10px', fontSize: 12, borderRadius: 20,
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border2)'}`,
                    background: active ? 'var(--accent-dim)' : 'none',
                    color: active ? 'var(--accent2)' : 'var(--text3)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notas</label>
          <textarea className="form-textarea" value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Información relevante sobre este cliente..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="form-group">
            <label className="form-label">Próximo paso</label>
            <input className="form-input" value={form.proximo_paso || ''} onChange={e => set('proximo_paso', e.target.value)} placeholder="Ej: Enviar propuesta, Llamar el martes..." />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha compromiso</label>
            <input className="form-input" type="date" value={form.fecha_proximo_paso || ''} onChange={e => set('fecha_proximo_paso', e.target.value)} />
          </div>
        </div>

        {form.telefono && (
          <div style={{ marginBottom: 20, padding: '12px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>Contactar</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a className="wa-btn" href={whatsappUrl(form.telefono)} target="_blank" rel="noopener noreferrer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Abrir WhatsApp
              </a>
              {form.email && (
                <a className="email-btn" href={`mailto:${form.email}`}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 3l6 5 6-5"/><rect x="1" y="2" width="12" height="10" rx="1"/></svg>
                  Enviar email
                </a>
              )}
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}
