export function getTopRatedId(films) {
  if (!films.length) return null
  return films.reduce(
    (best, film) => (film.rating > best.rating ? film : best),
    films[0],
  ).id
}

export function formatWatchedDate(isoDate) {
  if (!isoDate) return '—'
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function todayIso() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function validateFilmFields({
  title,
  rating,
  poster,
  watchedDate,
  notes,
  recommended,
  recommendNote,
}) {
  const errors = {}
  const trimmedTitle = title?.trim() ?? ''

  if (!trimmedTitle) {
    errors.title = 'Title is required.'
  }

  const ratingNum = parseFloat(rating)
  if (rating === '' || rating === null || rating === undefined || Number.isNaN(ratingNum)) {
    errors.rating = 'Rating is required.'
  } else if (ratingNum < 0 || ratingNum > 10) {
    errors.rating = 'Rating must be between 0 and 10.'
  }

  if (watchedDate) {
    const date = new Date(`${watchedDate}T12:00:00`)
    if (Number.isNaN(date.getTime())) {
      errors.watchedDate = 'Enter a valid date.'
    }
  }

  if (poster?.trim()) {
    try {
      new URL(poster.trim())
    } catch {
      errors.poster = 'Enter a valid poster URL.'
    }
  }

  return {
    errors,
    values: {
      title: trimmedTitle,
      rating: Number.isNaN(ratingNum) ? 0 : Math.round(ratingNum * 10) / 10,
      poster: poster?.trim() ?? '',
      watchedDate: watchedDate || null,
      notes: notes?.trim() ?? '',
      recommended: Boolean(recommended),
      recommendNote: recommended ? (recommendNote?.trim() ?? '') : '',
    },
  }
}

// Highest rating first; ties keep their existing order.
export function sortByRating(films) {
  return [...films].sort((a, b) => b.rating - a.rating)
}

export function getRecommended(films) {
  return sortByRating(films.filter((film) => film.recommended))
}

export function filterFilms(films, query) {
  const q = query.trim().toLowerCase()
  if (!q) return films
  return films.filter((film) => film.title.toLowerCase().includes(q))
}
