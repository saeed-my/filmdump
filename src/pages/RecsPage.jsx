import { useState } from 'react'
import BackLink from '../components/BackLink'
import PosterImage from '../components/PosterImage'

const linkClass =
  'min-h-11 cursor-pointer text-sm font-medium text-cta transition-opacity duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta'

export default function RecsPage({
  films,
  loading = false,
  error = null,
  isOwner = false,
  isShared = true,
  onBack,
  onSelectFilm,
  onSignIn,
}) {
  const [shareStatus, setShareStatus] = useState(null)
  const shareUrl = `${window.location.origin}/recs`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareStatus('copied')
    } catch {
      setShareStatus('failed')
    }
  }

  return (
    <div className="mx-auto min-h-svh max-w-xl px-6 py-10 sm:max-w-2xl sm:px-8 sm:py-14 lg:max-w-4xl lg:px-12 lg:py-16">
      {isOwner ? <BackLink onClick={onBack} /> : null}

      <header className={isOwner ? 'mt-8 mb-10' : 'mb-10'}>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h1 className="font-heading text-[clamp(2.5rem,8vw,4.5rem)] font-semibold leading-[0.95] tracking-tight text-balance text-text">
            Recommendations
          </h1>
          {isOwner ? (
            <button type="button" onClick={handleCopy} className={linkClass}>
              {shareStatus === 'copied' ? 'Link copied' : 'Copy link'}
            </button>
          ) : null}
        </div>
        {isOwner && shareStatus === 'failed' ? (
          <p className="mt-3 text-sm break-all text-muted">
            Copy it by hand: {shareUrl}
          </p>
        ) : null}
        {isOwner && !isShared ? (
          <p className="mt-3 text-sm text-muted">
            Only visible on this device until sharing is connected. Setup steps
            are in the README.
          </p>
        ) : null}
      </header>

      {loading ? (
        <p className="border-t border-border/60 py-16 text-center text-sm text-muted">
          Loading…
        </p>
      ) : error ? (
        <p
          role="alert"
          className="border-t border-border/60 py-16 text-center text-base text-text"
        >
          {error}
        </p>
      ) : films.length === 0 ? (
        <div className="border-t border-border/60 py-16 text-center">
          <p className="text-base text-text">Nothing recommended yet.</p>
          <p className="mt-2 text-sm text-muted">
            {isOwner
              ? 'Open a film, tap Edit, and tick “Recommend to friends”.'
              : 'Check back soon.'}
          </p>
        </div>
      ) : (
        <ul className="border-t border-border/60">
          {films.map((film) => (
            <li
              key={film.id}
              className="flex items-start gap-4 border-b border-border/40 py-5 sm:gap-5"
            >
              <PosterImage src={film.poster} title={film.title} featured />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-medium leading-snug tracking-tight text-text sm:text-xl">
                  {film.title}
                </h2>
                <p className="mt-0.5 text-sm tabular-nums">
                  <span className="font-semibold text-cta">
                    {film.rating.toFixed(1)}
                  </span>
                  <span className="text-muted"> / 10</span>
                </p>
                {film.recommendNote ? (
                  <p className="mt-2 text-base leading-relaxed text-pretty text-text/90">
                    {film.recommendNote}
                  </p>
                ) : null}
                {isOwner ? (
                  <button
                    type="button"
                    onClick={() => onSelectFilm(film.id)}
                    className="mt-1 min-h-11 cursor-pointer text-sm text-muted transition-colors duration-200 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
                  >
                    Edit
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {onSignIn ? (
        <footer className="mt-12 text-center">
          <button
            type="button"
            onClick={onSignIn}
            className="min-h-11 cursor-pointer text-xs text-muted transition-colors duration-200 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
          >
            Owner sign in
          </button>
        </footer>
      ) : null}
    </div>
  )
}
