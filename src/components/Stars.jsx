import { useState } from 'react'

/**
 * Exibe estrelas de avaliação. Se `onRate` for informado, vira um seletor.
 */
export default function Stars({ value = 0, onRate, size = 'md', showValue = false }) {
  const [hover, setHover] = useState(0)
  const interactive = typeof onRate === 'function'
  const active = interactive && hover > 0 ? hover : Math.round(Number(value) || 0)

  const className = `stars stars--${size} ${interactive ? 'stars--interactive' : ''}`

  if (!interactive) {
    return (
      <span className={className} aria-label={`Avaliação: ${Number(value).toFixed(1)} de 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`stars__star ${star <= active ? 'is-on' : ''}`}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
        {showValue && (
          <span className="stars__value">
            {Number(value) > 0 ? Number(value).toFixed(1) : '—'}
          </span>
        )}
      </span>
    )
  }

  return (
    <span
      className={className}
      onMouseLeave={() => setHover(0)}
      role="group"
      aria-label={`Avaliação atual: ${Number(value).toFixed(1)} de 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`stars__star ${star <= active ? 'is-on' : ''}`}
          onClick={() => onRate(star)}
          onMouseEnter={() => setHover(star)}
          aria-label={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
        >
          ★
        </button>
      ))}
      {showValue && (
        <span className="stars__value">
          {Number(value) > 0 ? Number(value).toFixed(1) : '—'}
        </span>
      )}
    </span>
  )
}
