import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const looksReal = (value) =>
  typeof value === 'string' &&
  value.length > 10 &&
  !value.includes('SEU-PROJETO') &&
  !value.includes('SUA-ANON-KEY')

export const isConfigured = looksReal(url) && looksReal(anonKey)

export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/**
 * Envia o arquivo de capa para o bucket público "capas".
 * O caminho começa com o id do usuário para respeitar as políticas do Storage.
 */
export async function uploadCover(file, userId, gameId) {
  if (!supabase) throw new Error('Supabase não configurado.')
  if (!file) throw new Error('Selecione uma imagem.')

  const maxBytes = 4 * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error('A imagem deve ter no máximo 4 MB.')
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Envie um arquivo de imagem (PNG, JPG ou WEBP).')
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${userId}/${gameId}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('capas')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from('capas').getPublicUrl(path)
  return data.publicUrl
}
