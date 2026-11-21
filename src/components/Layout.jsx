import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <div className="app-shell">
      <div className="bg-gear bg-gear--tl" aria-hidden="true">⚙</div>
      <div className="bg-gear bg-gear--br" aria-hidden="true">⚙</div>
      <Header />
      <main className="page">
        <Outlet />
      </main>
      <footer className="site-footer">
        <span>⚙ Biblioteca de Jogos Steampunk</span>
        <span>Todos precisam fazer login · Comentários e perfis públicos virão em versões futuras</span>
      </footer>
    </div>
  )
}
