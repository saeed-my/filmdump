import { useCallback, useEffect, useState } from 'react'
import { navigate, parseRoute } from '../lib/router'

export function useRouter() {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname))

  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const go = useCallback((to) => navigate(to), [])

  return { route, navigate: go }
}
