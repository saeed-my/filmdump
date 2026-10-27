import { useCallback, useEffect, useState } from 'react'
import { getFriendPage, respondToSend } from '../lib/sendsRepo'
import { isCloud } from '../lib/supabase'

export function useFriendPage(token) {
  // In local mode there is no server, so every link is a dead link.
  const [state, setState] = useState({
    page: null,
    loading: isCloud,
    error: null,
  })

  useEffect(() => {
    if (!isCloud) return
    let cancelled = false
    getFriendPage(token)
      .then((page) => {
        if (!cancelled) setState({ page, loading: false, error: null })
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            page: null,
            loading: false,
            error: "Couldn't load your picks. Check your connection and reload.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [token])

  // Throws on failure so the form can keep what the friend typed.
  const respond = useCallback(
    async (pickId, reply) => {
      await respondToSend(token, pickId, reply)
      setState((current) => ({
        ...current,
        page: {
          ...current.page,
          picks: current.page.picks.map((pick) =>
            pick.id === pickId
              ? {
                  ...pick,
                  status: reply.status,
                  friendRating: reply.rating,
                  friendLine: reply.line,
                }
              : pick,
          ),
        },
      }))
    },
    [token],
  )

  return { ...state, respond }
}
