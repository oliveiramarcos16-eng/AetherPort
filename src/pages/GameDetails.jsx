import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import GearLoader from '../components/GearLoader'
import Notice from '../components/Notice'
import Stars from '../components/Stars'
import StatusBadge from '../components/StatusBadge'

export default function GameDetails() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()

  const [jogo, setJogo] = useState(null)
  const [minhaNota, setMinhaNota] = useState(0)
  const [favorito, setFavorito] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [salvandoNota, setSalvandoNota] = useState(false)
  const [salvandoFavorito, setSalvandoFavorito] = useState(false)

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('games_com_media')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      setErro(error.message)
      setCarregando(false)
      return
    }

    setJogo(data)

    if (data) {
      const [notaResult, favResult] = await Promise.all([
        supabase
          .from('ratings')
          .select('nota')
          .eq('game_id', id)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('favorites')
          .select('game_id')
          .eq('game_id', id)
          .eq('user_id', user.id)
          .maybeSingle(),
      ])
      setMinhaNota(notaResult.data?.nota || 0)
      setFavorito(Boolean(favResult.data))
    }

    setCarregando(false)
  }, [id, user.id])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function avaliar(nota) {
    setSalvandoNota(true)
    setErro('')
    const { error } = await supabase
      .from('ratings')
      .upsert(
        { game_id: id, user_id: user.id, nota },
        { onConflict: 'game_id,user_id' },
      )

    if (error) setErro(error.message)
    else await carregar()
    setSalvandoNota(false)
  }

  async function alternarFavorito() {
    setSalvandoFavorito(true)
    setErro('')

    if (favorito) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('game_id', id)
        .eq('user_id', user.id)
      if (error) setErro(error.message)
      else setFavorito(false)
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ game_id: id, user_id: user.id })
      if (error) setErro(error.message)
      else setFavorito(true)
    }

    setSalvandoFavorito(false)
  }

  function jogar() {
    if (!jogo?.link) return
    window.open(jogo.link, '_blank', 'noopener,noreferrer')
  }

  if (carregando) return <GearLoader label="Abrindo o jogo..." />

  if (!jogo) {
    return (
      <div className="stack">
        <Notice tone="danger" title="Jogo não encontrado">
          Este jogo não existe ou ainda não foi publicado.
        </Notice>
        <Link to="/biblioteca" className="btn btn--ghost">
          ← Voltar para a biblioteca
        </Link>
      </div>
    )
  }

  const publico = jogo.status === 'publicado'
  const eAutor = jogo.autor_id === user.id
  const media = Number(jogo.media) || 0
  const total = Number(jogo.total_avaliacoes) || 0

  return (
    <div className="stack">
      <Link to="/biblioteca" className="back-link">
        ← Voltar para a biblioteca
      </Link>

      {erro && (
        <Notice tone="danger" title="Ops">
          {erro}
        </Notice>
      )}

      {!publico && (
        <Notice tone={eAutor || isAdmin ? 'wait' : 'danger'} title="Este jogo ainda não está publicado">
          Ele está na fase de moderação e só pode ser visto pelo autor e pela
          administração.
          {eAutor && (
            <>
              {' '}
              <Link to="/meus-envios" className="link">
                Acompanhar meus envios
              </Link>
            </>
          )}
        </Notice>
      )}

      <article className="game-detail panel">
        <div className="game-detail__cover">
          {jogo.capa_url ? (
            <img src={jogo.capa_url} alt={`Capa de ${jogo.titulo}`} />
          ) : (
            <div className="game-detail__cover-fallback" aria-hidden="true">
              <span>⚙</span>
              <strong>{jogo.titulo?.slice(0, 1)?.toUpperCase()}</strong>
            </div>
          )}
        </div>

        <div className="game-detail__info">
          <div className="game-detail__top">
            <span className="tag">{jogo.categoria}</span>
            {!publico && <StatusBadge status={jogo.status} />}
          </div>

          <h1>{jogo.titulo}</h1>

          <div className="game-detail__rating">
            <Stars value={media} size="lg" />
            <span className="muted">
              {total > 0
                ? `${media.toFixed(1)} de 5 · ${total} ${total === 1 ? 'avaliação' : 'avaliações'}`
                : 'Ainda sem avaliações'}
            </span>
          </div>

          <p className="game-detail__desc">
            {jogo.descricao || 'Este jogo ainda não tem descrição.'}
          </p>

          <div className="game-detail__actions">
            <button type="button" className="btn btn--primary" onClick={jogar}>
              ▶ Jogar em nova aba
            </button>
            <button
              type="button"
              className={`btn btn--ghost ${favorito ? 'is-on' : ''}`}
              onClick={alternarFavorito}
              disabled={salvandoFavorito}
              aria-pressed={favorito}
            >
              {favorito ? '♥ Nos favoritos' : '♡ Favoritar'}
            </button>
          </div>

          <div className="rating-box">
            <span className="rating-box__label">
              Sua avaliação {salvandoNota && '· salvando...'}
            </span>
            <Stars value={minhaNota} size="lg" onRate={avaliar} />
            <span className="muted">
              {minhaNota > 0
                ? 'Você pode mudar sua nota quando quiser.'
                : 'Clique nas estrelas para avaliar de 1 a 5.'}
            </span>
          </div>

          <p className="muted game-detail__date">
            Enviado em {formatDate(jogo.criado_em)}
            {jogo.publicado_em ? ` · publicado em ${formatDate(jogo.publicado_em)}` : ''}
          </p>
        </div>
      </article>
    </div>
  )
}
