import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase, uploadCover } from '../lib/supabase'
import { CATEGORIAS, formatDate, isHttpUrl } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import GearLoader from '../components/GearLoader'
import Notice from '../components/Notice'
import StatusBadge from '../components/StatusBadge'

export default function MySubmissions() {
  const { user } = useAuth()
  const location = useLocation()
  const [jogos, setJogos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState(
    location.state?.enviado
      ? 'Envio recebido! Agora é só aguardar a análise da administração.'
      : '',
  )

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('games_com_media')
      .select('*')
      .eq('autor_id', user.id)
      .order('criado_em', { ascending: false })

    if (error) setErro(error.message)
    else setJogos(data || [])
    setCarregando(false)
  }, [user.id])

  useEffect(() => {
    carregar()
  }, [carregar])

  if (carregando) return <GearLoader label="Consultando seus envios..." />

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="eyebrow">Suas máquinas</p>
          <h1>Meus envios</h1>
          <p className="muted">
            Acompanhe cada etapa: análise, correção, capa e publicação.
          </p>
        </div>
        <Link to="/enviar" className="btn btn--primary">
          + Enviar outro jogo
        </Link>
      </div>

      {mensagem && (
        <Notice tone="ok" title="Tudo certo">
          {mensagem}
        </Notice>
      )}
      {erro && (
        <Notice tone="danger" title="Erro">
          {erro}
        </Notice>
      )}

      {jogos.length === 0 ? (
        <div className="empty panel">
          <span className="empty__gear" aria-hidden="true">⚙</span>
          <h2>Você ainda não enviou nenhum jogo</h2>
          <p className="muted">Que tal apresentar sua criação à biblioteca?</p>
          <Link to="/enviar" className="btn btn--primary">
            Enviar meu primeiro jogo
          </Link>
        </div>
      ) : (
        <div className="submission-list">
          {jogos.map((jogo) => (
            <SubmissionCard
              key={jogo.id}
              jogo={jogo}
              userId={user.id}
              onChanged={carregar}
              onMessage={setMensagem}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SubmissionCard({ jogo, userId, onChanged, onMessage }) {
  const [editando, setEditando] = useState(false)
  const [titulo, setTitulo] = useState(jogo.titulo)
  const [link, setLink] = useState(jogo.link)
  const [categoria, setCategoria] = useState(jogo.categoria)
  const [descricao, setDescricao] = useState(jogo.descricao || '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [enviandoCapa, setEnviandoCapa] = useState(false)

  async function salvarCorrecao(event) {
    event.preventDefault()
    setErro('')

    if (titulo.trim().length < 3) return setErro('O título precisa de pelo menos 3 caracteres.')
    if (!isHttpUrl(link.trim())) return setErro('Informe um link válido (http/https).')
    if (descricao.trim().length < 10) return setErro('Descrição muito curta.')

    setSalvando(true)
    const { error } = await supabase
      .from('games')
      .update({
        titulo: titulo.trim(),
        link: link.trim(),
        categoria,
        descricao: descricao.trim(),
        status: 'pendente',
        motivo_recusa: null,
      })
      .eq('id', jogo.id)

    if (error) setErro(error.message)
    else {
      setEditando(false)
      onMessage('Envio corrigido! Ele voltou para a fila de análise.')
      await onChanged()
    }
    setSalvando(false)
  }

  async function enviarCapa(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setErro('')
    setEnviandoCapa(true)
    try {
      const publicUrl = await uploadCover(file, userId, jogo.id)
      const { error } = await supabase
        .from('games')
        .update({ capa_url: publicUrl, status: 'capa_recebida' })
        .eq('id', jogo.id)
      if (error) throw error

      onMessage('Capa enviada! Agora a administração fará a publicação.')
      await onChanged()
    } catch (error) {
      setErro(error.message)
    } finally {
      setEnviandoCapa(false)
      event.target.value = ''
    }
  }

  const podeCorrigir = jogo.status === 'recusado'
  const podeEnviarCapa = jogo.status === 'aguardando_capa'
  const publicado = jogo.status === 'publicado'

  return (
    <article className="submission panel">
      <div className="submission__main">
        <div className="submission__thumb">
          {jogo.capa_url ? (
            <img src={jogo.capa_url} alt={`Capa de ${jogo.titulo}`} />
          ) : (
            <span aria-hidden="true">⚙</span>
          )}
        </div>

        <div className="submission__info">
          <div className="submission__headline">
            <h2>{jogo.titulo}</h2>
            <StatusBadge status={jogo.status} />
          </div>
          <p className="muted">
            {jogo.categoria} · enviado em {formatDate(jogo.criado_em)}
            {jogo.publicado_em ? ` · publicado em ${formatDate(jogo.publicado_em)}` : ''}
          </p>

          {jogo.motivo_recusa && jogo.status === 'recusado' && (
            <Notice tone="danger" title="Motivo da recusa">
              {jogo.motivo_recusa}
            </Notice>
          )}

          {podeEnviarCapa && (
            <p className="muted">
              🖼 O jogo foi aprovado! Envie agora uma imagem de capa para a
              publicação.
            </p>
          )}

          {erro && <p className="form-error">{erro}</p>}

          <div className="submission__actions">
            {publicado && (
              <Link to={`/jogo/${jogo.id}`} className="btn btn--ghost btn--sm">
                Ver na biblioteca
              </Link>
            )}
            {!publicado && (
              <Link to={`/jogo/${jogo.id}`} className="btn btn--ghost btn--sm">
                Ver detalhes
              </Link>
            )}

            {podeCorrigir && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setEditando((valor) => !valor)}
              >
                {editando ? 'Fechar correção' : 'Corrigir e reenviar'}
              </button>
            )}

            {podeEnviarCapa && (
              <label className={`btn btn--admin btn--sm ${enviandoCapa ? 'is-disabled' : ''}`}>
                {enviandoCapa ? 'Enviando capa...' : 'Adicionar capa'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={enviarCapa}
                  disabled={enviandoCapa}
                  hidden
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {editando && podeCorrigir && (
        <form className="form submission__edit" onSubmit={salvarCorrecao}>
          <label className="field">
            <span>Título</span>
            <input value={titulo} onChange={(event) => setTitulo(event.target.value)} />
          </label>
          <label className="field">
            <span>Link</span>
            <input value={link} onChange={(event) => setLink(event.target.value)} />
          </label>
          <label className="field">
            <span>Categoria</span>
            <select value={categoria} onChange={(event) => setCategoria(event.target.value)}>
              {CATEGORIAS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Descrição</span>
            <textarea
              rows={4}
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
            />
          </label>
          <div className="form__actions">
            <button type="submit" className="btn btn--primary" disabled={salvando}>
              {salvando ? 'Reenviando...' : 'Reenviar para análise'}
            </button>
          </div>
        </form>
      )}
    </article>
  )
}
