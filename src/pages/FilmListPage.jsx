import { useMemo, useState } from 'react'
import FilmRow from '../components/FilmRow'
import FabAdd from '../components/FabAdd'
import NavBar from '../components/NavBar'
import { useLargeTitle } from '../hooks/useLargeTitle'
import { filterFilms, getTopRatedId, sortByRating } from '../lib/filmUtils'

const barButtonClass =
  'press flex min-h-11 min-w-11 cursor-pointer items-center justify-center px-2 text-[0.9375rem] text-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta'

export default function FilmListPage({
  films,
  newReplies = {},
  inert = false,
  onSelectFilm,
  onAddFilm,
  onOpenRecs,
  onSignOut,
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [titleRef, collapsed] = useLargeTitle()

  const filteredFilms = useMemo(
    () => sortByRating(filterFilms(films, searchQuery)),
    [films, searchQuery],
  )
  const topRatedId = getTopRatedId(films)
  const isFiltering = searchQuery.trim().length > 0

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <div inert={inert}>
      <div className="mx-auto min-h-svh max-w-xl px-6 pb-28 sm:max-w-2xl sm:px-8 lg:max-w-4xl lg:px-12">
        <NavBar
          title="Films"
          collapsed={collapsed}
          right={
            <>
              <button type="button" onClick={onOpenRecs} className={barButtonClass}>
                Recommendations
              </button>
              {searchOpen ? null : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search films"
                  className={barButtonClass}
                >
                  Search
                </button>
              )}
            </>
          }
        />

        <header className="mt-2 mb-8 sm:mt-6 sm:mb-10">
          <h1
            ref={titleRef}
            className="font-heading text-[clamp(2.75rem,8vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.02em] text-balance text-text"
          >
            Films
          </h1>
          <p className="mt-2 text-sm tracking-[0.01em] tabular-nums text-muted">
            {isFiltering
              ? `${filteredFilms.length} of ${films.length}`
              : `${films.length} titles`}
          </p>

          {searchOpen ? (
            <div className="mt-5 flex items-center gap-2">
              <label htmlFor="film-search" className="sr-only">
                Find a title
              </label>
              <input
                id="film-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') closeSearch()
                }}
                placeholder="Find a title…"
                autoFocus
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-transparent bg-primary px-3.5 text-base text-text placeholder:text-muted focus:border-cta/60 focus:outline-none focus:ring-2 focus:ring-cta/30"
              />
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                className={barButtonClass}
              >
                Cancel
              </button>
            </div>
          ) : null}
        </header>

        {films.length === 0 ? (
          <div className="border-t border-border/60 py-16 text-center">
            <p className="text-base text-text">No films logged yet.</p>
            <p className="mt-2 text-sm text-muted">Tap + to add your first.</p>
          </div>
        ) : filteredFilms.length === 0 ? (
          <div className="border-t border-border/60 py-16 text-center">
            <p className="text-base text-text">No films match your search.</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={`mx-auto mt-2 ${barButtonClass}`}
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
                  newReplies={newReplies[film.id] ?? 0}
                  onSelect={onSelectFilm}
                />
              </div>
            ))}
          </div>
        )}

        {onSignOut ? (
          <footer className="mt-10 text-center">
            <button
              type="button"
              onClick={onSignOut}
              className={`mx-auto ${barButtonClass} text-muted`}
            >
              Sign out
            </button>
          </footer>
        ) : null}
      </div>

      <FabAdd onClick={onAddFilm} />
    </div>
  )
}
