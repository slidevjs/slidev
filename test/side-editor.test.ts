import { describe, expect, it } from 'vitest'
import { parseSideEditorContent } from '../packages/client/logic/sideEditor'

describe('side editor', () => {
  it('extracts frontmatter-only slide content', () => {
    expect(parseSideEditorContent(`---
layout: image
image: /example.png
---`)).toEqual({
      content: '',
      frontmatterRaw: 'layout: image\nimage: /example.png',
    })
  })

  it('extracts frontmatter from slides with body content', () => {
    expect(parseSideEditorContent(`---
layout: center
---

# Hello`)).toEqual({
      content: '\n# Hello',
      frontmatterRaw: 'layout: center',
    })
  })
})
