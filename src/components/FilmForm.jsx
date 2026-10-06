import { useId } from 'react'

const fieldClass =
  'w-full rounded-md border border-border bg-background px-3 py-2.5 text-base text-text transition-colors duration-200 placeholder:text-muted focus:border-cta focus:outline-none focus:ring-2 focus:ring-cta/30 aria-invalid:border-danger'

const labelClass = 'mb-1.5 block text-sm font-medium text-text'

export default function FilmForm({
  values,
  errors,
  onChange,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  idPrefix = 'film',
}) {
  const formId = useId()

  return (
    <form
      id={formId}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="max-w-xl space-y-5"
      noValidate
    >
      <div>
        <label htmlFor={`${idPrefix}-title`} className={labelClass}>
          Title
        </label>
        <input
          id={`${idPrefix}-title`}
          name="title"
          type="text"
          autoComplete="off"
          value={values.title}
          onChange={(event) => onChange('title', event.target.value)}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? `${idPrefix}-title-error` : undefined}
          className={fieldClass}
          placeholder="Film title"
        />
        {errors.title ? (
          <p id={`${idPrefix}-title-error`} className="mt-1.5 text-sm text-danger">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-rating`} className={labelClass}>
            Rating
          </label>
          <div className="flex items-center gap-2">
            <input
              id={`${idPrefix}-rating`}
              name="rating"
              type="number"
              min="0"
              max="10"
              step="0.1"
              inputMode="decimal"
              value={values.rating}
              onChange={(event) => onChange('rating', event.target.value)}
              aria-invalid={!!errors.rating}
              aria-describedby={
                errors.rating ? `${idPrefix}-rating-error` : undefined
              }
              className={fieldClass}
            />
            <span className="shrink-0 text-sm text-muted">/ 10</span>
          </div>
          {errors.rating ? (
            <p id={`${idPrefix}-rating-error`} className="mt-1.5 text-sm text-danger">
              {errors.rating}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={`${idPrefix}-watched`} className={labelClass}>
            Watched
          </label>
          <input
            id={`${idPrefix}-watched`}
            name="watchedDate"
            type="date"
            value={values.watchedDate ?? ''}
            onChange={(event) => onChange('watchedDate', event.target.value)}
            aria-invalid={!!errors.watchedDate}
            aria-describedby={
              errors.watchedDate ? `${idPrefix}-watched-error` : undefined
            }
            className={fieldClass}
          />
          {errors.watchedDate ? (
            <p id={`${idPrefix}-watched-error`} className="mt-1.5 text-sm text-danger">
              {errors.watchedDate}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-poster`} className={labelClass}>
          Poster URL <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id={`${idPrefix}-poster`}
          name="poster"
          type="url"
          inputMode="url"
          value={values.poster}
          onChange={(event) => onChange('poster', event.target.value)}
          aria-invalid={!!errors.poster}
          aria-describedby={errors.poster ? `${idPrefix}-poster-error` : undefined}
          className={fieldClass}
          placeholder="https://…"
        />
        {errors.poster ? (
          <p id={`${idPrefix}-poster-error`} className="mt-1.5 text-sm text-danger">
            {errors.poster}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-notes`} className={labelClass}>
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id={`${idPrefix}-notes`}
          name="notes"
          rows={4}
          value={values.notes}
          onChange={(event) => onChange('notes', event.target.value)}
          className={`${fieldClass} resize-y min-h-[6rem]`}
          placeholder="What stayed with you?"
        />
      </div>

      <div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-text">
          <input
            type="checkbox"
            name="recommended"
            checked={!!values.recommended}
            onChange={(event) => onChange('recommended', event.target.checked)}
            className="h-5 w-5 cursor-pointer accent-cta"
          />
          Recommend to friends
        </label>
        {values.recommended ? (
          <div className="mt-2">
            <label htmlFor={`${idPrefix}-recommend-note`} className={labelClass}>
              Why watch it{' '}
              <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id={`${idPrefix}-recommend-note`}
              name="recommendNote"
              type="text"
              maxLength={160}
              value={values.recommendNote ?? ''}
              onChange={(event) => onChange('recommendNote', event.target.value)}
              className={fieldClass}
              placeholder="One line your friends will see"
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 cursor-pointer rounded-md bg-cta px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
