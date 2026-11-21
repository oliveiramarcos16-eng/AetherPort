export const CATEGORIAS = [
  'Ação',
  'Aventura',
  'Arcade',
  'Puzzle',
  'Estratégia',
  'RPG',
  'Corrida',
  'Esporte',
]

export const STATUS = {
  pendente: {
    label: 'Aguardando análise',
    tone: 'wait',
    icon: '⏳',
  },
  recusado: {
    label: 'Recusado',
    tone: 'danger',
    icon: '✖',
  },
  aguardando_capa: {
    label: 'Aprovado — envie a capa',
    tone: 'ok',
    icon: '🖼',
  },
  capa_recebida: {
    label: 'Capa enviada — aguardando publicação',
    tone: 'wait',
    icon: '📦',
  },
  publicado: {
    label: 'Publicado',
    tone: 'ok',
    icon: '★',
  },
}

export function formatDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export function isHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
