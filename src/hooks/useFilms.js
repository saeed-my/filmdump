import { useCallback, useState } from 'react'
import { films as seedFilms } from '../data/films'
import { normalizeFilm, getFilms, saveFilms } from '../lib/storage'

export function useFilms() {
  const [films, setFilms] = useState(() => getFilms(seedFilms))
  const [saveError, setSaveError] = useState(null)

  const persist = useCallback((next) => {
    try {
      saveFilms(next)
      setFilms(next)
      setSaveError(null)
      return true
    } catch {
      setSaveError("Couldn't save — try again")
      return false
    }
  }, [])

  const addFilm = useCallback(
    (film) => {
      const id = Date.now()
      const next = [...films, { ...normalizeFilm(film), id }]
      return persist(next) ? id : null
    },
    [films, persist],
  )

  const updateFilm = useCallback(
    (id, updates) => {
      const next = films.map((film) =>
        film.id === id
          ? { ...normalizeFilm({ ...film, ...updates }), id }
          : film,
      )
      return persist(next)
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
    saveError,
    clearSaveError,
    addFilm,
    updateFilm,
    getFilmById,
  }
}
