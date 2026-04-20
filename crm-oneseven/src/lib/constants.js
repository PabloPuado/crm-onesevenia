export const STAGES = [
  { id: 'lead', label: 'Lead', color: '#6b7280', badgeClass: 'badge-lead' },
  { id: 'cualificado', label: 'Cualificado', color: '#3b82f6', badgeClass: 'badge-cualificado' },
  { id: 'propuesta', label: 'Propuesta', color: '#f59e0b', badgeClass: 'badge-propuesta' },
  { id: 'negociacion', label: 'Negociación', color: '#a855f7', badgeClass: 'badge-negociacion' },
  { id: 'ganado', label: 'Cerrado ganado', color: '#10b981', badgeClass: 'badge-ganado' },
  { id: 'perdido', label: 'Cerrado perdido', color: '#ef4444', badgeClass: 'badge-perdido' },
  { id: 'activo', label: 'Cliente activo', color: '#34d399', badgeClass: 'badge-activo' },
]

export const SERVICIOS = [
  'Web development',
  'Automatizaciones',
  'Agente IA',
  'Consultoría IA',
  'Retainer mensual',
  'SEO / Marketing',
  'Otro',
]

export const ORIGENES = [
  'Instagram',
  'Referido',
  'LinkedIn',
  'Web',
  'Llamada fría',
  'Email frío',
  'Evento',
  'Otro',
]

export const formatEur = (n) => {
  if (!n && n !== 0) return '—'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const getStage = (id) => STAGES.find(s => s.id === id) || STAGES[0]

export const whatsappUrl = (phone, text = '') => {
  const clean = phone?.replace(/\D/g, '') || ''
  const encoded = encodeURIComponent(text)
  return `https://wa.me/${clean}${text ? '?text=' + encoded : ''}`
}

export const OBJETIVO_ANUAL = 100000
