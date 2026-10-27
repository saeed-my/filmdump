import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import {
  stubPosterApis,
  tvmazeParasite,
  wikipediaParasite,
} from './test/posterFixtures'

const KEY = 'filmdump:films'
const stored = () => JSON.parse(localStorage.getItem(KEY))

beforeEach(() => {
  window.history.pushState(null, '', '/')
})

describe('automatic posters', () => {
  it('suggests titles with posters while typing and fills both in', async () => {
    stubPosterApis({ wikipedia: wikipediaParasite, tvmaze: tvmazeParasite })
    localStorage.setItem(KEY, JSON.stringify([{ id: 1, title: 'Heat', rating: 8, poster: 'https://x/heat.jpg' }]))
    const user = userEvent.setup()
    window.history.pushState(null, '', '/add')
    render(<App />)

    await user.type(screen.getByLabelText('Title'), 'Parasite')
    const pick = await screen.findByRole('button', {
      name: "Parasite, 2019 South Korean film by Bong Joon Ho",
    })
    await user.click(pick)

    expect(screen.getByLabelText('Title')).toHaveValue('Parasite')
    expect(screen.getByLabelText(/Poster link/)).toHaveValue(
      'https://upload.wikimedia.org/p2019.png',
    )
    expect(screen.getByAltText('Poster preview')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Suggestions' })).not.toBeInTheDocument()
  })

  it('closes suggestions on Escape without closing the sheet', async () => {
    stubPosterApis({ wikipedia: wikipediaParasite })
    const user = userEvent.setup()
    window.history.pushState(null, '', '/add')
    render(<App />)

    await user.type(screen.getByLabelText('Title'), 'Parasite')
    await screen.findByRole('list', { name: 'Suggestions' })
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('list', { name: 'Suggestions' })).not.toBeInTheDocument()
    expect(window.location.pathname).toBe('/add')
  })

  it('finds a poster for a film saved without one', async () => {
    localStorage.setItem(KEY, JSON.stringify([{ id: 1, title: 'Heat', rating: 8, poster: 'https://x/heat.jpg' }]))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Log a film' }))

    stubPosterApis({ wikipedia: wikipediaParasite })
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Log a film' }))
    // typing fast, never picking a suggestion
    await user.type(screen.getByLabelText('Title'), 'Parasite')
    await user.type(screen.getByLabelText('Rating'), '9')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(stored().find((film) => film.title === 'Parasite').poster).toBe(
        'https://upload.wikimedia.org/p2019.png',
      ),
    )
  })

  it('leaves the poster empty when nothing is found', async () => {
    stubPosterApis()
    localStorage.setItem(KEY, JSON.stringify([{ id: 1, title: 'Obscure', rating: 6, poster: '' }]))
    render(<App />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(stored()[0].poster).toBe('')
  })

  it('never replaces a poster the film already has', async () => {
    const fetchMock = stubPosterApis({ wikipedia: wikipediaParasite })
    localStorage.setItem(KEY, JSON.stringify([{ id: 1, title: 'Parasite', rating: 9, poster: 'https://mine.jpg' }]))
    render(<App />)
    await screen.findByText('Parasite')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(stored()[0].poster).toBe('https://mine.jpg')
  })

  it('fills several films one after another', async () => {
    stubPosterApis({ wikipedia: wikipediaParasite })
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { id: 1, title: 'Parasite', rating: 9, poster: '' },
        { id: 2, title: 'Parasite (2019 film)', rating: 9, poster: '' },
      ]),
    )
    render(<App />)
    await waitFor(
      () => expect(stored().every((film) => film.poster)).toBe(true),
      { timeout: 3000 },
    )
  })

  it('stops and retries later when the lookup fails', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { id: 1, title: 'Parasite', rating: 9, poster: '' },
        { id: 2, title: 'Heat', rating: 8, poster: '' },
      ]),
    )
    render(<App />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    // the first failure ends the batch: 2 requests for one film, none for the next
    await new Promise((resolve) => setTimeout(resolve, 1300))
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(stored().map((film) => film.poster)).toEqual(['', ''])
  })

  it('replaces the dead sample poster links saved by the first version', async () => {
    stubPosterApis({ wikipedia: wikipediaParasite })
    localStorage.setItem(
      KEY,
      JSON.stringify([
        {
          id: 2,
          title: 'Parasite',
          rating: 8.5,
          poster: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYXlTkzx2sdu.jpg',
        },
      ]),
    )
    render(<App />)
    await waitFor(() =>
      expect(stored()[0].poster).toBe('https://upload.wikimedia.org/p2019.png'),
    )
  })
})
