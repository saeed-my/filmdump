import { useEffect, useRef } from 'react'
import { findPoster } from '../lib/posterSearch'

// Spacing between lookups so a long list doesn't trip Wikipedia's rate limit.
export const BACKFILL_GAP_MS = 1000

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Finds a poster for every film that has none, one at a time, once per film
// per session. Covers new films saved without a poster too. If a source fails
// the batch stops and those films are tried again on the next change or visit.
export function usePosterBackfill(films, applyPoster) {
  const attempted = useRef(new Set())
  const running = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (running.current) return
    const missing = films.filter(
      (film) => !film.poster && film.title && !attempted.current.has(film.id),
    )
    if (missing.length === 0) return

    running.current = true
    ;(async () => {
      for (const [index, film] of missing.entries()) {
        if (index > 0) await wait(BACKFILL_GAP_MS)
        if (!mounted.current) break
        attempted.current.add(film.id)
        const poster = await findPoster(film.title)
        if (!mounted.current) break
        if (poster === null) {
          attempted.current.delete(film.id)
          break
        }
        if (poster) await applyPoster(film.id, poster)
      }
      running.current = false
    })()
  }, [films, applyPoster])
}
