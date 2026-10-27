import { describe, expect, it } from 'vitest'
import { project, shouldDismissSheet } from './gesture'

describe('project', () => {
  it('projects a flick forward along its direction', () => {
    expect(project(1000)).toBeCloseTo(499, 0)
    expect(project(-1000)).toBeCloseTo(-499, 0)
    expect(project(0)).toBe(0)
  })

  it('travels less with a snappier deceleration rate', () => {
    expect(project(1000, 0.99)).toBeLessThan(project(1000))
  })
})

describe('shouldDismissSheet', () => {
  const height = 600

  it('keeps the sheet open after a short, slow drag', () => {
    expect(shouldDismissSheet({ offset: 80, velocity: 50, height })).toBe(false)
  })

  it('dismisses a quick downward flick even from a short drag', () => {
    expect(shouldDismissSheet({ offset: 60, velocity: 900, height })).toBe(true)
  })

  it('dismisses a slow drag that passes halfway', () => {
    expect(shouldDismissSheet({ offset: 320, velocity: 0, height })).toBe(true)
  })

  it('keeps the sheet open when a long drag is flicked back up', () => {
    expect(shouldDismissSheet({ offset: 320, velocity: -600, height })).toBe(false)
  })
})
