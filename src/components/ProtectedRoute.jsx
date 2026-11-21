import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GearLoader from './GearLoader'

export function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <GearLoader label="Verificando credenciais..." />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export function AdminRoute({ children }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading || (session && !profile)) {
    return <GearLoader label="Consultando o painel..." />
  }
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (profile?.role !== 'admin') return <Navigate to="/biblioteca" replace />
  return children
}
