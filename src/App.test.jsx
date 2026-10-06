import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('blocks saving a film with no title or rating', async () => {
    const user = userEvent.setup()
    window.history.pushState(null, '', '/add')
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Title is required.')).toBeInTheDocument()
    expect(screen.getByText('Rating is required.')).toBeInTheDocument()
  })
})
