import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import BackLink from '../components/BackLink'
import NavBar from '../components/NavBar'
import { useLargeTitle } from '../hooks/useLargeTitle'
import FilmForm from '../components/FilmForm'
import { PosterHero } from '../components/PosterImage'
import SendSheet from '../components/SendSheet'
import SentTo from '../components/SentTo'
import { formatWatchedDate, validateFilmFields } from '../lib/filmUtils'

const toFormValues = (film) => ({
  title: film.title,
  rating: String(film.rating),
  poster: film.poster,
  watchedDate: film.watchedDate ?? '',
  notes: film.notes,
  recommended: film.recommended,
  recommendNote: film.recommendNote,
})

export default function FilmDetailPage({
  film,
  onBack,
  onSave,
  canSend = false,
  onViewed,
}) {
  const [titleRef, collapsed] = useLargeTitle()
  const [isEditing, setIsEditing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [values, setValues] = useState(() => toFormValues(film))
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
    setValues(toFormValues(film))
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
    <div className="mx-auto min-h-svh max-w-xl px-6 pb-16 sm:max-w-2xl sm:px-8 lg:max-w-3xl lg:px-12">
      <NavBar
        title={film.title}
        collapsed={collapsed}
        left={<BackLink onClick={onBack} />}
        right={<span className="w-16" />}
      />

      <header className="mt-4 mb-10 sm:mt-6">
        <h1
          ref={titleRef}
          className="font-heading text-[clamp(2.25rem,7vw,3.75rem)] font-semibold leading-[0.95] tracking-[-0.02em] text-balance text-text"
        >
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
              {film.recommended ? (
                <div>
                  <dt className="mb-1 text-sm font-medium text-muted">
                    Recommended to friends
                  </dt>
                  <dd className="text-base leading-relaxed text-pretty text-text">
                    {film.recommendNote || 'Yes'}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="flex flex-wrap items-center gap-x-6">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="press min-h-11 cursor-pointer text-sm font-medium text-tint hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setIsSending(true)}
                disabled={!canSend}
                aria-describedby={canSend ? undefined : 'send-needs-sharing'}
                className="press min-h-11 cursor-pointer text-sm font-medium text-tint hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send to a friend
              </button>
            </div>
            {canSend ? null : (
              <p id="send-needs-sharing" className="-mt-6 text-sm text-muted">
                Connect sharing to send films (see the README).
              </p>
            )}

            {canSend ? (
              <SentTo filmId={film.id} refreshKey={sentCount} onViewed={onViewed} />
            ) : null}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isSending ? (
          <SendSheet
            key="send"
            film={film}
            onClose={() => setIsSending(false)}
            onSent={() => setSentCount((count) => count + 1)}
          />
        ) : null}
      </AnimatePresence>

      {isEditing ? (
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="press mt-4 min-h-11 cursor-pointer text-sm text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      ) : null}
    </div>
  )
}
