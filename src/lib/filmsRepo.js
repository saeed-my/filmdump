import { supabase } from './supabase'

export function toRow(film) {
  return {
    title: film.title,
    rating: film.rating,
    poster: film.poster,
    watched_date: film.watchedDate || null,
    notes: film.notes,
    recommended: film.recommended,
    recommend_note: film.recommendNote,
  }
}

export function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    rating: Number(row.rating),
    poster: row.poster ?? '',
    watchedDate: row.watched_date ?? null,
    notes: row.notes ?? '',
    recommended: Boolean(row.recommended),
    recommendNote: row.recommend_note ?? '',
  }
}

export async function listFilms() {
  const { data, error } = await supabase
    .from('films')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map(fromRow)
}

export async function insertFilm(film) {
  const { data, error } = await supabase
    .from('films')
    .insert(toRow(film))
    .select()
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updateFilmRow(id, film) {
  const { data, error } = await supabase
    .from('films')
    .update(toRow(film))
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function listRecommendations() {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .order('rating', { ascending: false })
  if (error) throw error
  return data.map((row) => fromRow({ ...row, recommended: true }))
}
