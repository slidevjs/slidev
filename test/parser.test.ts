import { basename, resolve } from 'path'
import fg from 'fast-glob'
import { describe, expect, it } from 'vitest'
import { load, parse, prettify, stringify } from '../packages/parser/src/fs'

describe('md parser', () => {
  const files = fg.sync('*.md', {
    cwd: resolve(__dirname, 'fixtures/markdown'),
    absolute: true,
  })

  for (const file of files) {
    it(basename(file), async () => {
      const data = await load(file)

      expect(stringify(data).trim()).toEqual(data.raw.trim())

      prettify(data)

      for (const slide of data.slides) {
        if (slide.source?.filepath)
          // @ts-ingore non-optional
          delete slide.source.filepath
        // @ts-expect-error extra prop
        if (slide.filepath)
          // @ts-expect-error extra prop
          delete slide.filepath
      }
      expect(data.slides).toMatchSnapshot('slides')
      expect(data.config).toMatchSnapshot('config')
      expect(data.features).toMatchSnapshot('features')
    })
  }

  it('parse', () => {
    const data = parse(`
a

---

b

---
layout: z
---
c
----
d
----
e

---

f

`)
    expect(data.slides.map(i => i.content.trim()))
      .toEqual(Array.from('abcdef'))
    expect(data.slides[2].frontmatter)
      .toEqual({ layout: 'z' })
  })

  it('parse section matter', () => {
    const data = parse(`
a

---

b

---section2
layout: z
---
c
----   section 3
d
---- section-4
e

---

f

`)
    expect(data.slides.map(i => i.content.trim()))
      .toEqual(Array.from('abcdef'))
    expect(data.slides[2].frontmatter)
      .toEqual({ layout: 'z' })
  })
})
