import { Link } from 'react-router-dom'
import Stars from './Stars'

export default function GameCard({ game }) {
  const media = Number(game.media) || 0
  const total = Number(game.total_avaliacoes) || 0

  return (
    <Link to={`/jogo/${game.id}`} className="game-card">
      <div className="game-card__cover">
        {game.capa_url ? (
          <img src={game.capa_url} alt={`Capa de ${game.titulo}`} loading="lazy" />
        ) : (
          <div className="game-card__cover-fallback" aria-hidden="true">
            <span>⚙</span>
            <strong>{game.titulo?.slice(0, 1)?.toUpperCase()}</strong>
          </div>
        )}
        {game.categoria && (
          <span className="game-card__category">{game.categoria}</span>
        )}
      </div>

      <div className="game-card__body">
        <h3 className="game-card__title">{game.titulo}</h3>
        <div className="game-card__rating">
          <Stars value={media} size="sm" />
          <span className="game-card__rating-text">
            {total > 0 ? `${media.toFixed(1)} (${total})` : 'Sem avaliações'}
          </span>
        </div>
      </div>

      <span className="game-card__rivet game-card__rivet--tl" aria-hidden="true" />
      <span className="game-card__rivet game-card__rivet--tr" aria-hidden="true" />
      <span className="game-card__rivet game-card__rivet--bl" aria-hidden="true" />
      <span className="game-card__rivet game-card__rivet--br" aria-hidden="true" />
    </Link>
  )
}
