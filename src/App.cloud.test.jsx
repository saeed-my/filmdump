import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const cloud = vi.hoisted(() => ({
  session: null,
  tables: {},
  signIn: null,
}))

vi.mock('./lib/supabase', () => {
  const query = (table) => {
    const result = () =>
      Promise.resolve({ data: cloud.tables[table] ?? [], error: null })
    return { select: () => ({ order: result }) }
  }
  return {
    isCloud: true,
    supabase: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: cloud.session } }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
        signInWithPassword: (credentials) => cloud.signIn(credentials),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: query,
    },
  }
})

beforeEach(() => {
  cloud.session = null
  cloud.signIn = vi.fn()
  cloud.tables = {
    recommendations: [
      { id: 2, title: 'Parasite', rating: 8.5, poster: '', recommend_note: 'Go in blind' },
    ],
    films: [
      { id: 1, title: 'Private Pick', rating: 6, poster: '', notes: 'secret', recommended: false },
      { id: 2, title: 'Parasite', rating: 8.5, poster: '', notes: '', recommended: true, recommend_note: 'Go in blind' },
    ],
  }
  window.history.pushState(null, '', '/')
})

describe('App with sharing connected', () => {
  it('shows a signed-out visitor only the public recommendations', async () => {
    window.history.pushState(null, '', '/recs')
    render(<App />)
    expect(await screen.findByText('Parasite')).toBeInTheDocument()
    expect(screen.getByText('Go in blind')).toBeInTheDocument()
    expect(screen.queryByText('Private Pick')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy link' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Log a film' })).not.toBeInTheDocument()
  })

  it('keeps the private log hidden from a signed-out visitor on any URL', async () => {
    window.history.pushState(null, '', '/films/1')
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: 'Recommendations' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Private Pick')).not.toBeInTheDocument()
  })

  it('reports a wrong password on the sign-in page', async () => {
    const user = userEvent.setup()
    cloud.signIn.mockResolvedValue({ error: { message: 'Invalid login' } })
    window.history.pushState(null, '', '/login')
    render(<App />)
    await user.type(await screen.findByLabelText('Email'), 'me@example.com')
    await user.type(screen.getByLabelText('Password'), 'nope')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Wrong email or password.',
    )
  })

  it('loads the full log for the signed-in owner', async () => {
    cloud.session = { user: { id: 'owner-1' } }
    render(<App />)
    expect(await screen.findByText('Private Pick')).toBeInTheDocument()
    expect(screen.getByText('2 titles')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })
})
