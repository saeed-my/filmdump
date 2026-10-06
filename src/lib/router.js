export function parseRoute(pathname) {
  const path = pathname.replace(/\/$/, '') || '/'
  if (path === '/') return { view: 'list' }
  if (path === '/add') return { view: 'add' }
  if (path === '/recs') return { view: 'recs' }
  if (path === '/login') return { view: 'login' }
  const detailMatch = path.match(/^\/films\/(\d+)$/)
  if (detailMatch) return { view: 'detail', id: Number(detailMatch[1]) }
  return { view: 'not-found' }
}

export function navigate(to) {
  const target = to.startsWith('/') ? to : `/${to}`
  if (window.location.pathname !== target) {
    window.history.pushState(null, '', target)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}
