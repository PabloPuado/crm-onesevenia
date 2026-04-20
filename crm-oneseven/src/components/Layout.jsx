import { useState } from 'react'
import Sidebar from './Sidebar'

function MenuIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="6" x2="17" y2="6"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="14" x2="17" y2="14"/></svg>
}

export default function Layout({ children, title, subtitle, actions }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <header className="page-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <MenuIcon />
          </button>
          <div>
            <div className="page-title">{title}</div>
            {subtitle && <div className="page-subtitle">{subtitle}</div>}
          </div>
          {actions && <div className="header-actions">{actions}</div>}
        </header>
        <div className="page-body">
          {children}
        </div>
      </main>
    </div>
  )
}
