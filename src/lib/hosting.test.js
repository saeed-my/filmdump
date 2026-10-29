import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Without a catch-all, Netlify 404s every route but / (e.g. /recs, /f/<token>).
describe('Netlify routing', () => {
  it('serves index.html for every path', () => {
    const redirects = readFileSync('public/_redirects', 'utf8')
    expect(redirects).toMatch(/^\/\*\s+\/index\.html\s+200\s*$/m)
  })
})
