import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import Contactos from './pages/Contactos'
import Tareas from './pages/Tareas'
import Ingresos from './pages/Ingresos'
import Documentos from './pages/Documentos'
import Objetivos from './pages/Objetivos'
import Contabilidad from './pages/Contabilidad'
import Timeline from './pages/Timeline'
import Metricas from './pages/Metricas'
import BusquedaGlobal from './pages/BusquedaGlobal'
import Propuestas from './pages/Propuestas'
import Presupuestos from './pages/Presupuestos'
import Gastos from './pages/Gastos'
import Subcontrataciones from './pages/Subcontrataciones'
import Configuracion from './pages/Configuracion'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg0)' }}>
      <div style={{ fontSize: 13, color: 'var(--text3)' }}>Cargando...</div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return null
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
      <Route path="/contactos" element={<ProtectedRoute><Contactos /></ProtectedRoute>} />
      <Route path="/tareas" element={<ProtectedRoute><Tareas /></ProtectedRoute>} />
      <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
      <Route path="/metricas" element={<ProtectedRoute><Metricas /></ProtectedRoute>} />
      <Route path="/busqueda" element={<ProtectedRoute><BusquedaGlobal /></ProtectedRoute>} />
      <Route path="/propuestas" element={<ProtectedRoute><Propuestas /></ProtectedRoute>} />
      <Route path="/presupuestos" element={<ProtectedRoute><Presupuestos /></ProtectedRoute>} />
      <Route path="/gastos" element={<ProtectedRoute><Gastos /></ProtectedRoute>} />
      <Route path="/subcontrataciones" element={<ProtectedRoute><Subcontrataciones /></ProtectedRoute>} />
      <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
      <Route path="/ingresos" element={<ProtectedRoute><Ingresos /></ProtectedRoute>} />
      <Route path="/documentos" element={<ProtectedRoute><Documentos /></ProtectedRoute>} />
      <Route path="/contabilidad" element={<ProtectedRoute><Contabilidad /></ProtectedRoute>} />
      <Route path="/objetivos" element={<ProtectedRoute><Objetivos /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  )
}
