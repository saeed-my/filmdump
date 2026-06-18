const STORAGE_KEY = 'filmdump:films'

export function normalizeFilm(film) {
  return {
    id: film.id,
    title: film.title?.trim() ?? '',
    rating:
      typeof film.rating === 'number'
        ? film.rating
        : parseFloat(film.rating) || 0,
    poster: film.poster?.trim() ?? '',
    watchedDate: film.watchedDate || null,
    notes: film.notes ?? '',
  }
}

export function getFilms(seedFilms) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw).map(normalizeFilm)
    }
    const seeded = seedFilms.map(normalizeFilm)
    saveFilms(seeded)
    return seeded
  } catch {
    return seedFilms.map(normalizeFilm)
  }
}

export function saveFilms(films) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(films))
}
