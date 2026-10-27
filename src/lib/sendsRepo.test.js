import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  countByFilm,
  deliverLink,
  fromPickRow,
  fromSendRow,
  makeToken,
  sameName,
} from './sendsRepo'

const link = { text: 'New pick for you: Parasite (8.5/10)', url: 'https://x/f/abc' }

function stubNavigator({ share, writeText }) {
  vi.stubGlobal('navigator', {
    ...(share ? { share } : {}),
    clipboard: { writeText: writeText ?? vi.fn(() => Promise.resolve()) },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('makeToken', () => {
  it('makes a fresh 32 character hex code each time', () => {
    const a = makeToken()
    expect(a).toMatch(/^[0-9a-f]{32}$/)
    expect(makeToken()).not.toBe(a)
  })
})

describe('sameName', () => {
  it('ignores case and surrounding spaces', () => {
    expect(sameName(' amina', 'Amina ')).toBe(true)
    expect(sameName('Amina', 'Amin')).toBe(false)
  })
})

describe('deliverLink', () => {
  it('uses the share sheet when there is one', async () => {
    const share = vi.fn(() => Promise.resolve())
    stubNavigator({ share })
    expect(await deliverLink(link)).toBe('shared')
    expect(share).toHaveBeenCalledWith(link)
  })

  it('reports a cancelled share without falling back', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    stubNavigator({
      share: () => Promise.reject(Object.assign(new Error(), { name: 'AbortError' })),
      writeText,
    })
    expect(await deliverLink(link)).toBe('cancelled')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('copies the link when the share sheet is refused', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    stubNavigator({
      share: () =>
        Promise.reject(Object.assign(new Error(), { name: 'NotAllowedError' })),
      writeText,
    })
    expect(await deliverLink(link)).toBe('copied')
    expect(writeText).toHaveBeenCalledWith(`${link.text} ${link.url}`)
  })

  it('copies the link when there is no share sheet', async () => {
    stubNavigator({})
    expect(await deliverLink(link)).toBe('copied')
  })

  it('falls back to copying by hand when the clipboard is blocked', async () => {
    stubNavigator({ writeText: () => Promise.reject(new Error('blocked')) })
    expect(await deliverLink(link)).toBe('manual')
  })
})

describe('row mapping', () => {
  it('maps a pick, keeping a missing score as null', () => {
    expect(
      fromPickRow({
        id: 5,
        title: 'Parasite',
        poster: null,
        rating: '8.5',
        note: 'Go in blind',
        status: 'pending',
        friend_rating: null,
        friend_line: '',
      }),
    ).toEqual({
      id: 5,
      title: 'Parasite',
      poster: '',
      rating: 8.5,
      note: 'Go in blind',
      status: 'pending',
      friendRating: null,
      friendLine: '',
    })
  })

  it('marks a send as new only when answered and not yet seen', () => {
    const base = { id: 1, status: 'watched', friend_rating: '9', friends: { name: 'Amina' } }
    expect(fromSendRow({ ...base, responded_at: 't', seen_at: null }).isNew).toBe(true)
    expect(fromSendRow({ ...base, responded_at: 't', seen_at: 't' }).isNew).toBe(false)
    expect(fromSendRow({ ...base, responded_at: null, seen_at: null }).isNew).toBe(false)
    expect(fromSendRow({ ...base, responded_at: 't' })).toMatchObject({
      friendName: 'Amina',
      friendRating: 9,
    })
  })

  it('counts new replies per film', () => {
    expect(countByFilm([{ film_id: 2 }, { film_id: 2 }, { film_id: 7 }])).toEqual({
      2: 2,
      7: 1,
    })
  })
})
