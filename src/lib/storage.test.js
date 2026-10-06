import { describe, expect, it, vi } from 'vitest'
import { getFilms, normalizeFilm, saveFilms } from './storage'

const seed = [{ id: 1, title: ' Seed ', rating: '8.5', poster: '' }]

describe('normalizeFilm', () => {
  it('fills defaults and coerces the rating', () => {
    expect(normalizeFilm({ id: 3, title: ' Heat ', rating: '8.2' })).toEqual({
      id: 3,
      title: 'Heat',
      rating: 8.2,
      poster: '',
      watchedDate: null,
      notes: '',
    })
  })
})

describe('getFilms', () => {
  it('seeds storage on first run', () => {
    const films = getFilms(seed)
    expect(films).toHaveLength(1)
    expect(films[0].title).toBe('Seed')
    expect(JSON.parse(localStorage.getItem('filmdump:films'))).toEqual(films)
  })

  it('returns saved films instead of the seed', () => {
    saveFilms([{ id: 9, title: 'Saved', rating: 6, poster: '', notes: '' }])
    expect(getFilms(seed).map((film) => film.id)).toEqual([9])
  })

  it('falls back to the seed when stored data is corrupt', () => {
    localStorage.setItem('filmdump:films', '{not json')
    expect(getFilms(seed)[0].title).toBe('Seed')
  })

  it('falls back to the seed when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(getFilms(seed)[0].title).toBe('Seed')
    spy.mockRestore()
  })
})
