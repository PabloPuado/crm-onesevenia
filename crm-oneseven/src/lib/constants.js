export const STAGES = [
  { id: 'lead', label: 'Lead', color: '#6b7280', badgeClass: 'badge-lead' },
  { id: 'cualificado', label: 'Cualificado', color: '#3b82f6', badgeClass: 'badge-cualificado' },
  { id: 'propuesta', label: 'Propuesta', color: '#f59e0b', badgeClass: 'badge-propuesta' },
  { id: 'negociacion', label: 'Negociacion', color: '#a855f7', badgeClass: 'badge-negociacion' },
  { id: 'ganado', label: 'Cerrado ganado', color: '#10b981', badgeClass: 'badge-ganado' },
  { id: 'desarrollando', label: 'Desarrollando solucion', color: '#06b6d4', badgeClass: 'badge-desarrollando' },
  { id: 'terminado', label: '100% terminado', color: '#8b5cf6', badgeClass: 'badge-terminado' },
  { id: 'perdido', label: 'Cerrado perdido', color: '#ef4444', badgeClass: 'badge-perdido' },
  { id: 'activo', label: 'Cliente activo', color: '#34d399', badgeClass: 'badge-activo' },
]


export const ETAPAS_CONTABILIDAD = ['ganado', 'desarrollando', 'terminado', 'activo']


export const SERVICIOS = [
  'Web development',
  'Automatizaciones',
  'Agente IA',
  'Consultoria IA',
  'Retainer mensual',
  'SEO / Marketing',
  'Otro',
]


export const ORIGENES = [
  'Instagram',
  'Referido',
  'LinkedIn',
  'Web',
  'Llamada fria',
  'Email frio',
  'Evento',
  'Otro',
]


export const formatEur = (n) => {
// v3 - Propuestas generador PDF
