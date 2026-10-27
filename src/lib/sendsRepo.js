import { supabase } from './supabase'

// 128 random bits as 32 hex characters. Made on the device so the share
// sheet can open straight from the tap, before anything is saved.
export function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function friendLink(token) {
  return `${window.location.origin}/f/${token}`
}

export function sameName(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

// Must be called straight from a tap: phones refuse to open the share
// sheet or write the clipboard once an await has run first.
export async function deliverLink({ text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ text, url })
      return 'shared'
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`)
    return 'copied'
  } catch {
    return 'manual'
  }
}

export function fromPickRow(row) {
  return {
    id: row.id,
    title: row.title,
    poster: row.poster ?? '',
    rating: Number(row.rating),
    note: row.note ?? '',
    status: row.status,
    friendRating: row.friend_rating == null ? null : Number(row.friend_rating),
    friendLine: row.friend_line ?? '',
  }
}

export function fromSendRow(row) {
  return {
    id: row.id,
    friendName: row.friends?.name ?? '',
    status: row.status,
    friendRating: row.friend_rating == null ? null : Number(row.friend_rating),
    friendLine: row.friend_line ?? '',
    isNew: Boolean(row.responded_at) && !row.seen_at,
    sentAt: row.created_at,
  }
}

export function countByFilm(rows) {
  const counts = {}
  for (const { film_id: filmId } of rows) {
    counts[filmId] = (counts[filmId] ?? 0) + 1
  }
  return counts
}

export async function listFriends() {
  const { data, error } = await supabase
    .from('friends')
    .select('id, name, token')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function insertFriend({ name, token }) {
  const { data, error } = await supabase
    .from('friends')
    .insert({ name: name.trim(), token })
    .select('id, name, token')
    .single()
  if (error) throw error
  return data
}

// Sending a film again only updates the note; a friend's answer is kept.
export async function sendFilm({ friendId, filmId, note }) {
  const { error } = await supabase
    .from('sends')
    .upsert(
      { friend_id: friendId, film_id: filmId, note },
      { onConflict: 'friend_id,film_id' },
    )
  if (error) throw error
}

export async function listSendsForFilm(filmId) {
  const { data, error } = await supabase
    .from('sends')
    .select('id, status, friend_rating, friend_line, responded_at, seen_at, created_at, friends(name)')
    .eq('film_id', filmId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map(fromSendRow)
}

export async function listNewReplies() {
  const { data, error } = await supabase
    .from('sends')
    .select('film_id')
    .not('responded_at', 'is', null)
    .is('seen_at', null)
  if (error) throw error
  return countByFilm(data)
}

export async function markRepliesSeen(filmId) {
  const { error } = await supabase
    .from('sends')
    .update({ seen_at: new Date().toISOString() })
    .eq('film_id', filmId)
    .not('responded_at', 'is', null)
    .is('seen_at', null)
  if (error) throw error
}

export async function getFriendPage(token) {
  const { data, error } = await supabase.rpc('get_friend_page', { p_token: token })
  if (error) throw error
  if (!data) return null
  return { name: data.name, picks: data.picks.map(fromPickRow) }
}

export async function respondToSend(token, sendId, { status, rating, line }) {
  const { error } = await supabase.rpc('respond_to_send', {
    p_token: token,
    p_send_id: sendId,
    p_status: status,
    p_rating: rating,
    p_line: line,
  })
  if (error) throw error
}
