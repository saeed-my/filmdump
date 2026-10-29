import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Values set directly under one [section] header, ignoring subsections.
function section(name) {
  const toml = readFileSync('supabase/config.toml', 'utf8').replace(/\r\n/g, '\n')
  const start = toml.indexOf(`\n[${name}]\n`)
  const body = toml.slice(start + name.length + 4)
  return body.slice(0, body.search(/\n\[/))
}

describe('Supabase auth config', () => {
  it('blocks new accounts', () => {
    expect(section('auth')).toMatch(/^enable_signup = false$/m)
  })

  // On hosted projects [auth.email] enable_signup is the email provider
  // switch. Turning it off locked the owner out of password login.
  it('keeps email login on', () => {
    expect(section('auth.email')).toMatch(/^enable_signup = true$/m)
  })
})
