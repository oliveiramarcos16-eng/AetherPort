import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Notice from '../components/Notice'
import GearLoader from '../components/GearLoader'

export default function Login() {
  const { session, loading, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/biblioteca'

  const [tab, setTab] = useState('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (loading) return <GearLoader label="Abrindo a biblioteca..." />
  if (session) return <Navigate to={from} replace />

  function switchTab(next) {
    setTab(next)
    setErro('')
    setAviso('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')
    setAviso('')
    setEnviando(true)

    try {
      if (tab === 'entrar') {
        await signIn(email.trim(), senha)
        navigate(from, { replace: true })
      } else {
        if (nome.trim().length < 2) {
          throw new Error('Informe seu nome (pelo menos 2 letras).')
        }
        if (senha.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.')
        }
        const { needsConfirmation } = await signUp(nome.trim(), email.trim(), senha)
        if (needsConfirmation) {
          setAviso(
            'Cadastro criado! Confirme o e-mail que enviamos para poder entrar.',
          )
          setTab('entrar')
        } else {
          navigate(from, { replace: true })
        }
      }
    } catch (error) {
      setErro(error.message || 'Algo deu errado. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="bg-gear bg-gear--tl" aria-hidden="true">⚙</div>
      <div className="bg-gear bg-gear--br" aria-hidden="true">⚙</div>

      <div className="auth-card panel">
        <div className="auth-card__brand">
          <span className="auth-card__gear" aria-hidden="true">⚙</span>
          <h1>Biblioteca de Jogos</h1>
          <p className="eyebrow">engrenagens · descobertas · jogos</p>
        </div>

        <div className="tabs" role="tablist" aria-label="Entrar ou criar conta">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'entrar'}
            className={`tabs__btn ${tab === 'entrar' ? 'is-active' : ''}`}
            onClick={() => switchTab('entrar')}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'cadastrar'}
            className={`tabs__btn ${tab === 'cadastrar' ? 'is-active' : ''}`}
            onClick={() => switchTab('cadastrar')}
          >
            Criar conta
          </button>
        </div>

        {erro && (
          <Notice tone="danger" title="Acesso negado">
            {erro} <em>Tente novamente.</em>
          </Notice>
        )}
        {aviso && (
          <Notice tone="ok" title="Quase lá">
            {aviso}
          </Notice>
        )}

        <form onSubmit={handleSubmit} className="form">
          {tab === 'cadastrar' && (
            <label className="field">
              <span>Nome</span>
              <input
                type="text"
                autoComplete="name"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Como devemos te chamar?"
                required
              />
            </label>
          )}

          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@exemplo.com"
              required
            />
          </label>

          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              autoComplete={tab === 'entrar' ? 'current-password' : 'new-password'}
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </label>

          <button type="submit" className="btn btn--primary btn--block" disabled={enviando}>
            {enviando
              ? 'Girando as engrenagens...'
              : tab === 'entrar'
                ? 'Entrar na biblioteca'
                : 'Criar minha conta'}
          </button>
        </form>

        <p className="auth-card__footer">
          {tab === 'entrar' ? (
            <>
              Ainda não tem conta?{' '}
              <button type="button" className="link" onClick={() => switchTab('cadastrar')}>
                Crie uma agora
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button type="button" className="link" onClick={() => switchTab('entrar')}>
                Entre por aqui
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
