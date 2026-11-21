import { Navigate, Route, Routes, Link } from 'react-router-dom'
import { isConfigured } from './lib/supabase'
import SetupNotice from './components/SetupNotice'
import Layout from './components/Layout'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Biblioteca from './pages/Biblioteca'
import GameDetails from './pages/GameDetails'
import SubmitGame from './pages/SubmitGame'
import MySubmissions from './pages/MySubmissions'
import Admin from './pages/Admin'
import AdminGame from './pages/AdminGame'

export default function App() {
  if (!isConfigured) return <SetupNotice />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/biblioteca" element={<Biblioteca />} />
        <Route path="/jogo/:id" element={<GameDetails />} />
        <Route path="/enviar" element={<SubmitGame />} />
        <Route path="/meus-envios" element={<MySubmissions />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/jogo/:id"
          element={
            <AdminRoute>
              <AdminGame />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/biblioteca" replace />} />
      <Route
        path="*"
        element={
          <div className="stack stack--narrow">
            <h1>Página não encontrada</h1>
            <p className="muted">A engrenagem girou para o lado errado.</p>
            <Link to="/biblioteca" className="btn btn--primary">
              Voltar para a biblioteca
            </Link>
          </div>
        }
      />
    </Routes>
  )
}
