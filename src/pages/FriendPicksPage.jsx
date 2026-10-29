import { useId, useState } from 'react'
import NavBar from '../components/NavBar'
import PosterImage from '../components/PosterImage'
import { useFriendPage } from '../hooks/useFriendPage'
import { useLargeTitle } from '../hooks/useLargeTitle'
import { REPLY_LABELS, validateReply } from '../lib/filmUtils'
import { isRateLimited } from '../lib/sendsRepo'

const ownerName = import.meta.env.VITE_OWNER_NAME?.trim() ?? ''

const fieldClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base text-text transition-colors duration-200 placeholder:text-muted focus:border-cta focus:outline-none focus:ring-2 focus:ring-cta/30 aria-invalid:border-danger'

const choiceClass =
  'press min-h-11 cursor-pointer rounded-xl border border-border px-3.5 text-sm font-medium text-text hover:bg-primary/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta'

const linkClass =
  'press min-h-11 cursor-pointer text-sm font-medium text-tint hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:cursor-not-allowed disabled:opacity-50'

function ReplyForm({ pick, status, onSave, onCancel }) {
  const formId = useId()
  const [rating, setRating] = useState(
    pick.friendRating == null ? '' : String(pick.friendRating),
  )
  const [line, setLine] = useState(pick.friendLine)
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSaving) return
    const { errors: nextErrors, values } = validateReply({ status, rating, line })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    setSaveError(null)
    try {
      await onSave(values)
    } catch (err) {
      setSaveError(
        isRateLimited(err) ? 'Too many tries. Wait a few minutes.' : "Couldn't save. Try again.",
      )
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-3">
      <p className="text-sm font-medium text-text">{REPLY_LABELS[status]}</p>
      {status === 'pass' ? null : (
        <div>
          <label htmlFor={`${formId}-rating`} className="mb-1 block text-sm text-muted">
            {status === 'watched' ? 'Your score' : 'Your score (optional)'}
          </label>
          <div className="flex items-center gap-2">
            <input
              id={`${formId}-rating`}
              type="number"
              min="0"
              max="10"
              step="0.1"
              inputMode="decimal"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              aria-invalid={!!errors.rating}
              className={`${fieldClass} max-w-28`}
            />
            <span className="text-sm text-muted">/ 10</span>
          </div>
          {errors.rating ? (
            <p className="mt-1 text-sm text-danger">{errors.rating}</p>
          ) : null}
        </div>
      )}
      <div>
        <label htmlFor={`${formId}-line`} className="mb-1 block text-sm text-muted">
          One line (optional)
        </label>
        <input
          id={`${formId}-line`}
          value={line}
          onChange={(event) => setLine(event.target.value)}
          aria-invalid={!!errors.line}
          className={fieldClass}
        />
        {errors.line ? <p className="mt-1 text-sm text-danger">{errors.line}</p> : null}
      </div>
      {saveError ? (
        <p role="alert" className="text-sm text-danger">
          {saveError}
        </p>
      ) : null}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSaving}
          className="press min-h-11 cursor-pointer rounded-xl bg-cta px-5 text-base font-semibold text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} disabled={isSaving} className={linkClass}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function answerText(pick) {
  if (pick.status === 'pass') return REPLY_LABELS.pass
  const score = pick.friendRating == null ? '' : ` · ${pick.friendRating.toFixed(1)}`
  return `${REPLY_LABELS[pick.status]}${score}`
}

function Pick({ pick, readOnly, onRespond }) {
  const [replying, setReplying] = useState(null)
  const answered = pick.status !== 'pending'

  return (
    <li className="flex items-start gap-4 border-b border-border/40 py-5 sm:gap-5">
      <PosterImage src={pick.poster} title={pick.title} featured />
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-medium leading-snug tracking-tight text-text sm:text-xl">
          {pick.title}
        </h2>
        <p className="mt-0.5 text-sm tabular-nums">
          <span className="text-muted">{ownerName ? `${ownerName}: ` : ''}</span>
          <span className="font-semibold text-tint">{pick.rating.toFixed(1)}</span>
          <span className="text-muted"> / 10</span>
        </p>
        {pick.note ? (
          <p className="mt-2 text-base leading-relaxed text-pretty text-text/90">
            {pick.note}
          </p>
        ) : null}

        {replying ? (
          <ReplyForm
            pick={pick}
            status={replying}
            onCancel={() => setReplying(null)}
            onSave={async (reply) => {
              await onRespond(pick.id, reply)
              setReplying(null)
            }}
          />
        ) : answered ? (
          <div className="mt-3">
            <p className="text-sm text-text">You: {answerText(pick)}</p>
            {pick.friendLine ? (
              <p className="mt-1 text-sm text-text/80">“{pick.friendLine}”</p>
            ) : null}
            {readOnly ? null : (
              <button
                type="button"
                onClick={() => setReplying(pick.status)}
                className={linkClass}
              >
                Edit
              </button>
            )}
          </div>
        ) : readOnly ? (
          <p className="mt-3 text-sm text-muted">Waiting for an answer</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(REPLY_LABELS).map(([status, label]) => (
              <button
                key={status}
                type="button"
                onClick={() => setReplying(status)}
                className={choiceClass}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}

export default function FriendPicksPage({ token, preview = false }) {
  const { page, loading, error, respond } = useFriendPage(token)
  const [titleRef, collapsed] = useLargeTitle()

  if (loading) {
    return (
      <p className="py-24 text-center text-sm text-muted" role="status">
        Loading…
      </p>
    )
  }

  if (error || !page) {
    return (
      <div className="mx-auto min-h-svh max-w-xl px-6 py-24 text-center">
        <p role={error ? 'alert' : undefined} className="text-base text-text">
          {error ?? "This link doesn't work anymore."}
        </p>
        {error ? null : (
          <p className="mt-2 text-sm text-muted">
            Ask {ownerName || 'whoever sent it'} for a new one.
          </p>
        )}
      </div>
    )
  }

  const toGo = page.picks.filter((pick) => pick.status === 'pending').length
  const heading = `For ${page.name}`

  return (
    <div className="mx-auto min-h-svh max-w-xl px-6 pb-16 sm:max-w-2xl sm:px-8 lg:max-w-4xl lg:px-12">
      <NavBar title={heading} collapsed={collapsed} />

      <header className="mt-4 mb-10 sm:mt-6">
        <p className="text-sm text-muted">
          {ownerName ? `Picks from ${ownerName}` : 'Picks for you'}
        </p>
        <h1
          ref={titleRef}
          className="mt-1 font-heading text-[clamp(2.5rem,8vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.02em] text-balance text-text"
        >
          {heading}
        </h1>
        <p className="mt-2 text-sm tabular-nums text-muted">
          {page.picks.length} {page.picks.length === 1 ? 'film' : 'films'}
          {toGo > 0 ? ` · ${toGo} to go` : ''}
        </p>
        {preview ? (
          <p className="mt-3 text-sm text-muted">
            Previewing {page.name}’s page. Replies are off.
          </p>
        ) : null}
      </header>

      {page.picks.length === 0 ? (
        <p className="border-t border-border/60 py-16 text-center text-base text-text">
          Nothing here yet.
        </p>
      ) : (
        <ul className="border-t border-border/60">
          {page.picks.map((pick) => (
            <Pick key={pick.id} pick={pick} readOnly={preview} onRespond={respond} />
          ))}
        </ul>
      )}
    </div>
  )
}
