import { basename, resolve } from 'path'
import fg from 'fast-glob'
import { describe, expect, it } from 'vitest'
import { load, parse, prettify, stringify } from '../packages/parser/src/fs'
import type { SlidevPreparserExtension } from '../slidev/types/src/types'

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

  it('parse', async () => {
    const data = await parse(`
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
    expect(data.slides[3].frontmatter)
      .toEqual({ })
  })

  it('parse section matter', async () => {
    const data = await parse(`
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
    expect(data.slides[3].frontmatter)
      .toEqual({ })
  })

  async function parseWithExtension(src, handle, more = {}, moreExts: SlidevPreparserExtension = []) {
    return await parse(src, undefined, undefined, undefined, async () => [{ handle, ...more }, ...moreExts])
  }

  it('parse with-extension replace', async () => {
    const data = await parseWithExtension(`---
ga: bu
---
a @@v@@

---

b
@@v@@

@@v@@ = @@v@@
`, (s) => {
      s.lines[s.i] = s.lines[s.i].replace(/@@v@@/g, 'thing')
      return false
    })

    expect(data.slides.map(i => i.content.trim().replace(/\n/g, '%')).join('/'))
      .toEqual('a thing/b%thing%%thing = thing')
  })

  it('parse with-extension disabled', async () => {
    const data = await parseWithExtension(`
a @@v@@

---

b
@@v@@

@@v@@ = @@v@@
`, (s) => {
      s.lines[s.i] = s.lines[s.i].replace(/@@v@@/g, 'thing')
      return false
    }, { disabled: true })

    expect(data.slides.map(i => i.content.trim().replace(/\n/g, '%')).join('/'))
      .toEqual('a @@v@@/b%@@v@@%%@@v@@ = @@v@@')
  })

  it('parse with-extension pingpong', async () => {
    const data = await parseWithExtension(`
.
a.
.
`, () => false, {}, [{
      handle(s) {
        const l = s.lines[s.i]
        if (l.startsWith('......'))
          return false
        if (l.startsWith('.')) {
          s.lines[s.i] = `.${s.lines[s.i]}`
          return true
        }
        return false
      },
    },
    {
      handle(s) {
        const l = s.lines[s.i]
        if (l[0] !== '.' || l.length > 9)
          return false
        s.lines[s.i] = `.A${s.lines[s.i]}`
        return true
      },
    },
    ])
    expect(data.slides.map(i => i.content.trim().replace(/\n/g, '%')).join('/'))
      .toEqual('......A......%a.%......A......')
  })

  // Generate cartesian product of given iterables:
  function* cartesian(...all) {
    const [head, ...tail] = all
    const remainder = tail.length ? cartesian(...tail) : [[]]
    for (const r of remainder) for (const h of head) yield [h, ...r]
  }
  const B = [0, 1]
  const Bs = [B, B, B, B, B, B, B]
  const bNames = '_swScCfF'

  for (const desc of cartesian(...Bs)) {
    const [withSlideBefore, withFrontmatter, withSlideAfter, prependContent, appendContent, prependFrontmatter, appendFrontmatter] = desc
    it(`parse with-extension wrap ${desc.map((b, i) => bNames[b * (i + 1)]).join('')}`, async () => {
      const data = await parseWithExtension(`${
withSlideBefore
? `
.

---
`
: ''}${!withSlideBefore && withFrontmatter ? '---\n' : ''}${withFrontmatter
? `m: M
n: N
---`
: ''}

ccc
@a
@b
ddd
${
withSlideAfter
? `
---

..
`
: ''}`, (s) => {
        const l = s.lines[s.i]
        if (l.startsWith('@')) {
          const t = l.substr(1)
          if (prependContent)
            s.contentPrepend.push(`<${t}>`)
          if (appendContent)
            s.contentAppend.unshift(`</${t}>`)
          if (prependFrontmatter)
            s.frontmatterPrepend.push(`start${t}: start`)
          if (appendFrontmatter)
            s.frontmatterAppend.unshift(`end${t}: end`)
          s.lines.splice(s.i, 1)
          return true
        }
      })
      function project(s) {
        // like the trim in other tests, the goal is not to test newlines here
        return s.replace(/%%%*/g, '%')
      }
      const fm = withFrontmatter || prependFrontmatter || appendFrontmatter
      expect(project(data.slides.map(i => i.raw.replace(/\n/g, '%')).join('/')))
        .toEqual(project([
          ...withSlideBefore ? ['%.%/'] : [],
          ...fm ? ['---%'] : [],
          ...prependFrontmatter ? ['starta: start%startb: start%'] : [],
          ...withFrontmatter ? ['m: M%n: N%'] : [],
          ...appendFrontmatter ? ['endb: end%enda: end%'] : [],
          ...fm ? ['---%'] : [],
          ...prependContent ? ['<a>%<b>%'] : [],
          '%ccc%ddd%',
          ...appendContent ? ['</b>%</a>'] : [],
          ...withSlideAfter ? ['/%..%'] : [],
        ].join('')))
    })
  }
})
