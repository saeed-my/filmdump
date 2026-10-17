import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { clearLookupCache } from '../lib/posterSearch'

// jsdom does not implement scrolling
window.scrollTo = vi.fn()

// No real network in tests: poster lookups fail unless a test stubs fetch.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('network disabled in tests'))),
  )
})

afterEach(() => {
  cleanup()
  clearLookupCache()
  localStorage.clear()
})
