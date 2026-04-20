import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/', label: 'Dashboard', icon: GridIcon },
  { path: '/pipeline', label: 'Pipeline', icon: PipelineIcon },
  { path: '/contactos', label: 'Contactos', icon: PeopleIcon },
  { path: '/tareas', label: 'Tareas', icon: TaskIcon },
  { path: '/ingresos', label: 'Ingresos', icon: EuroIcon },
  { path: '/documentos', label: 'Documentos', icon: DocIcon },
  { path: '/objetivos', label: 'Objetivos', icon: TargetIcon },
]

function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="nav-icon"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
}
function PipelineIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="nav-icon"><rect x="1" y="4" width="3" height="8" rx="1"/><rect x="6" y="2" width="3" height="10" rx="1"/><rect x="11" y="5" width="3" height="7" rx="1"/></svg>
}
function PeopleIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="nav-icon"><circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5"/><circle cx="12" cy="5" r="2"/><path d="M14 13c0-1.66-1.34-3-3-3"/></svg>
}
function TaskIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="nav-icon"><path d="M6 3h8M6 8h8M6 13h5"/><circle cx="3" cy="3" r="1"/><circle cx="3" cy="8" r="1"/><circle cx="3" cy="13" r="1"/></svg>
}
function EuroIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="nav-icon"><path d="M12 4.5A5 5 0 1 0 12 11.5M2 7h7M2 9h7"/></svg>
}
function DocIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="nav-icon"><path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 2z"/><path d="M9 2v4h4"/><path d="M5 9h6M5 11h4"/></svg>
}
function TargetIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="nav-icon"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="3"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>
}
function LogOutIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3"/><path d="M10 11l4-3-4-3"/><line x1="14" y1="8" x2="6" y2="8"/></svg>
}

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut, getUserName } = useAuth()

  const userName = getUserName()
  const displayName = userName === 'pablo' ? 'Pablo' : 'Alberto'
  const avatarColor = userName === 'pablo' ? '#6366f1' : '#10b981'
  const initial = displayName[0]

  const handleNav = (path) => {
    navigate(path)
    onClose?.()
  }

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">ONESEVEN IA</div>
          <div className="sidebar-logo-sub">CRM · Pipeline</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navegación</div>
          {navItems.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              className={`nav-item ${location.pathname === path ? 'active' : ''}`}
              onClick={() => handleNav(path)}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar" style={{ background: avatarColor + '22', color: avatarColor }}>
            {initial}
          </div>
          <div>
            <div className="user-name">{displayName}</div>
            <div className="user-email" style={{ fontSize: 10, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
          <button className="logout-btn" onClick={signOut} title="Cerrar sesión">
            <LogOutIcon />
          </button>
        </div>
      </aside>
    </>
  )
}
