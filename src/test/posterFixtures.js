import { vi } from 'vitest'

export const wikipediaParasite = {
  query: {
    pages: {
      11: {
        pageid: 11,
        title: 'Parasite (1982 film)',
        description: '1982 film by Charles Band',
        thumbnail: { source: 'https://upload.wikimedia.org/p1982.jpg?utm_source=x' },
        pageviews: { a: 10, b: 5 },
      },
      22: {
        pageid: 22,
        title: 'Parasite (2019 film)',
        description: '2019 South Korean film by Bong Joon Ho',
        thumbnail: { source: 'https://upload.wikimedia.org/p2019.png?utm_source=x' },
        pageviews: { a: 9000, b: null },
      },
      33: {
        pageid: 33,
        title: 'Parasitism',
        description: 'Relationship between species',
        thumbnail: { source: 'https://upload.wikimedia.org/tick.jpg' },
      },
      44: {
        pageid: 44,
        title: 'Parasite (band)',
        description: 'Band with a film tie-in logo',
        thumbnail: { source: 'https://upload.wikimedia.org/logo.svg/500px-logo.svg.png' },
      },
    },
  },
}

export const tvmazeParasite = [
  {
    score: 0.9,
    show: {
      id: 7,
      name: 'Parasyte',
      premiered: '2023-04-05',
      webChannel: { name: 'Netflix' },
      image: { medium: 'https://static.tvmaze.com/m.jpg', original: 'https://static.tvmaze.com/o.jpg' },
    },
  },
  { score: 0.5, show: { id: 8, name: 'No Image Show', image: null } },
]

const json = (body) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) })

// fetch stub answering Wikipedia and TVmaze with the given bodies.
export function stubPosterApis({
  wikipedia = { query: { pages: {} } },
  wikipediaShows = { query: { pages: {} } },
  tvmaze = [],
} = {}) {
  const fetchMock = vi.fn((url) => {
    if (String(url).includes('wikipedia.org')) {
      return json(String(url).includes('television') ? wikipediaShows : wikipedia)
    }
    if (String(url).includes('tvmaze.com')) return json(tvmaze)
    return Promise.reject(new Error(`unexpected ${url}`))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
