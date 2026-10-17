import { useCallback, useEffect, useRef, useState } from 'react'
import { films as seedFilms, retiredSeedPosters } from '../data/films'
import { usePosterBackfill } from './usePosterBackfill'
import { insertFilm, listFilms, updateFilmRow } from '../lib/filmsRepo'
import { normalizeFilm, getFilms, saveFilms } from '../lib/storage'
import { isCloud } from '../lib/supabase'

const SAVE_ERROR = "Couldn't save — try again"

export function useFilms(userId) {
  const [films, setFilms] = useState(() =>
    isCloud ? [] : getFilms(seedFilms, retiredSeedPosters),
  )
  const [loading, setLoading] = useState(isCloud)
  const [saveError, setSaveError] = useState(null)

  // Latest films for async work that outlives a render (poster backfill).
  const filmsRef = useRef(films)
  useEffect(() => {
    filmsRef.current = films
  })

  // Quietly attaches a found poster, unless one was set in the meantime.
  const applyPoster = useCallback(async (id, poster) => {
    const film = filmsRef.current.find((item) => item.id === id)
    if (!film || film.poster) return

    if (isCloud) {
      try {
        const saved = await updateFilmRow(id, { ...film, poster })
        setFilms((current) =>
          current.map((item) => (item.id === id ? saved : item)),
        )
      } catch {
        // best effort: it is retried next session
      }
      return
    }

    const next = filmsRef.current.map((item) =>
      item.id === id ? { ...item, poster } : item,
    )
    filmsRef.current = next
    try {
      saveFilms(next)
      setFilms(next)
    } catch {
      // storage full or blocked; the poster just isn't kept
    }
  }, [])

  usePosterBackfill(films, applyPoster)

  useEffect(() => {
    if (!isCloud || !userId) return
    let cancelled = false
    listFilms()
      .then((rows) => {
        if (cancelled) return
        setFilms(rows)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setSaveError("Couldn't load your films — check your connection")
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const persist = useCallback((next) => {
    try {
      saveFilms(next)
      setFilms(next)
      setSaveError(null)
      return true
    } catch {
      setSaveError(SAVE_ERROR)
      return false
    }
  }, [])

  const addFilm = useCallback(
    async (film) => {
      if (isCloud) {
        try {
          const saved = await insertFilm(normalizeFilm(film))
          setFilms((current) => [...current, saved])
          setSaveError(null)
          return saved.id
        } catch {
          setSaveError(SAVE_ERROR)
          return null
        }
      }
      const id = Date.now()
      const next = [...films, { ...normalizeFilm(film), id }]
      return persist(next) ? id : null
    },
    [films, persist],
  )

  const updateFilm = useCallback(
    async (id, updates) => {
      const existing = films.find((film) => film.id === id)
      if (!existing) return false
      const merged = { ...normalizeFilm({ ...existing, ...updates }), id }

      if (isCloud) {
        try {
          const saved = await updateFilmRow(id, merged)
          setFilms((current) =>
            current.map((film) => (film.id === id ? saved : film)),
          )
          setSaveError(null)
          return true
        } catch {
          setSaveError(SAVE_ERROR)
          return false
        }
      }
      return persist(films.map((film) => (film.id === id ? merged : film)))
    },
    [films, persist],
  )

  const getFilmById = useCallback(
    (id) => films.find((film) => film.id === id),
    [films],
  )

  const clearSaveError = useCallback(() => setSaveError(null), [])

  return {
    films,
    loading,
    saveError,
    clearSaveError,
    addFilm,
    updateFilm,
    getFilmById,
  }
}
