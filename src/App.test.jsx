import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

beforeEach(() => {
  window.history.pushState(null, '', '/')
})

describe('App', () => {
  it('lists the seeded films', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Films' })).toBeInTheDocument()
    expect(screen.getByText('The Godfather')).toBeInTheDocument()
    expect(screen.getByText('10 titles')).toBeInTheDocument()
  })

  it('filters the list by search', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Search films' }))
    await user.type(screen.getByLabelText('Find a title'), 'dune')
    expect(screen.getByText('Dune: Part Two')).toBeInTheDocument()
    expect(screen.queryByText('The Godfather')).not.toBeInTheDocument()
    expect(screen.getByText('1 of 10')).toBeInTheDocument()
  })

  it('logs a new film and persists it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Log a film' }))
    await user.type(screen.getByLabelText('Title'), 'Heat')
    await user.type(screen.getByLabelText('Rating'), '8.3')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Heat')).toBeInTheDocument()
    expect(screen.getByText('11 titles')).toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem('filmdump:films'))
    expect(stored.at(-1)).toMatchObject({ title: 'Heat', rating: 8.3 })
  })

  it('shows an empty recommendations page until something is recommended', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Recommendations' }))
    expect(
      screen.getByRole('heading', { name: 'Recommendations' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Nothing recommended yet.')).toBeInTheDocument()
  })

  it('puts a recommended film and its note on the recommendations page', async () => {
    const user = userEvent.setup()
    window.history.pushState(null, '', '/films/2')
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByLabelText('Recommend to friends'))
    await user.type(screen.getByLabelText(/Why watch it/), 'Go in blind')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.click(await screen.findByRole('link', { name: /Films/ }))
    expect(screen.getByText(/· Recommended/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Recommendations' }))
    expect(screen.getByText('Parasite')).toBeInTheDocument()
    expect(screen.getByText('Go in blind')).toBeInTheDocument()
    expect(screen.queryByText('The Godfather')).not.toBeInTheDocument()
  })

  it('removes a film from recommendations when unticked', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'filmdump:films',
      JSON.stringify([
        { id: 1, title: 'Heat', rating: 8, recommended: true, recommendNote: 'x' },
      ]),
    )
    window.history.pushState(null, '', '/films/1')
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByLabelText('Recommend to friends'))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByRole('button', { name: 'Edit' })
    expect(JSON.parse(localStorage.getItem('filmdump:films'))[0]).toMatchObject({
      recommended: false,
      recommendNote: '',
    })
  })

  it('opens logging as a sheet over the list', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Log a film' }))
    expect(screen.getByRole('dialog', { name: 'Log a film' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/add')
    expect(screen.getByText('The Godfather')).toBeInTheDocument()
  })

  it('closes the sheet with Cancel without saving', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Log a film' }))
    await user.type(screen.getByLabelText('Title'), 'Unsaved')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(window.location.pathname).toBe('/')
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('10 titles')).toBeInTheDocument()
  })

  it('closes the sheet with Escape', async () => {
    const user = userEvent.setup()
    window.history.pushState(null, '', '/add')
    render(<App />)
    await user.keyboard('{Escape}')
    expect(window.location.pathname).toBe('/')
  })

  it('shows Recommend to friends as a switch', async () => {
    const user = userEvent.setup()
    window.history.pushState(null, '', '/add')
    render(<App />)
    const toggle = screen.getByRole('switch', { name: 'Recommend to friends' })
    expect(toggle).not.toBeChecked()
    expect(screen.queryByLabelText(/Why watch it/)).not.toBeInTheDocument()
    await user.click(toggle)
    expect(toggle).toBeChecked()
    expect(screen.getByLabelText(/Why watch it/)).toBeInTheDocument()
  })

  it('blocks saving a film with no title or rating', async () => {
    const user = userEvent.setup()
    window.history.pushState(null, '', '/add')
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Title is required.')).toBeInTheDocument()
    expect(screen.getByText('Rating is required.')).toBeInTheDocument()
  })
})
