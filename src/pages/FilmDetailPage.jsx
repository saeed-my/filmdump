import { useState } from 'react'
import BackLink from '../components/BackLink'
import FilmForm from '../components/FilmForm'
import { PosterHero } from '../components/PosterImage'
import { formatWatchedDate, validateFilmFields } from '../lib/filmUtils'

export default function FilmDetailPage({ film, onBack, onSave }) {
  const [isEditing, setIsEditing] = useState(false)
  const [values, setValues] = useState(() => ({
    title: film.title,
    rating: String(film.rating),
    poster: film.poster,
    watchedDate: film.watchedDate ?? '',
    notes: film.notes,
  }))
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current }
        delete next[field]
        return next
      })
    }
  }

  const handleCancel = () => {
    setValues({
      title: film.title,
      rating: String(film.rating),
      poster: film.poster,
      watchedDate: film.watchedDate ?? '',
      notes: film.notes,
    })
    setErrors({})
    setIsEditing(false)
  }

  const handleSave = async () => {
    const { errors: nextErrors, values: normalized } = validateFilmFields(values)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    const ok = await onSave(film.id, normalized)
    setIsSubmitting(false)

    if (ok) {
      setIsEditing(false)
      setErrors({})
    }
  }

  return (
    <div className="mx-auto min-h-svh max-w-xl px-6 py-10 sm:max-w-2xl sm:px-8 sm:py-14 lg:max-w-3xl lg:px-12 lg:py-16">
      <BackLink onClick={onBack} />

      <header className="mt-8 mb-10">
        <h1 className="font-heading text-[clamp(2.25rem,7vw,3.75rem)] font-semibold leading-[0.95] tracking-tight text-balance text-text">
          {film.title}
        </h1>
      </header>

      {isEditing ? (
        <FilmForm
          idPrefix="detail"
          values={values}
          errors={errors}
          onChange={handleChange}
          onSubmit={handleSave}
          submitLabel="Save"
          isSubmitting={isSubmitting}
        />
      ) : (
        <div className="space-y-8 lg:flex lg:items-start lg:gap-10 lg:space-y-0">
          <div className="lg:w-64 lg:shrink-0">
            <PosterHero src={film.poster} title={film.title} />
          </div>

          <div className="space-y-8 lg:flex-1">
            <dl className="space-y-5">
              <div>
                <dt className="mb-1 text-sm font-medium text-muted">Watched</dt>
                <dd className="text-base text-text">
                  {formatWatchedDate(film.watchedDate)}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-sm font-medium text-muted">Rating</dt>
                <dd className="text-base tabular-nums text-text">
                  {film.rating.toFixed(1)}
                  <span className="text-muted"> / 10</span>
                </dd>
              </div>
              {film.notes ? (
                <div>
                  <dt className="mb-1 text-sm font-medium text-muted">Notes</dt>
                  <dd className="text-base leading-relaxed whitespace-pre-line text-pretty text-text">
                    {film.notes}
                  </dd>
                </div>
              ) : null}
            </dl>

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="min-h-11 cursor-pointer text-sm font-medium text-cta transition-opacity duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {isEditing ? (
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="mt-4 min-h-11 cursor-pointer text-sm text-muted transition-colors duration-200 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      ) : null}
    </div>
  )
}
