import { describe, expect, it, vi } from 'vitest'
import {
  cleanFilmTitle,
  clearLookupCache,
  cleanShowTitle,
  findPoster,
  lookupTitle,
  parseShowViews,
  parseTvmaze,
  parseWikipedia,
  searchTitles,
} from './posterSearch'
import {
  stubPosterApis,
  tvmazeParasite,
  wikipediaParasite,
} from '../test/posterFixtures'

describe('cleanFilmTitle', () => {
  it('drops the disambiguation suffix', () => {
    expect(cleanFilmTitle('Parasite (2019 film)')).toBe('Parasite')
    expect(cleanFilmTitle('Past Lives (film)')).toBe('Past Lives')
    expect(cleanFilmTitle('Dune: Part Two')).toBe('Dune: Part Two')
  })
})

describe('parseWikipedia', () => {
  it('keeps films with a poster, most viewed first, without tracking params', () => {
    const films = parseWikipedia(wikipediaParasite)
    expect(films.map((film) => film.subtitle)).toEqual([
      '2019 South Korean film by Bong Joon Ho',
      '1982 film by Charles Band',
    ])
    expect(films[0]).toMatchObject({
      title: 'Parasite',
      kind: 'film',
      poster: 'https://upload.wikimedia.org/p2019.png',
    })
  })

  it('returns nothing for an empty response', () => {
    expect(parseWikipedia({})).toEqual([])
  })
})

describe('parseTvmaze', () => {
  it('keeps shows with artwork and describes them', () => {
    expect(parseTvmaze(tvmazeParasite)).toEqual([
      {
        id: 'tvmaze-7',
        kind: 'show',
        title: 'Parasyte',
        subtitle: 'TV series · 2023 · Netflix',
        poster: 'https://static.tvmaze.com/o.jpg',
        views: 0,
      },
    ])
  })

  it('carries over Wikipedia views for the matching series', () => {
    const views = new Map([['parasyte', 1200]])
    expect(parseTvmaze(tvmazeParasite, views)[0].views).toBe(1200)
  })
})

describe('parseShowViews', () => {
  it('sums views for TV series pages only, keyed by clean title', () => {
    const views = parseShowViews({
      query: {
        pages: {
          1: {
            title: 'The Bear (TV series)',
            description: 'American comedy-drama television series',
            pageviews: { a: 500, b: 700 },
          },
          2: {
            title: 'The Bear (1988 film)',
            description: '1988 film by Jean-Jacques Annaud',
            pageviews: { a: 90 },
          },
        },
      },
    })
    expect([...views]).toEqual([['the bear', 1200]])
  })

  it('cleans the series suffix', () => {
    expect(cleanShowTitle('Fargo (American TV series)')).toBe('Fargo')
    expect(cleanShowTitle('Shōgun (2024 miniseries)')).toBe('Shōgun')
  })

  it('returns nothing for an unexpected response', () => {
    expect(parseTvmaze({ error: true })).toEqual([])
  })
})

describe('searchTitles', () => {
  it('skips the network for one-letter queries', async () => {
    const fetchMock = stubPosterApis()
    expect(await searchTitles('p')).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('merges films and shows, exact title matches first', async () => {
    stubPosterApis({ wikipedia: wikipediaParasite, tvmaze: tvmazeParasite })
    const results = await searchTitles('parasyte')
    expect(results.map((item) => item.title)).toEqual([
      'Parasyte',
      'Parasite',
      'Parasite',
    ])
  })

  it('breaks a film/show tie in favour of the more-viewed one', async () => {
    const bearFilm = {
      query: {
        pages: {
          5: {
            pageid: 5,
            title: 'The Bear (1988 film)',
            description: '1988 film by Jean-Jacques Annaud',
            thumbnail: { source: 'https://upload.wikimedia.org/bear-film.jpg' },
            pageviews: { a: 3000 },
          },
        },
      },
    }
    const bearShow = [
      { show: { id: 9, name: 'The Bear', image: { original: 'https://static.tvmaze.com/bear.jpg' } } },
    ]
    const showPages = (views) => ({
      query: {
        pages: {
          6: {
            title: 'The Bear (TV series)',
            description: 'American television series',
            pageviews: { a: views },
          },
        },
      },
    })

    stubPosterApis({ wikipedia: bearFilm, wikipediaShows: showPages(90000), tvmaze: bearShow })
    expect(await findPoster('The Bear')).toBe('https://static.tvmaze.com/bear.jpg')

    clearLookupCache()
    stubPosterApis({ wikipedia: bearFilm, wikipediaShows: showPages(100), tvmaze: bearShow })
    expect(await findPoster('The Bear')).toBe('https://upload.wikimedia.org/bear-film.jpg')
  })

  it('still returns shows when Wikipedia is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) =>
        String(url).includes('wikipedia')
          ? Promise.resolve({ ok: false, status: 503 })
          : Promise.resolve({ ok: true, json: () => Promise.resolve(tvmazeParasite) }),
      ),
    )
    const results = await searchTitles('parasyte')
    expect(results.map((item) => item.kind)).toEqual(['show'])
  })
})

describe('findPoster', () => {
  it('picks the best match', async () => {
    stubPosterApis({ wikipedia: wikipediaParasite, tvmaze: tvmazeParasite })
    expect(await findPoster('Parasite')).toBe('https://upload.wikimedia.org/p2019.png')
  })

  it('returns an empty string when nothing is found', async () => {
    stubPosterApis()
    expect(await findPoster('zzzz')).toBe('')
  })

  it('returns null when offline, so it is tried again later', async () => {
    expect(await findPoster('Parasite')).toBeNull()
  })

  it('refuses to guess when Wikipedia fails but a show matches', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) =>
        String(url).includes('wikipedia')
          ? Promise.resolve({ ok: false, status: 429 })
          : Promise.resolve({ ok: true, json: () => Promise.resolve(tvmazeParasite) }),
      ),
    )
    expect(await findPoster('Parasyte')).toBeNull()
  })

  it('treats accented and plain spellings as the same title', async () => {
    stubPosterApis({
      tvmaze: [{ show: { id: 3, name: 'Shōgun', image: { original: 'https://static.tvmaze.com/s.jpg' } } }],
    })
    const [best] = await searchTitles('shogun')
    expect(best.title).toBe('Shōgun')
  })
})

describe('lookupTitle', () => {
  it('only asks for TV popularity when a film and a show share the name', async () => {
    const fetchMock = stubPosterApis({ wikipedia: wikipediaParasite, tvmaze: tvmazeParasite })
    await lookupTitle('Parasite')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('television'))).toBe(false)
  })

  it('caches complete lookups but not failed ones', async () => {
    const fetchMock = stubPosterApis({ wikipedia: wikipediaParasite })
    await lookupTitle('Parasite')
    await lookupTitle(' parasite ')
    expect(fetchMock).toHaveBeenCalledTimes(2)

    clearLookupCache()
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    expect((await lookupTitle('Parasite')).complete).toBe(false)
    await lookupTitle('Parasite')
    expect(fetch).toHaveBeenCalledTimes(4)
  })
})
