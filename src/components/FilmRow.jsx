import PosterImage from './PosterImage'

export default function FilmRow({
  film,
  index,
  featured = false,
  newReplies = 0,
  onSelect,
}) {
  const repliesText = newReplies === 1 ? '1 new reply' : `${newReplies} new replies`
  return (
    <article
      className={[
        'film-row group grid items-center gap-x-4 border-b border-border/40 transition-colors duration-300 hover:bg-primary/60 active:bg-primary active:duration-0 sm:gap-x-5',
        featured
          ? 'grid-cols-[2rem_4rem_1fr] py-5 sm:grid-cols-[2.5rem_4.5rem_1fr] sm:py-6'
          : 'grid-cols-[2rem_3rem_1fr] py-4 sm:grid-cols-[2.5rem_3.25rem_1fr]',
      ].join(' ')}
      style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}
    >
      <button
        type="button"
        onClick={() => onSelect(film.id)}
        className="contents cursor-pointer text-left focus-visible:outline-none [&:focus-visible>*]:outline [&:focus-visible>*]:outline-2 [&:focus-visible>*]:outline-offset-2 [&:focus-visible>*]:outline-cta"
        aria-label={`${film.title}, rated ${film.rating} out of 10${newReplies ? `, ${repliesText}` : ''}`}
      >
        <span
          className="text-xs font-medium tabular-nums tracking-wide text-muted transition-opacity duration-200 group-hover:opacity-80"
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <PosterImage src={film.poster} title={film.title} featured={featured} />

        <div className="min-w-0">
          <h2
            className={[
              'truncate font-medium leading-snug text-text transition-opacity duration-200',
              featured ? 'text-lg sm:text-xl' : 'text-base',
            ].join(' ')}
          >
            {film.title}
          </h2>

          <p
            className={[
              'mt-0.5 tabular-nums',
              featured ? 'text-sm' : 'text-xs',
            ].join(' ')}
            aria-hidden="true"
          >
            <span
              className={[
                'font-semibold',
                featured ? 'text-tint' : 'text-muted',
              ].join(' ')}
            >
              {film.rating.toFixed(1)}
            </span>
            <span className="text-muted"> / 10</span>
            {film.recommended ? (
              <span className="text-muted"> · Recommended</span>
            ) : null}
            {newReplies ? (
              <span className="font-semibold text-tint"> · {repliesText}</span>
            ) : null}
          </p>
        </div>
      </button>
    </article>
  )
}
