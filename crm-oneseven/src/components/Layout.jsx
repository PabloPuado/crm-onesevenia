import { useState } from 'react'
import Sidebar from './Sidebar'
import { useClientes } from '../hooks/useData'
import { useActividad } from '../hooks/useData'
import { useAuth } from '../context/AuthContext'

function MenuIcon() { return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="6" x2="17" y2="6"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="14" x2="17" y2="14"/></svg> }
function PlusIcon() { return <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="11" y1="4" x2="11" y2="18"/><line x1="4" y1="11" x2="18" y2="11"/></svg> }
function CloseIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="14" y2="14"/><line x1="14" y1="4" x2="4" y2="14"/></svg> }

const TIPOS_RAPIDOS = [
  { id: 'nota', label: 'Nota', color: '#6b7280' },
  { id: 'llamada', label: 'Llamada', color: '#3b82f6' },
  { id: 'reunion', label: 'Reunión', color: '#8b5cf6' },
  { id: 'email', label: 'Email', color: '#6366f1' },
  { id: 'propuesta', label: 'Propuesta', color: '#f59e0b' },
]

function NotaRapidaModal({ onClose }) {
  const { clientes } = useClientes()
  const { crear } = useActividad()
  const { getUserName } = useAuth()
  const [form, setForm] = useState({ cliente_id: '', tipo: 'nota', titulo: '', descripcion: '', responsable: getUserName() || 'pablo' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleGuardar = async () => {
    if (!form.cliente_id || !form.titulo?.trim()) return
    setSaving(true)
    await crear({ ...form, fecha: new Date().toISOString() })
    setSaved(true)
    setTimeout(() => onClose(), 800)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 16px 0' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg1)', borderRadius: '20px 20px 16px 16px', width: '100%', maxWidth: 520, padding: '20px 20px 24px', border: '1px solid var(--border)', animation: 'slideUp 0.2s ease-out' }}>
        {saved ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--green)' }}>Nota guardada</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text0)' }}>Nota rápida</div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}><CloseIcon /></button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {TIPOS_RAPIDOS.map(t => (
                <button key={t.id} onClick={() => set('tipo', t.id)} style={{ flex: 1, padding: '6px 4px', borderRadius: 10, fontSize: 11, fontWeight: form.tipo===t.id?600:400, cursor: 'pointer', border: `1px solid ${form.tipo===t.id?t.color:'var(--border2)'}`, background: form.tipo===t.id?t.color+'20':'none', color: form.tipo===t.id?t.color:'var(--text3)', transition: 'all 0.15s' }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Cliente *</label>
              <select className="form-select" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}>
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.empresa?' · '+c.empresa:''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">¿Qué pasó? *</label>
              <input className="form-input" value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ej: Llamada con Rosa, interesada en agente IA..." onKeyDown={e => e.key==='Enter'&&!e.shiftKey&&handleGuardar()} style={{ fontSize: 15 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Detalle (opcional)</label>
              <textarea className="form-textarea" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Más contexto..." style={{ minHeight: 64, fontSize: 14 }} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, borderRadius: 12 }} onClick={handleGuardar} disabled={saving||!form.cliente_id||!form.titulo?.trim()}>
              {saving?'Guardando...':'Guardar nota'}
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}

export default function Layout({ children, title, subtitle, actions }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <header className="page-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><MenuIcon /></button>
          <div>
            <div className="page-title">{title}</div>
            {subtitle&&<div className="page-subtitle">{subtitle}</div>}
          </div>
          {actions&&<div className="header-actions">{actions}</div>}
        </header>
        <div className="page-body">{children}</div>
      </main>
      <button onClick={() => setFabOpen(true)} title="Nota rápida" style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 1000, width: 52, height: 52, borderRadius: '50%', background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(99,102,241,0.45)', transition: 'transform 0.15s, box-shadow 0.15s' }} onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.1)';e.currentTarget.style.boxShadow='0 6px 28px rgba(99,102,241,0.55)'}} onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 4px 20px rgba(99,102,241,0.45)'}}>
        <PlusIcon />
      </button>
      {fabOpen&&<NotaRapidaModal onClose={() => setFabOpen(false)} />}
    </div>
  )
}
