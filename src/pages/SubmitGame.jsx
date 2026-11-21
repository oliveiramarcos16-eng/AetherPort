import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CATEGORIAS, isHttpUrl } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import Notice from '../components/Notice'

export default function SubmitGame() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [titulo, setTitulo] = useState('')
  const [link, setLink] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')

    if (titulo.trim().length < 3) {
      setErro('O título precisa de pelo menos 3 caracteres.')
      return
    }
    if (!isHttpUrl(link.trim())) {
      setErro('Informe um link válido começando com http:// ou https://.')
      return
    }
    if (descricao.trim().length < 10) {
      setErro('Escreva uma descrição com pelo menos 10 caracteres.')
      return
    }

    setEnviando(true)
    const { error } = await supabase.from('games').insert({
      titulo: titulo.trim(),
      link: link.trim(),
      categoria,
      descricao: descricao.trim(),
      autor_id: user.id,
      status: 'pendente',
    })

    if (error) {
      setErro(error.message)
      setEnviando(false)
      return
    }

    navigate('/meus-envios', { state: { enviado: true } })
  }

  return (
    <div className="stack stack--narrow">
      <div className="page-head">
        <div>
          <p className="eyebrow">Etapa 1 de 2</p>
          <h1>Enviar um jogo</h1>
          <p className="muted">
            Preencha os dados abaixo. O jogo entra na fila de análise e só aparece
            na biblioteca depois da aprovação — depois disso você poderá adicionar a capa.
          </p>
        </div>
      </div>

      {erro && (
        <Notice tone="danger" title="Dados incompletos">
          {erro}
        </Notice>
      )}

      <form className="panel form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Título do jogo *</span>
          <input
            type="text"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Ex.: A Engrenagem Perdida"
            maxLength={80}
            required
          />
        </label>

        <label className="field">
          <span>Link do jogo *</span>
          <input
            type="url"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://..."
            required
          />
          <small className="field__hint">
            O jogo abrirá em uma nova aba para o jogador.
          </small>
        </label>

        <label className="field">
          <span>Categoria *</span>
          <select value={categoria} onChange={(event) => setCategoria(event.target.value)}>
            {CATEGORIAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Descrição *</span>
          <textarea
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            rows={5}
            maxLength={600}
            placeholder="Conte em poucas linhas do que se trata o jogo..."
            required
          />
          <small className="field__hint">{descricao.length}/600 caracteres</small>
        </label>

        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={enviando}>
            {enviando ? 'Enviando para análise...' : 'Enviar para análise'}
          </button>
        </div>
      </form>
    </div>
  )
}
