import { describe, expect, it } from 'vitest'
import {
  filterFilms,
  formatWatchedDate,
  getTopRatedId,
  validateFilmFields,
} from './filmUtils'

const films = [
  { id: 1, title: 'The Godfather', rating: 9.2 },
  { id: 2, title: 'Parasite', rating: 8.5 },
  { id: 3, title: 'Past Lives', rating: 8.0 },
]

describe('validateFilmFields', () => {
  it('requires a title and a rating', () => {
    const { errors } = validateFilmFields({ title: '  ', rating: '' })
    expect(errors.title).toBe('Title is required.')
    expect(errors.rating).toBe('Rating is required.')
  })

  it('rejects ratings outside 0 to 10', () => {
    expect(validateFilmFields({ title: 'A', rating: '11' }).errors.rating).toBe(
      'Rating must be between 0 and 10.',
    )
    expect(validateFilmFields({ title: 'A', rating: '-1' }).errors.rating).toBe(
      'Rating must be between 0 and 10.',
    )
  })

  it('rejects a poster that is not a URL', () => {
    const { errors } = validateFilmFields({
      title: 'A',
      rating: '7',
      poster: 'not a url',
    })
    expect(errors.poster).toBe('Enter a valid poster URL.')
  })

  it('normalizes valid input', () => {
    const { errors, values } = validateFilmFields({
      title: '  Arrival ',
      rating: '7.94',
      poster: ' https://example.com/a.jpg ',
      watchedDate: '',
      notes: ' great ',
    })
    expect(errors).toEqual({})
    expect(values).toEqual({
      title: 'Arrival',
      rating: 7.9,
      poster: 'https://example.com/a.jpg',
      watchedDate: null,
      notes: 'great',
    })
  })
})

describe('filterFilms', () => {
  it('returns everything for a blank query', () => {
    expect(filterFilms(films, '   ')).toBe(films)
  })

  it('matches titles case-insensitively', () => {
    expect(filterFilms(films, 'PA').map((film) => film.id)).toEqual([2, 3])
  })
})

describe('getTopRatedId', () => {
  it('returns the highest rated film', () => {
    expect(getTopRatedId(films)).toBe(1)
  })

  it('returns null for an empty list', () => {
    expect(getTopRatedId([])).toBeNull()
  })
})

describe('formatWatchedDate', () => {
  it('formats an ISO date', () => {
    expect(formatWatchedDate('2026-03-09')).toBe('Mar 9, 2026')
  })

  it('falls back to a dash for missing or invalid dates', () => {
    expect(formatWatchedDate(null)).toBe('—')
    expect(formatWatchedDate('nope')).toBe('—')
  })
})
