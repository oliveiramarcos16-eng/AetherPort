import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/constants'
import GearLoader from '../components/GearLoader'
import Notice from '../components/Notice'
import StatusBadge from '../components/StatusBadge'

export default function Admin() {
  const location = useLocation()
  const [mensagem] = useState(location.state?.mensagem || '')
  const [pendentes, setPendentes] = useState([])
  const [capas, setCapas] = useState([])
  const [autores, setAutores] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    const [jogosResult, perfisResult] = await Promise.all([
      supabase
        .from('games_com_media')
        .select('*')
        .in('status', ['pendente', 'capa_recebida'])
        .order('criado_em', { ascending: true }),
      supabase.from('profiles').select('id, nome'),
    ])

    if (jogosResult.error) {
      setErro(jogosResult.error.message)
    } else {
      const todos = jogosResult.data || []
      setPendentes(todos.filter((jogo) => jogo.status === 'pendente'))
      setCapas(todos.filter((jogo) => jogo.status === 'capa_recebida'))
    }

    if (!perfisResult.error) {
      const mapa = {}
      for (const perfil of perfisResult.data || []) mapa[perfil.id] = perfil.nome
      setAutores(mapa)
    }

    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  if (carregando) return <GearLoader label="Abrindo o painel administrativo..." />

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="eyebrow">Sala de máquinas</p>
          <h1>Painel administrativo</h1>
          <p className="muted">
            Analise os envios, aprove ou recuse com um motivo, e publique os jogos
            que já receberam capa.
          </p>
        </div>
        <div className="stat-row">
          <div className="stat">
            <strong>{pendentes.length}</strong>
            <span>aguardando análise</span>
          </div>
          <div className="stat">
            <strong>{capas.length}</strong>
            <span>prontos para publicar</span>
          </div>
        </div>
      </div>

      {mensagem && (
        <Notice tone="ok" title="Feito">
          {mensagem}
        </Notice>
      )}

      {erro && (
        <Notice tone="danger" title="Erro">
          {erro}
        </Notice>
      )}

      <section className="panel">
        <h2 className="section-title">Aguardando análise</h2>
        {pendentes.length === 0 ? (
          <p className="muted">Nenhum envio pendente. Tudo em ordem! ⚙</p>
        ) : (
          <div className="admin-list">
            {pendentes.map((jogo) => (
              <AdminRow key={jogo.id} jogo={jogo} autor={autores[jogo.autor_id]} />
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2 className="section-title">Capas recebidas — prontos para publicar</h2>
        {capas.length === 0 ? (
          <p className="muted">Nenhum jogo aguardando publicação.</p>
        ) : (
          <div className="admin-list">
            {capas.map((jogo) => (
              <AdminRow key={jogo.id} jogo={jogo} autor={autores[jogo.autor_id]} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function AdminRow({ jogo, autor }) {
  return (
    <Link to={`/admin/jogo/${jogo.id}`} className="admin-row">
      <div className="admin-row__thumb">
        {jogo.capa_url ? (
          <img src={jogo.capa_url} alt="" />
        ) : (
          <span aria-hidden="true">⚙</span>
        )}
      </div>
      <div className="admin-row__info">
        <strong>{jogo.titulo}</strong>
        <span className="muted">
          {jogo.categoria} · {autor || 'aluno'} · {formatDate(jogo.criado_em)}
        </span>
      </div>
      <StatusBadge status={jogo.status} />
      <span className="admin-row__cta">analisar →</span>
    </Link>
  )
}
