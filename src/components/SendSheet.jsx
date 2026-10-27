import { useEffect, useId, useState } from 'react'
import Sheet from './Sheet'
import { validateSendFields } from '../lib/filmUtils'
import {
  deliverLink,
  friendLink,
  insertFriend,
  listFriends,
  makeToken,
  sameName,
  sendFilm,
} from '../lib/sendsRepo'

const fieldClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base text-text transition-colors duration-200 placeholder:text-muted focus:border-cta focus:outline-none focus:ring-2 focus:ring-cta/30 aria-invalid:border-danger'

const labelClass = 'mb-1.5 block text-sm font-medium text-text'

const primaryClass =
  'press min-h-11 w-full cursor-pointer rounded-xl bg-cta px-6 py-2.5 text-base font-semibold text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:cursor-not-allowed disabled:opacity-50'

export default function SendSheet({ film, onClose, onSent }) {
  const formId = useId()
  const [friends, setFriends] = useState([])
  const [name, setName] = useState('')
  const [note, setNote] = useState(film.recommendNote ?? '')
  const [errors, setErrors] = useState({})
  // form → saving → done, or failed with a Retry
  const [phase, setPhase] = useState('form')
  const [sent, setSent] = useState(null)

  useEffect(() => {
    let cancelled = false
    listFriends()
      .then((rows) => {
        if (!cancelled) setFriends(rows)
      })
      .catch(() => {
        // suggestions are a convenience; new names still work
      })
    return () => {
      cancelled = true
    }
  }, [])

  const save = async (delivery) => {
    setPhase('saving')
    try {
      const friend = delivery.friend.id
        ? delivery.friend
        : await insertFriend(delivery.friend)
      // a retry after a later failure must not insert the friend twice
      delivery.friend = friend
      await sendFilm({ friendId: friend.id, filmId: film.id, note: delivery.note })
      setPhase('done')
      onSent?.()
    } catch {
      setPhase('failed')
    }
  }

  // Nothing is awaited before deliverLink: phones only open the share
  // sheet straight from a tap.
  const handleSubmit = (event) => {
    event.preventDefault()
    const { errors: nextErrors, values } = validateSendFields({ name, note })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const existing = friends.find((friend) => sameName(friend.name, values.name))
    const friend = existing ?? { name: values.name, token: makeToken() }
    const url = friendLink(friend.token)
    const text = `New pick for you: ${film.title} (${film.rating.toFixed(1)}/10)`

    deliverLink({ text, url }).then((how) => {
      if (how === 'cancelled') return
      const delivery = { how, url, friend, note: values.note, name: friend.name }
      setSent(delivery)
      save(delivery)
    })
  }

  if (phase !== 'form') {
    return (
      <Sheet title="Send to a friend" onClose={onClose}>
        <div className="max-w-xl space-y-4">
          {phase === 'saving' ? (
            <p role="status" className="text-base text-muted">
              Saving…
            </p>
          ) : null}
          {phase === 'failed' ? (
            <>
              <p role="alert" className="text-base text-text">
                Couldn't save the pick, try again.
              </p>
              <button type="button" onClick={() => save(sent)} className={primaryClass}>
                Retry
              </button>
            </>
          ) : null}
          {phase === 'done' ? (
            <>
              <p className="text-base text-text">
                {sent.how === 'shared'
                  ? `Sent ${film.title} to ${sent.name}.`
                  : sent.how === 'copied'
                    ? `Link copied. Paste it to ${sent.name}.`
                    : `Copy this link to ${sent.name}:`}
              </p>
              {sent.how === 'manual' ? (
                <p className="text-sm break-all text-muted">{sent.url}</p>
              ) : null}
              <button type="button" onClick={onClose} className={primaryClass}>
                Done
              </button>
            </>
          ) : null}
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet title="Send to a friend" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="max-w-xl space-y-5">
        <div>
          <label htmlFor={`${formId}-name`} className={labelClass}>
            To
          </label>
          <input
            id={`${formId}-name`}
            list={`${formId}-friends`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            placeholder="Friend’s name"
            aria-invalid={!!errors.name}
            className={fieldClass}
          />
          <datalist id={`${formId}-friends`}>
            {friends.map((friend) => (
              <option key={friend.id} value={friend.name} />
            ))}
          </datalist>
          {errors.name ? (
            <p className="mt-1.5 text-sm text-danger">{errors.name}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor={`${formId}-note`} className={labelClass}>
            Note (optional)
          </label>
          <textarea
            id={`${formId}-note`}
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            aria-invalid={!!errors.note}
            className={fieldClass}
          />
          {errors.note ? (
            <p className="mt-1.5 text-sm text-danger">{errors.note}</p>
          ) : null}
        </div>

        <button type="submit" className={primaryClass}>
          Send {film.title}
        </button>
      </form>
    </Sheet>
  )
}
