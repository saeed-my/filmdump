import { describe, expect, it } from 'vitest'
import {
  filterFilms,
  formatWatchedDate,
  getRecommended,
  getTopRatedId,
  sortByRating,
  validateFilmFields,
  validateReply,
  validateSendFields,
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
      recommended: false,
      recommendNote: '',
    })
  })

  it('keeps the recommendation note only when recommended', () => {
    const base = { title: 'A', rating: '7', recommendNote: ' watch it ' }
    expect(
      validateFilmFields({ ...base, recommended: true }).values,
    ).toMatchObject({ recommended: true, recommendNote: 'watch it' })
    expect(
      validateFilmFields({ ...base, recommended: false }).values,
    ).toMatchObject({ recommended: false, recommendNote: '' })
  })
})

describe('getRecommended', () => {
  it('returns only recommended films, best first', () => {
    const list = [
      { id: 1, rating: 7, recommended: true },
      { id: 2, rating: 9, recommended: false },
      { id: 3, rating: 8.5, recommended: true },
    ]
    expect(getRecommended(list).map((film) => film.id)).toEqual([3, 1])
  })
})

describe('validateSendFields', () => {
  it('needs a name and trims what it keeps', () => {
    expect(validateSendFields({ name: '  ', note: '' }).errors.name).toBe(
      'Who is it for?',
    )
    expect(validateSendFields({ name: ' Amina ', note: ' go ' })).toEqual({
      errors: {},
      values: { name: 'Amina', note: 'go' },
    })
  })

  it('caps the name and the note', () => {
    const { errors } = validateSendFields({
      name: 'a'.repeat(61),
      note: 'b'.repeat(281),
    })
    expect(errors.name).toBe('Keep the name under 60 characters.')
    expect(errors.note).toBe('Keep the note under 280 characters.')
  })
})

describe('validateReply', () => {
  it('needs a score for Watched it', () => {
    const { errors } = validateReply({ status: 'watched', rating: '', line: '' })
    expect(errors.rating).toBe('Give it a score.')
  })

  it('accepts Seen it before with or without a score', () => {
    expect(
      validateReply({ status: 'seen', rating: '', line: '' }).values.rating,
    ).toBeNull()
    expect(
      validateReply({ status: 'seen', rating: '7.94', line: '' }).values.rating,
    ).toBe(7.9)
  })

  it('never keeps a score for Not for me', () => {
    const { errors, values } = validateReply({
      status: 'pass',
      rating: '9',
      line: ' nah ',
    })
    expect(errors).toEqual({})
    expect(values).toEqual({ status: 'pass', rating: null, line: 'nah' })
  })

  it('rejects scores outside 0 to 10 and long lines', () => {
    const { errors } = validateReply({
      status: 'watched',
      rating: '11',
      line: 'x'.repeat(281),
    })
    expect(errors.rating).toBe('Score must be between 0 and 10.')
    expect(errors.line).toBe('Keep it under 280 characters.')
  })
})

describe('sortByRating', () => {
  it('orders films from highest to lowest rating', () => {
    const list = [
      { id: 1, rating: 7.4 },
      { id: 2, rating: 9.2 },
      { id: 3, rating: 8.1 },
    ]
    expect(sortByRating(list).map((film) => film.id)).toEqual([2, 3, 1])
  })

  it('keeps the existing order for tied ratings', () => {
    const list = [
      { id: 1, rating: 8 },
      { id: 2, rating: 9 },
      { id: 3, rating: 8 },
    ]
    expect(sortByRating(list).map((film) => film.id)).toEqual([2, 1, 3])
  })

  it('does not mutate the input', () => {
    const list = [
      { id: 1, rating: 7 },
      { id: 2, rating: 9 },
    ]
    sortByRating(list)
    expect(list.map((film) => film.id)).toEqual([1, 2])
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
