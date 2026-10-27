import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { useLargeTitle } from './useLargeTitle'

function Probe() {
  const [titleRef, collapsed] = useLargeTitle()
  return (
    <h1 ref={titleRef} data-collapsed={String(collapsed)}>
      Films
    </h1>
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useLargeTitle', () => {
  it('stays expanded where IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    render(<Probe />)
    expect(screen.getByRole('heading')).toHaveAttribute('data-collapsed', 'false')
  })

  it('collapses once the title scrolls under the nav bar, and back', () => {
    let callback
    const disconnect = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb, options) {
          callback = cb
          this.options = options
          expect(options.rootMargin).toBe('-56px 0px 0px 0px')
        }
        observe() {}
        disconnect = disconnect
      },
    )
    const { unmount } = render(<Probe />)
    const heading = screen.getByRole('heading')

    act(() => callback([{ isIntersecting: false }]))
    expect(heading).toHaveAttribute('data-collapsed', 'true')

    act(() => callback([{ isIntersecting: true }]))
    expect(heading).toHaveAttribute('data-collapsed', 'false')

    unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
