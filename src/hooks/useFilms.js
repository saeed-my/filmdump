import { useCallback, useEffect, useState } from 'react'
import { films as seedFilms } from '../data/films'
import { insertFilm, listFilms, updateFilmRow } from '../lib/filmsRepo'
import { normalizeFilm, getFilms, saveFilms } from '../lib/storage'
import { isCloud } from '../lib/supabase'

const SAVE_ERROR = "Couldn't save — try again"

export function useFilms(userId) {
  const [films, setFilms] = useState(() =>
    isCloud ? [] : getFilms(seedFilms),
  )
  const [loading, setLoading] = useState(isCloud)
  const [saveError, setSaveError] = useState(null)

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
