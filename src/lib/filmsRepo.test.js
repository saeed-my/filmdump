import { describe, expect, it } from 'vitest'
import { fromRow, toRow } from './filmsRepo'
import { parseRoute } from './router'

describe('filmsRepo row mapping', () => {
  it('maps a film to database columns', () => {
    expect(
      toRow({
        id: 4,
        title: 'Heat',
        rating: 8.3,
        poster: '',
        watchedDate: '',
        notes: 'long',
        recommended: true,
        recommendNote: 'the diner scene',
      }),
    ).toEqual({
      title: 'Heat',
      rating: 8.3,
      poster: '',
      watched_date: null,
      notes: 'long',
      recommended: true,
      recommend_note: 'the diner scene',
    })
  })

  it('maps a database row to a film, coercing the numeric rating', () => {
    expect(
      fromRow({
        id: 4,
        title: 'Heat',
        rating: '8.3',
        poster: null,
        watched_date: '2026-01-02',
        notes: null,
        recommended: true,
        recommend_note: null,
      }),
    ).toEqual({
      id: 4,
      title: 'Heat',
      rating: 8.3,
      poster: '',
      watchedDate: '2026-01-02',
      notes: '',
      recommended: true,
      recommendNote: '',
    })
  })
})

describe('parseRoute', () => {
  it('recognises the recommendations and login pages', () => {
    expect(parseRoute('/recs')).toEqual({ view: 'recs' })
    expect(parseRoute('/recs/')).toEqual({ view: 'recs' })
    expect(parseRoute('/login')).toEqual({ view: 'login' })
  })

  it('still parses film detail ids', () => {
    expect(parseRoute('/films/12')).toEqual({ view: 'detail', id: 12 })
    expect(parseRoute('/nope')).toEqual({ view: 'not-found' })
  })

  it('recognises a friend link with a 32 character code', () => {
    const token = 'a'.repeat(32)
    expect(parseRoute(`/f/${token}`)).toEqual({ view: 'friend', token })
    expect(parseRoute(`/f/${token}/`)).toEqual({ view: 'friend', token })
  })

  it.each([
    '/f',
    '/f/',
    '/f/xyz',
    `/f/${'a'.repeat(31)}`,
    `/f/${'a'.repeat(33)}`,
    `/f/${'A'.repeat(32)}`,
    `/f/${'g'.repeat(32)}`,
    `/f/${'a'.repeat(32)}/extra`,
    `/films/${'a'.repeat(32)}`,
  ])('does not treat %s as a friend link', (path) => {
    expect(parseRoute(path).view).not.toBe('friend')
  })
})
