import { useEffect, useRef, useState } from 'react'

// iOS large-title behaviour: once the page title scrolls under the nav bar,
// the bar turns into a material and shows a compact title.
export function useLargeTitle(barHeight = 56) {
  const titleRef = useRef(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const title = titleRef.current
    if (!title || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      { rootMargin: `-${barHeight}px 0px 0px 0px` },
    )
    observer.observe(title)
    return () => observer.disconnect()
  }, [barHeight])

  return [titleRef, collapsed]
}
