import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { profile, isAdmin, signOut } = useAuth()

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/biblioteca" className="brand">
          <span className="brand__gear" aria-hidden="true">⚙</span>
          <span className="brand__text">
            Biblioteca de Jogos
            <small>steampunk</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Navegação principal">
          <NavLink to="/biblioteca">Biblioteca</NavLink>
          {!isAdmin && <NavLink to="/enviar">Enviar jogo</NavLink>}
          {!isAdmin && <NavLink to="/meus-envios">Meus envios</NavLink>}
          {isAdmin && <NavLink to="/admin">Painel</NavLink>}
        </nav>

        <div className="site-header__user">
          <span className="site-header__who">
            <span className="site-header__avatar" aria-hidden="true">
              {profile?.nome?.slice(0, 1)?.toUpperCase() || '?'}
            </span>
            <span>
              {profile?.nome || 'Usuário'}
              <small>{isAdmin ? 'Administrador' : 'Aluno'}</small>
            </span>
          </span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={signOut}>
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
