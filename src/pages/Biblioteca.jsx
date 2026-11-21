import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CATEGORIAS } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import GameCard from '../components/GameCard'
import GearLoader from '../components/GearLoader'
import Notice from '../components/Notice'

export default function Biblioteca() {
  const { user, isAdmin } = useAuth()
  const [jogos, setJogos] = useState([])
  const [favoritos, setFavoritos] = useState(new Set())
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [somenteFavoritos, setSomenteFavoritos] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregar() {
      setCarregando(true)
      setErro('')

      const [jogosResult, favResult] = await Promise.all([
        supabase
          .from('games_com_media')
          .select('*')
          .eq('status', 'publicado')
          .order('publicado_em', { ascending: false }),
        supabase.from('favorites').select('game_id').eq('user_id', user.id),
      ])

      if (!ativo) return

      if (jogosResult.error) setErro(jogosResult.error.message)
      else setJogos(jogosResult.data || [])

      if (!favResult.error) {
        setFavoritos(new Set((favResult.data || []).map((fav) => fav.game_id)))
      }

      setCarregando(false)
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [user.id])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return jogos.filter((jogo) => {
      if (categoria !== 'todas' && jogo.categoria !== categoria) return false
      if (somenteFavoritos && !favoritos.has(jogo.id)) return false
      if (!termo) return true
      return (
        jogo.titulo?.toLowerCase().includes(termo) ||
        jogo.descricao?.toLowerCase().includes(termo) ||
        jogo.categoria?.toLowerCase().includes(termo)
      )
    })
  }, [jogos, busca, categoria, somenteFavoritos, favoritos])

  return (
    <div className="stack">
      <section className="hero-panel panel">
        <div>
          <p className="eyebrow">Acervo a vapor</p>
          <h1>Biblioteca de Jogos</h1>
          <p className="muted">
            Descubra jogos enviados pela comunidade, favorite os favoritos e avalie
            de 1 a 5 estrelas. Todos os jogos são abertos em uma nova aba.
          </p>
        </div>
        <div className="hero-panel__actions">
          {isAdmin ? (
            <Link to="/admin" className="btn btn--admin">
              Painel administrativo
            </Link>
          ) : (
            <Link to="/enviar" className="btn btn--primary">
              + Enviar jogo
            </Link>
          )}
        </div>
      </section>

      <section className="filters panel">
        <label className="field field--search">
          <span>Pesquisar</span>
          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Título, categoria ou descrição..."
          />
        </label>

        <label className="field">
          <span>Categoria</span>
          <select value={categoria} onChange={(event) => setCategoria(event.target.value)}>
            <option value="todas">Todas</option>
            {CATEGORIAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={`chip ${somenteFavoritos ? 'is-on' : ''}`}
          aria-pressed={somenteFavoritos}
          onClick={() => setSomenteFavoritos((valor) => !valor)}
        >
          ♥ Só favoritos
        </button>

        <span className="filters__count">
          {filtrados.length} {filtrados.length === 1 ? 'jogo' : 'jogos'}
        </span>
      </section>

      {erro && (
        <Notice tone="danger" title="Não foi possível carregar a biblioteca">
          {erro}
        </Notice>
      )}

      {carregando ? (
        <GearLoader label="Lubrificando o acervo..." />
      ) : filtrados.length === 0 ? (
        <div className="empty panel">
          <span className="empty__gear" aria-hidden="true">⚙</span>
          <h2>Nenhum jogo por aqui ainda</h2>
          <p className="muted">
            {jogos.length === 0
              ? 'Assim que um jogo for aprovado, ele aparece nesta prateleira.'
              : 'Nenhum jogo corresponde aos filtros escolhidos.'}
          </p>
          {!isAdmin && jogos.length === 0 && (
            <Link to="/enviar" className="btn btn--primary">
              Seja o primeiro a enviar
            </Link>
          )}
        </div>
      ) : (
        <div className="games-grid">
          {filtrados.map((jogo) => (
            <GameCard key={jogo.id} game={jogo} />
          ))}
        </div>
      )}
    </div>
  )
}
