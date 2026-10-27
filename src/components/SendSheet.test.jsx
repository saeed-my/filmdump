import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SendSheet from './SendSheet'
import { insertFriend, listFriends, sendFilm } from '../lib/sendsRepo'

// Network calls are faked; token, link and delivery logic stay real.
vi.mock('../lib/sendsRepo', async (importOriginal) => ({
  ...(await importOriginal()),
  listFriends: vi.fn(),
  insertFriend: vi.fn(),
  sendFilm: vi.fn(),
}))

const film = { id: 2, title: 'Parasite', rating: 8.5, recommendNote: 'Go in blind' }
const amina = { id: 7, name: 'Amina', token: 'a'.repeat(32) }

let share

// Suggestions are a <datalist>; its options have no accessible name.
const friendsLoaded = () =>
  vi.waitFor(() =>
    expect(document.querySelector('datalist option[value="Amina"]')).not.toBeNull(),
  )

beforeEach(() => {
  share = vi.fn(() => Promise.resolve())
  vi.stubGlobal('navigator', {
    share,
    clipboard: { writeText: vi.fn(() => Promise.resolve()) },
  })
  listFriends.mockResolvedValue([amina])
  insertFriend.mockImplementation((friend) => Promise.resolve({ id: 9, ...friend }))
  sendFilm.mockResolvedValue()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

async function sendTo(name, { beforeSend } = {}) {
  const user = userEvent.setup()
  const onSent = vi.fn()
  render(<SendSheet film={film} onClose={() => {}} onSent={onSent} />)
  await friendsLoaded()
  await user.type(screen.getByLabelText('To'), name)
  // userEvent installs its own clipboard, so overrides go in after setup
  beforeSend?.()
  await user.click(screen.getByRole('button', { name: 'Send Parasite' }))
  return { user, onSent }
}

describe('SendSheet', () => {
  it('prefills the note with the film’s recommendation', async () => {
    render(<SendSheet film={film} onClose={() => {}} />)
    expect(screen.getByLabelText('Note (optional)')).toHaveValue('Go in blind')
    await friendsLoaded()
  })

  it('needs a name before sharing anything', async () => {
    await sendTo('   ')
    expect(screen.getByText('Who is it for?')).toBeInTheDocument()
    expect(share).not.toHaveBeenCalled()
  })

  it('reuses an existing friend’s link, ignoring case', async () => {
    const { onSent } = await sendTo(' amina ')
    expect(share).toHaveBeenCalledWith({
      text: 'New pick for you: Parasite (8.5/10)',
      url: `${window.location.origin}/f/${amina.token}`,
    })
    expect(await screen.findByText('Sent Parasite to Amina.')).toBeInTheDocument()
    expect(insertFriend).not.toHaveBeenCalled()
    expect(sendFilm).toHaveBeenCalledWith({ friendId: 7, filmId: 2, note: 'Go in blind' })
    expect(onSent).toHaveBeenCalled()
  })

  it('creates a new friend only after the link is shared', async () => {
    await sendTo('Tunde')
    expect(await screen.findByText('Sent Parasite to Tunde.')).toBeInTheDocument()
    const sharedToken = share.mock.calls[0][0].url.split('/f/')[1]
    expect(sharedToken).toMatch(/^[0-9a-f]{32}$/)
    expect(insertFriend).toHaveBeenCalledWith({ name: 'Tunde', token: sharedToken })
    expect(sendFilm).toHaveBeenCalledWith({ friendId: 9, filmId: 2, note: 'Go in blind' })
  })

  it('saves nothing when the share is cancelled', async () => {
    share.mockRejectedValue(Object.assign(new Error(), { name: 'AbortError' }))
    await sendTo('Tunde')
    await vi.waitFor(() => expect(share).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: 'Send Parasite' })).toBeInTheDocument()
    expect(insertFriend).not.toHaveBeenCalled()
    expect(sendFilm).not.toHaveBeenCalled()
  })

  it('offers Retry when saving fails, without adding the friend twice', async () => {
    sendFilm.mockRejectedValueOnce(new Error('offline'))
    const { user } = await sendTo('Tunde')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't save the pick, try again.",
    )
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Sent Parasite to Tunde.')).toBeInTheDocument()
    expect(insertFriend).toHaveBeenCalledTimes(1)
    expect(sendFilm).toHaveBeenCalledTimes(2)
  })

  it('shows the link to copy by hand when share and clipboard both fail', async () => {
    await sendTo('Amina', {
      beforeSend: () =>
        vi.stubGlobal('navigator', {
          clipboard: { writeText: () => Promise.reject(new Error('blocked')) },
        }),
    })
    expect(await screen.findByText('Copy this link to Amina:')).toBeInTheDocument()
    expect(
      screen.getByText(`${window.location.origin}/f/${amina.token}`),
    ).toBeInTheDocument()
  })
})
