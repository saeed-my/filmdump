// Poster lookup without API keys: Wikipedia for films (official poster, plus
// year and director to tell remakes apart), TVmaze for shows.

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php'
const TVMAZE_API = 'https://api.tvmaze.com/search/shows'

const MAX_FILMS = 4
const MAX_SHOWS = 3

const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // "Shōgun" matches "shogun"
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

// "Parasite (2019 film)" -> "Parasite", "Past Lives (film)" -> "Past Lives"
export function cleanFilmTitle(pageTitle) {
  return pageTitle.replace(/\s*\([^()]*\bfilm\)$/i, '').trim()
}

const sumViews = (pageviews) =>
  Object.values(pageviews ?? {}).reduce((total, count) => total + (count ?? 0), 0)

export function parseWikipedia(json) {
  const pages = Object.values(json?.query?.pages ?? {})
  return pages
    .filter(
      (page) =>
        page.thumbnail?.source &&
        /\b(film|movie)\b/i.test(page.description ?? '') &&
        !/\.svg\b/i.test(page.thumbnail.source),
    )
    .map((page) => ({
      id: `wiki-${page.pageid}`,
      kind: 'film',
      title: cleanFilmTitle(page.title),
      subtitle: page.description,
      poster: page.thumbnail.source.split('?')[0],
      views: sumViews(page.pageviews),
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, MAX_FILMS)
}

// "The Bear (TV series)" -> "The Bear", "Fargo (American TV series)" -> "Fargo"
export function cleanShowTitle(pageTitle) {
  return pageTitle
    .replace(/\s*\([^()]*\b(TV series|television series|miniseries)\)$/i, '')
    .trim()
}

// Monthly Wikipedia views per TV series, keyed by normalized title. TVmaze has
// the posters but no popularity that compares fairly with films.
export function parseShowViews(json) {
  const views = new Map()
  for (const page of Object.values(json?.query?.pages ?? {})) {
    if (!/\b(television|tv) (series|show)|\bminiseries\b/i.test(page.description ?? '')) {
      continue
    }
    const key = normalize(cleanShowTitle(page.title))
    views.set(key, Math.max(views.get(key) ?? 0, sumViews(page.pageviews)))
  }
  return views
}

export function parseTvmaze(json, showViews = new Map()) {
  return (Array.isArray(json) ? json : [])
    .map((entry) => entry.show)
    .filter((show) => show?.image?.original || show?.image?.medium)
    .slice(0, MAX_SHOWS)
    .map((show) => {
      const year = show.premiered?.slice(0, 4)
      const network = show.network?.name ?? show.webChannel?.name
      return {
        id: `tvmaze-${show.id}`,
        kind: 'show',
        title: show.name,
        subtitle: ['TV series', year, network].filter(Boolean).join(' · '),
        poster: show.image.original ?? show.image.medium,
        views: showViews.get(normalize(show.name)) ?? 0,
      }
    })
}

async function getJson(url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

const wikiSearch = (term, suffix, prop) =>
  new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `${term} ${suffix}`,
    gsrlimit: '8',
    prop,
    piprop: 'thumbnail',
    pithumbsize: '500',
    pilicense: 'any',
    pvipdays: '30',
  })

// Finished lookups, so retyping or re-saving a title costs no requests.
const cache = new Map()
const CACHE_LIMIT = 100

// `complete` is false when a source failed (Wikipedia rate-limits bursts),
// meaning the ranking may be wrong and shouldn't be trusted automatically.
export async function lookupTitle(query, { signal } = {}) {
  const term = query.trim()
  if (term.length < 2) return { results: [], complete: true }

  const key = normalize(term)
  if (cache.has(key)) return cache.get(key)

  const [films, showsJson] = await Promise.allSettled([
    getJson(
      `${WIKIPEDIA_API}?${wikiSearch(term, 'film', 'pageimages|description|pageviews')}`,
      signal,
    ).then(parseWikipedia),
    getJson(`${TVMAZE_API}?q=${encodeURIComponent(term)}`, signal),
  ])
  let complete = films.status === 'fulfilled' && showsJson.status === 'fulfilled'

  const filmResults = films.status === 'fulfilled' ? films.value : []
  let shows = showsJson.status === 'fulfilled' ? parseTvmaze(showsJson.value) : []

  const isExact = (item) => normalize(item.title) === key

  // Same name as both a film and a show: ask Wikipedia which is more watched.
  if (filmResults.some(isExact) && shows.some(isExact)) {
    try {
      const views = await getJson(
        `${WIKIPEDIA_API}?${wikiSearch(term, 'television series', 'description|pageviews')}`,
        signal,
      ).then(parseShowViews)
      shows = parseTvmaze(showsJson.value, views)
    } catch {
      complete = false
    }
  }

  // Exact title matches first, the more-watched one winning a film/show tie;
  // everything else keeps its source order.
  const results = [...filmResults, ...shows]
  const exact = results.filter(isExact).sort((a, b) => b.views - a.views)
  const lookup = {
    results: [...exact, ...results.filter((item) => !isExact(item))],
    complete,
  }

  if (complete) {
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value)
    cache.set(key, lookup)
  }
  return lookup
}

export async function searchTitles(query, options) {
  return (await lookupTitle(query, options)).results
}

export function clearLookupCache() {
  cache.clear()
}

// The poster to attach automatically, '' when nothing matched, or null when a
// source failed and it is worth trying again later.
export async function findPoster(title, options) {
  try {
    const { results, complete } = await lookupTitle(title, options)
    if (!complete) return null
    return results[0]?.poster ?? ''
  } catch {
    return null
  }
}
