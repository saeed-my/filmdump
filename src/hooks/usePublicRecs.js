import { useEffect, useState } from 'react'
import { listRecommendations } from '../lib/filmsRepo'

export function usePublicRecs() {
  const [state, setState] = useState({ films: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    listRecommendations()
      .then((films) => {
        if (!cancelled) setState({ films, loading: false, error: null })
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            films: [],
            loading: false,
            error: "Couldn't load the list. Check your connection and reload.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
