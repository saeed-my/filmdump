import { useEffect, useState } from 'react'
import { REPLY_LABELS } from '../lib/filmUtils'
import { listSendsForFilm } from '../lib/sendsRepo'

function daysAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  return days === 1 ? '1 day ago' : `${days} days ago`
}

function replyText(send) {
  if (send.status === 'pending') return `waiting · sent ${daysAgo(send.sentAt)}`
  const score = send.friendRating == null ? '' : ` · ${send.friendRating.toFixed(1)}`
  return `${REPLY_LABELS[send.status]}${score}`
}

// Who this film was sent to and what they said. Opening it marks
// their replies as seen.
export default function SentTo({ filmId, refreshKey, onViewed }) {
  const [state, setState] = useState({ sends: [], error: false })

  useEffect(() => {
    let cancelled = false
    listSendsForFilm(filmId)
      .then((sends) => {
        if (cancelled) return
        setState({ sends, error: false })
        if (sends.some((send) => send.isNew)) onViewed?.(filmId)
      })
      .catch(() => {
        if (!cancelled) setState({ sends: [], error: true })
      })
    return () => {
      cancelled = true
    }
    // onViewed changes identity as counts change; reloading on that is pointless
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filmId, refreshKey])

  if (state.error) {
    return <p className="text-sm text-muted">Couldn't load replies.</p>
  }
  if (state.sends.length === 0) return null

  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-muted">Sent to</h2>
      <ul className="space-y-3">
        {state.sends.map((send) => (
          <li key={send.id} className="border-l-2 border-border pl-3 text-base text-text">
            <span className="font-medium">{send.friendName}</span>
            <span className="text-muted"> · {replyText(send)}</span>
            {send.isNew ? <span className="text-tint"> · new</span> : null}
            {send.friendLine ? (
              <p className="mt-0.5 text-sm text-text/80">“{send.friendLine}”</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
