import { describe, expect, it } from 'vitest'
import { handleBackground } from './layoutHelper'

describe('handleBackground', () => {
  it('forces white text over an image by default', () => {
    expect(handleBackground('/photo.png').color).toBe('white')
    expect(handleBackground('/photo.png', false, 'cover', 'light').color).toBe('white')
  })

  it('keeps the theme text color over an image with text: dark', () => {
    const style = handleBackground('/photo.png', false, 'cover', 'dark')
    expect(style.color).toBeUndefined()
    expect(style.backgroundImage).toContain('photo.png')
  })

  it('never sets a text color for a color background', () => {
    expect(handleBackground('#123456').color).toBeUndefined()
    expect(handleBackground('rgb(0, 0, 0)', false, 'cover', 'light').color).toBeUndefined()
  })
})
