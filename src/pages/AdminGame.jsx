import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/constants'
import GearLoader from '../components/GearLoader'
import Notice from '../components/Notice'
import StatusBadge from '../components/StatusBadge'

export default function AdminGame() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [jogo, setJogo] = useState(null)
  const [autor, setAutor] = useState('')
  const [motivo, setMotivo] = useState('')
  const [modoRecusa, setModoRecusa] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

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

    if (data?.autor_id) {
      const { data: perfil } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', data.autor_id)
        .maybeSingle()
      setAutor(perfil?.nome || '')
    }

    setCarregando(false)
  }, [id])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function atualizar(patch, mensagem) {
    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('games').update(patch).eq('id', id)
    if (error) {
      setErro(error.message)
      setSalvando(false)
      return
    }
    navigate('/admin', { replace: true, state: { mensagem } })
  }

  function aprovar() {
    atualizar(
      { status: 'aguardando_capa', motivo_recusa: null },
      'Jogo aprovado! O aluno foi avisado para adicionar a capa.',
    )
  }

  function publicar() {
    atualizar(
      { status: 'publicado', publicado_em: new Date().toISOString() },
      'Jogo publicado na biblioteca!',
    )
  }

  function recusar(event) {
    event.preventDefault()
    if (motivo.trim().length < 10) {
      setErro('Descreva o motivo da recusa com pelo menos 10 caracteres.')
      return
    }
    atualizar(
      { status: 'recusado', motivo_recusa: motivo.trim() },
      'Jogo recusado. O aluno recebeu a crítica para corrigir.',
    )
  }

  if (carregando) return <GearLoader label="Analisando o envio..." />

  if (!jogo) {
    return (
      <div className="stack">
        <Notice tone="danger" title="Envio não encontrado">
          Este jogo não existe ou foi removido.
        </Notice>
        <Link to="/admin" className="btn btn--ghost">
          ← Voltar ao painel
        </Link>
      </div>
    )
  }

  return (
    <div className="stack">
      <Link to="/admin" className="back-link">
        ← Voltar ao painel
      </Link>

      {erro && (
        <Notice tone="danger" title="Atenção">
          {erro}
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
            <StatusBadge status={jogo.status} />
          </div>

          <h1>{jogo.titulo}</h1>
          <p className="muted">
            Enviado por {autor || 'aluno'} em {formatDate(jogo.criado_em)}
          </p>

          <p className="game-detail__desc">
            {jogo.descricao || 'Sem descrição.'}
          </p>

          <div className="checklist">
            <strong>Verificação</strong>
            <span>1. Abra o link e confira se o jogo funciona.</span>
            <span>2. Verifique se o conteúdo é apropriado.</span>
            <span>3. Só então aprove ou recuse com um motivo.</span>
          </div>

          <a
            href={jogo.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--ghost"
          >
            ↗ Abrir o link do jogo
          </a>

          {jogo.motivo_recusa && (
            <Notice tone="danger" title="Motivo da recusa registrado">
              {jogo.motivo_recusa}
            </Notice>
          )}

          {jogo.status === 'pendente' && !modoRecusa && (
            <div className="form__actions">
              <button type="button" className="btn btn--danger" onClick={() => setModoRecusa(true)}>
                Recusar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={aprovar}
                disabled={salvando}
              >
                {salvando ? 'Aprovando...' : 'Aprovar envio'}
              </button>
            </div>
          )}

          {jogo.status === 'pendente' && modoRecusa && (
            <form className="form" onSubmit={recusar}>
              <label className="field">
                <span>Motivo da recusa *</span>
                <textarea
                  rows={4}
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Explique o que precisa ser corrigido..."
                  required
                />
              </label>
              <div className="form__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setModoRecusa(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--danger" disabled={salvando}>
                  {salvando ? 'Recusando...' : 'Confirmar recusa'}
                </button>
              </div>
            </form>
          )}

          {jogo.status === 'capa_recebida' && (
            <div className="form__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setModoRecusa(true)}>
                Recusar capa
              </button>
              <button
                type="button"
                className="btn btn--admin"
                onClick={publicar}
                disabled={salvando}
              >
                {salvando ? 'Publicando...' : 'Publicar na biblioteca'}
              </button>
            </div>
          )}

          {jogo.status === 'capa_recebida' && modoRecusa && (
            <form className="form" onSubmit={recusar}>
              <label className="field">
                <span>Motivo da recusa *</span>
                <textarea
                  rows={3}
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Explique o que precisa ser corrigido na capa..."
                  required
                />
              </label>
              <div className="form__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setModoRecusa(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--danger" disabled={salvando}>
                  Confirmar recusa
                </button>
              </div>
            </form>
          )}
        </div>
      </article>
    </div>
  )
}
