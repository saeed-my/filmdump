import { describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import PosterImage, { PosterHero } from './PosterImage'

describe('PosterImage', () => {
  it('renders the image when a poster is set', () => {
    const { container } = render(
      <PosterImage src="https://example.com/a.jpg" title="Arrival" />,
    )
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/a.jpg',
    )
  })

  it('shows the title initial when there is no poster', () => {
    const { container } = render(<PosterImage src="" title="arrival" />)
    expect(container.querySelector('img')).toBeNull()
    expect(container).toHaveTextContent('A')
  })

  it('swaps a broken image for the title initial', () => {
    const { container } = render(
      <PosterImage src="https://example.com/dead.jpg" title="Heat" />,
    )
    fireEvent.error(container.querySelector('img'))
    expect(container.querySelector('img')).toBeNull()
    expect(container).toHaveTextContent('H')
  })
})

describe('PosterHero', () => {
  it('swaps a broken image for the title initial', () => {
    const { container } = render(
      <PosterHero src="https://example.com/dead.jpg" title="Parasite" />,
    )
    fireEvent.error(container.querySelector('img'))
    expect(container.querySelector('img')).toBeNull()
    expect(container).toHaveTextContent('P')
  })
})
