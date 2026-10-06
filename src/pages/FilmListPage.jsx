import { useMemo, useState } from 'react'
import FilmRow from '../components/FilmRow'
import FabAdd from '../components/FabAdd'
import { filterFilms, getTopRatedId } from '../lib/filmUtils'

export default function FilmListPage({ films, onSelectFilm, onAddFilm }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFilms = useMemo(
    () => filterFilms(films, searchQuery),
    [films, searchQuery],
  )
  const topRatedId = getTopRatedId(films)
  const isFiltering = searchQuery.trim().length > 0

  return (
    <>
      <div className="mx-auto min-h-svh max-w-xl px-6 pt-10 pb-28 sm:max-w-2xl sm:px-8 sm:pt-14 lg:max-w-4xl lg:px-12 lg:pt-16">
        <header className="mb-12 sm:mb-14">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <h1 className="font-heading text-[clamp(2.75rem,8vw,4.5rem)] font-semibold leading-[0.95] tracking-tight text-balance text-text">
              Films
            </h1>
            <div
              className={[
                'flex items-center gap-3 pb-1',
                searchOpen ? 'w-full sm:w-auto' : 'shrink-0',
              ].join(' ')}
            >
              {searchOpen ? (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <label htmlFor="film-search" className="sr-only">
                    Find a title
                  </label>
                  <input
                    id="film-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Find a title…"
                    autoFocus
                    className="min-h-11 min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-base text-text placeholder:text-muted focus:border-cta focus:outline-none focus:ring-2 focus:ring-cta/30 sm:min-h-0 sm:w-44 sm:flex-none sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false)
                      setSearchQuery('')
                    }}
                    aria-label="Close search"
                    className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center text-sm text-muted transition-colors duration-200 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search films"
                  className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center text-sm text-muted transition-colors duration-200 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
                >
                  Search
                </button>
              )}
              <p className="shrink-0 text-sm tabular-nums text-muted">
                {isFiltering
                  ? `${filteredFilms.length} of ${films.length}`
                  : `${films.length} titles`}
              </p>
            </div>
          </div>
        </header>

        {films.length === 0 ? (
          <div className="border-t border-border/60 py-16 text-center">
            <p className="text-base text-text">No films logged yet.</p>
            <p className="mt-2 text-sm text-muted">
              Tap + to add your first.
            </p>
          </div>
        ) : filteredFilms.length === 0 ? (
          <div className="border-t border-border/60 py-16 text-center">
            <p className="text-base text-text">No films match your search.</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-3 cursor-pointer text-sm text-cta transition-opacity duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div role="list" className="border-t border-border/60">
            {filteredFilms.map((film, index) => (
              <div key={film.id} role="listitem">
                <FilmRow
                  film={film}
                  index={index}
                  featured={film.id === topRatedId && !isFiltering}
                  onSelect={onSelectFilm}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <FabAdd onClick={onAddFilm} />
    </>
  )
}
