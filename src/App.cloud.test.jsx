import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const cloud = vi.hoisted(() => ({
  session: null,
  tables: {},
  signIn: null,
  rpc: null,
  writes: [],
  failing: null,
}))

vi.mock('./lib/supabase', () => {
  // Filters are ignored: each table returns its fixture rows as-is.
  const query = (table) => {
    const builder = {
      then: (resolve, reject) =>
        Promise.resolve(
          cloud.failing === table
            ? { data: null, error: new Error(`${table} unavailable`) }
            : { data: cloud.tables[table] ?? [], error: null },
        ).then(resolve, reject),
    }
    for (const name of ['select', 'order', 'eq', 'not', 'is', 'single']) {
      builder[name] = () => builder
    }
    for (const op of ['insert', 'upsert', 'update']) {
      builder[op] = (row) => {
        cloud.writes.push({ table, op, row })
        return builder
      }
    }
    return builder
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
      rpc: (name, args) => cloud.rpc(name, args),
    },
  }
})

const token = '0123456789abcdef0123456789abcdef'

const friendPage = () => ({
  name: 'Amina',
  picks: [
    {
      id: 11,
      title: 'Parasite',
      poster: '',
      rating: 8.5,
      note: 'You will hate the ending',
      status: 'pending',
      friend_rating: null,
      friend_line: '',
    },
    {
      id: 12,
      title: 'Moonlight',
      poster: '',
      rating: 7.4,
      note: '',
      status: 'pass',
      friend_rating: null,
      friend_line: 'not my thing',
    },
  ],
})

beforeEach(() => {
  cloud.session = null
  cloud.signIn = vi.fn()
  cloud.writes = []
  cloud.failing = null
  cloud.rpc = vi.fn((name) =>
    Promise.resolve(
      name === 'get_friend_page'
        ? { data: friendPage(), error: null }
        : { data: null, error: null },
    ),
  )
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

  it.each([
    '/',
    '/recs',
    '/films/1',
    '/add',
    '/f',
    '/f/',
    '/f/xyz',
    `/f/${token}0`,
  ])('keeps the private log hidden from a signed-out visitor on %s', async (path) => {
    window.history.pushState(null, '', path)
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: 'Recommendations' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Private Pick')).not.toBeInTheDocument()
    expect(cloud.rpc).not.toHaveBeenCalled()
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

  it('marks films with new friend replies on the owner list', async () => {
    cloud.session = { user: { id: 'owner-1' } }
    cloud.tables.sends = [{ film_id: 2 }]
    render(<App />)
    expect(
      await screen.findByRole('button', { name: /Parasite.*1 new reply/ }),
    ).toBeInTheDocument()
  })

  it('shows a friend reply on the film and clears the list marker', async () => {
    const user = userEvent.setup()
    cloud.session = { user: { id: 'owner-1' } }
    cloud.tables.sends = [
      {
        id: 31,
        film_id: 2,
        status: 'watched',
        friend_rating: 9,
        friend_line: 'Better than you said',
        responded_at: '2026-10-27T10:00:00Z',
        seen_at: null,
        created_at: '2026-10-20T10:00:00Z',
        friends: { name: 'Amina' },
      },
    ]
    render(<App />)
    await user.click(
      await screen.findByRole('button', { name: /Parasite.*1 new reply/ }),
    )

    expect(await screen.findByText('Amina')).toBeInTheDocument()
    expect(screen.getByText('· Watched it · 9.0')).toBeInTheDocument()
    expect(screen.getByText('“Better than you said”')).toBeInTheDocument()
    expect(cloud.writes).toContainEqual(
      expect.objectContaining({ table: 'sends', op: 'update' }),
    )

    window.history.back()
    expect(
      await screen.findByRole('button', { name: 'Parasite, rated 8.5 out of 10' }),
    ).toBeInTheDocument()
  })

  it('still shows the log when replies cannot load', async () => {
    cloud.session = { user: { id: 'owner-1' } }
    cloud.failing = 'sends' // e.g. the app updated before the new SQL ran
    render(<App />)
    expect(await screen.findByText('Private Pick')).toBeInTheDocument()
    expect(screen.queryByText(/new repl/)).not.toBeInTheDocument()
  })
})

describe('A friend opening their link', () => {
  it('shows their picks without signing in, and nothing private', async () => {
    window.history.pushState(null, '', `/f/${token}`)
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: 'For Amina' }),
    ).toBeInTheDocument()
    expect(screen.getByText('You will hate the ending')).toBeInTheDocument()
    expect(screen.getByText('2 films · 1 to go')).toBeInTheDocument()
    expect(screen.getByText('You: Not for me')).toBeInTheDocument()
    expect(screen.queryByText('Private Pick')).not.toBeInTheDocument()
    expect(cloud.rpc).toHaveBeenCalledWith('get_friend_page', { p_token: token })
  })

  it('says when the link no longer works', async () => {
    cloud.rpc = vi.fn(() => Promise.resolve({ data: null, error: null }))
    window.history.pushState(null, '', `/f/${token}`)
    render(<App />)
    expect(
      await screen.findByText("This link doesn't work anymore."),
    ).toBeInTheDocument()
  })

  it('needs a score for Watched it, then saves the answer', async () => {
    const user = userEvent.setup()
    window.history.pushState(null, '', `/f/${token}`)
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Watched it' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Give it a score.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Your score'), '9')
    await user.type(screen.getByLabelText('One line (optional)'), 'Better than you said')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('You: Watched it · 9.0')).toBeInTheDocument()
    expect(cloud.rpc).toHaveBeenCalledWith('respond_to_send', {
      p_token: token,
      p_send_id: 11,
      p_status: 'watched',
      p_rating: 9,
      p_line: 'Better than you said',
    })
  })

  it('keeps what the friend typed when saving fails', async () => {
    const user = userEvent.setup()
    window.history.pushState(null, '', `/f/${token}`)
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Seen it before' }))
    cloud.rpc = vi.fn(() => Promise.resolve({ data: null, error: new Error('offline') }))
    await user.type(screen.getByLabelText('One line (optional)'), 'Loved it')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save. Try again.")
    expect(screen.getByLabelText('One line (optional)')).toHaveValue('Loved it')
  })

  it('is read-only when the owner previews it', async () => {
    cloud.session = { user: { id: 'owner-1' } }
    window.history.pushState(null, '', `/f/${token}`)
    render(<App />)
    expect(
      await screen.findByText('Previewing Amina’s page. Replies are off.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Watched it' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByText('Private Pick')).not.toBeInTheDocument()
  })
})
