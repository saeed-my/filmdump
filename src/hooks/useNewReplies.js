import { useCallback, useEffect, useState } from 'react'
import { listNewReplies, markRepliesSeen } from '../lib/sendsRepo'
import { isCloud } from '../lib/supabase'

// Unread friend replies per film. Optional: if they can't load, the log
// still works and the list just shows no markers.
export function useNewReplies(userId) {
  const [counts, setCounts] = useState({})

  useEffect(() => {
    if (!isCloud || !userId) return
    let cancelled = false
    listNewReplies()
      .then((next) => {
        if (!cancelled) setCounts(next)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [userId])

  const markSeen = useCallback(
    (filmId) => {
      if (!counts[filmId]) return
      setCounts((current) => {
        const next = { ...current }
        delete next[filmId]
        return next
      })
      // best effort: an unsaved mark just shows the reply as new next time
      markRepliesSeen(filmId).catch(() => {})
    },
    [counts],
  )

  return { counts, markSeen }
}
