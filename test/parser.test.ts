import type { SlidevConfig, SlidevPreparserExtension } from '../packages/types/src'
import { basename, relative, resolve } from 'node:path'
import { objectMap, slash } from '@antfu/utils'
import fg from 'fast-glob'
import { describe, expect, it } from 'vitest'
import { extractImagesUsage } from '../packages/parser/src/core'
import { getDefaultConfig, load, parse, prettify, resolveConfig, stringify } from '../packages/parser/src/fs'

function configDiff(v: SlidevConfig) {
  const defaults = getDefaultConfig()
  const res: Record<string, any> = {}
  for (const key of Object.keys(v) as (keyof SlidevConfig)[]) {
    if (JSON.stringify(v[key]) !== JSON.stringify(defaults[key]))
      res[key] = v[key]
  }
  return res
}

function replaceCRLF(s: string) {
  return s.replace(/\r\n/g, '\n')
}

describe('md parser', () => {
  const userRoot = resolve(__dirname, 'fixtures/markdown')
  const files = fg.sync('*.md', {
    cwd: userRoot,
    absolute: true,
  })

  for (const file of files) {
    it(basename(file), async () => {
      const data = await load(userRoot, file)

      expect(stringify(data.entry).trim()).toEqual(replaceCRLF(data.entry.raw.trim()))

      prettify(data.entry)

      // File path tests & convert to relative paths
      data.markdownFiles = objectMap(data.markdownFiles, (path, md) => {
        expect(md.filepath).toBe(path)
        const relativePath = slash(relative(userRoot, path))
        md.slides.forEach((slide) => {
          expect(slide.filepath).toBe(path)
          slide.filepath = relativePath
        })
        md.filepath = relativePath
        return [relativePath, md]
      })

      expect(data.slides).toMatchSnapshot('slides')
      expect(configDiff(resolveConfig(data.headmatter, {}))).toMatchSnapshot('config')
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

`, 'file.md')
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

`, 'file.md')
    expect(data.slides.map(i => i.content.trim()))
      .toEqual(Array.from('abcdef'))
    expect(data.slides[2].frontmatter)
      .toEqual({ layout: 'z' })
    expect(data.slides[3].frontmatter)
      .toEqual({ })
  })

  async function parseWithExtension(
    src: string,
    transformRawLines: (lines: string[]) => void | Promise<void> = () => {},
    more = {},
    moreExts: SlidevPreparserExtension[] = [],
  ) {
    return await parse(
      src,
      'file.md',
      [{ transformRawLines, ...more }, ...moreExts] as any,
    )
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
`, (lines) => {
      for (const i in lines)
        lines[i] = lines[i].replace(/@@v@@/g, 'thing')
    })

    expect(data.slides.map(i => i.content.trim().replace(/\n/g, '%')).join('/'))
      .toEqual('a thing/b%thing%%thing = thing')
  })

  it('parse with-extension custom-separator', async () => {
    const data = await parseWithExtension(`---
ga: bu
---
a @@v@@

SEPARATOR

b
@@v@@

@@v@@ = @@v@@
`, (lines) => {
      for (const i in lines)
        lines[i] = lines[i].replace(/^SEPARATOR$/g, '---')
    })

    expect(data.slides.map(i => i.content.trim().replace(/\n/g, '%')).join('/'))
      .toEqual('a @@v@@/b%@@v@@%%@@v@@ = @@v@@')
  })

  it('parse with-extension eg-easy-cover', async () => {
    function cov(i: string, more = '.jpg') {
      return `---
layout: cover
background: ${i}${more}
---

`
    }
    const data = await parseWithExtension(`@cov 1.jpg
@cov 2.jpg
# 2
---

# 3
@cov 4.jpg
`, (lines) => {
      let i = 0
      while (i < lines.length) {
        if (lines[i].startsWith('@cov ')) {
          const repl = [...cov(lines[i].substring(5), '').split('\n')]
          lines.splice(i, 1, ...repl)
        }
        i++
      }
    })

    expect(data.slides.map(s => s.content.trim().replace(/\n/g, '%')).join('/'))
      .toEqual('/# 2/# 3/'.replace(/\n/g, '%'))
    expect(data.slides[0].frontmatter)
      .toEqual({ layout: 'cover', background: '1.jpg' })
    expect(data.slides[1].frontmatter)
      .toEqual({ layout: 'cover', background: '2.jpg' })
    expect(data.slides[3].frontmatter)
      .toEqual({ layout: 'cover', background: '4.jpg' })
  })

  it('parse with-extension sequence', async () => {
    const data = await parseWithExtension(`
a..A
a.a.A.A
.a.A.
`, undefined, {}, [{
      name: 'test',
      transformRawLines(lines: string[]) {
        for (const i in lines)
          lines[i] = lines[i].replace(/A/g, 'B').replace(/a/g, 'A')
      },
    }, {
      name: 'test',
      transformRawLines(lines: string[]) {
        for (const i in lines)
          lines[i] = lines[i].replace(/A/g, 'C')
      },
    }])
    expect(data.slides.map(i => i.content.trim().replace(/\n/g, '%')).join('/'))
      .toEqual('C..B%C.C.B.B%.C.B.')
  })

  // Generate cartesian product of given iterables:
  function* cartesian(...all: any[]): Generator<any[], void, void> {
    const [head, ...tail] = all
    const remainder = tail.length ? cartesian(...tail) : [[]]
    for (const r of remainder) {
      for (const h of head)
        yield [h, ...r]
    }
  }
  const B = [0, 1]
  const Bs = [B, B, B, B, B, B]
  const bNames = '_swScCF'

  for (const desc of cartesian(...Bs)) {
    const [withSlideBefore, withFrontmatter, withSlideAfter, prependContent, appendContent, addFrontmatter] = desc
    it(`parse with-extension wrap ${desc.map((b, i) => bNames[b * (i + 1)]).join('')}`, async () => {
      const code = [
        withSlideBefore
          ? [
              '.',
              '',
              '---',
            ]
          : [],
        (!withSlideBefore && withFrontmatter)
          ? [
              '---',
            ]
          : [],
        withFrontmatter
          ? [
              'm: M',
              'n: N',
              '---',
            ]
          : [],
        '',
        'ccc',
        '@a',
        '@b',
        'ddd',
        '',
        withSlideAfter
          ? [
              '',
              '---',
              '',
              '..',
            ]
          : [],
      ].flat().join('\n')

      const data = await parseWithExtension(
        code,
        undefined,
        {
          transformSlide(content: string, frontmatter: any) {
            const lines = content.split('\n')
            let i = 0
            let appendBeforeCount = 0
            let appendAfterCount = 0
            while (i < lines.length) {
              const l = lines[i]
              if (l.startsWith('@')) {
                const t = l.substring(1)
                lines.splice(i, 1)
                if (prependContent)
                  lines.splice(appendBeforeCount++, 0, `<${t}>`)
                if (appendContent)
                  lines.splice(lines.length - appendAfterCount++, 0, `</${t}>`)
                if (addFrontmatter)
                  frontmatter[`add${t}`] = 'add'
                i--
              }
              i++
            }
            return lines.join('\n')
          },
        },
      )

      function project(s: string) {
        // like the trim in other tests, the goal is not to test newlines here
        return s.replace(/%{2,}/g, '%')
      }
      expect(project(data.slides.map(i => i.content.replace(/\n/g, '%')).join('/')))
        .toEqual(project([
          ...withSlideBefore ? ['./'] : [],
          ...prependContent ? ['<a>%<b>%'] : [],
          'ccc%ddd',
          ...appendContent ? ['%</b>%</a>'] : [],
          ...withSlideAfter ? ['/..'] : [],
        ].join('')))

      if (withFrontmatter || addFrontmatter) {
        expect(data.slides[withSlideBefore ? 1 : 0].frontmatter)
          .toEqual({
            ...withFrontmatter ? { m: 'M', n: 'N' } : {},
            ...addFrontmatter ? { adda: 'add', addb: 'add' } : {},
          })
      }
    })
  }

  describe('extractImagesUsage', () => {
    it('extracts from frontmatter image key', () => {
      const images = extractImagesUsage('', { image: '/path/to/image.png' })
      expect(images).toEqual(['/path/to/image.png'])
    })

    it('extracts from frontmatter backgroundImage key', () => {
      const images = extractImagesUsage('', { backgroundImage: 'https://example.com/bg.jpg' })
      expect(images).toEqual(['https://example.com/bg.jpg'])
    })

    it('extracts from frontmatter background key with image extension', () => {
      const images = extractImagesUsage('', { background: '/assets/bg.webp' })
      expect(images).toEqual(['/assets/bg.webp'])
    })

    it('extracts from frontmatter background key with URL', () => {
      const images = extractImagesUsage('', { background: 'https://example.com/image.png' })
      expect(images).toEqual(['https://example.com/image.png'])
    })

    it('ignores frontmatter background key without image extension or URL', () => {
      const images = extractImagesUsage('', { background: 'gradient-to-r' })
      expect(images).toEqual([])
    })

    it('ignores data URLs in frontmatter', () => {
      const images = extractImagesUsage('', { image: 'data:image/png;base64,abc123' })
      expect(images).toEqual([])
    })

    it('extracts markdown image syntax', () => {
      const content = '![alt text](/images/photo.jpg)'
      const images = extractImagesUsage(content, {})
      expect(images).toEqual(['/images/photo.jpg'])
    })

    it('extracts multiple markdown images', () => {
      const content = `
![first](/img1.png)
Some text
![second](https://example.com/img2.jpg)
![third](./relative/path.svg)
      `
      const images = extractImagesUsage(content, {})
      expect(images).toEqual(['/img1.png', 'https://example.com/img2.jpg', './relative/path.svg'])
    })

    it('ignores data URLs in markdown images', () => {
      const content = '![inline](data:image/png;base64,abc123)'
      const images = extractImagesUsage(content, {})
      expect(images).toEqual([])
    })

    it('extracts Vue component src prop', () => {
      const content = '<img src="/assets/logo.png" />'
      const images = extractImagesUsage(content, {})
      expect(images).toEqual(['/assets/logo.png'])
    })

    it('extracts Vue component image prop', () => {
      const content = '<MyImage image="/path/to/image.jpg" />'
      const images = extractImagesUsage(content, {})
      expect(images).toEqual(['/path/to/image.jpg'])
    })

    it('ignores Vue props without image extensions', () => {
      const content = '<div src="/some/path" />'
      const images = extractImagesUsage(content, {})
      expect(images).toEqual([])
    })

    it('ignores Vue props with template expressions', () => {
      const content = '<img src="{{imagePath}}.png" />'
      const images = extractImagesUsage(content, {})
      expect(images).toEqual([])
    })

    it('extracts Vue bound props with string literals', () => {
      const content = `<img :src="'/static/image.png'" />`
      const images = extractImagesUsage(content, {})
      expect(images).toEqual(['/static/image.png'])
    })

    it('extracts CSS url()', () => {
      const content = `
<div style="background: url(/bg/image.png)">
<style>
  .class { background-image: url('/another/image.jpg'); }
</style>
      `
      const images = extractImagesUsage(content, {})
      expect(images).toEqual(['/bg/image.png', '/another/image.jpg'])
    })

    it('ignores CSS url() without image extensions', () => {
      const content = `<div style="background: url(/fonts/font.woff2)">`
      const images = extractImagesUsage(content, {})
      expect(images).toEqual([])
    })

    it('strips code blocks to avoid false positives', () => {
      const content = `
Some content
![real image](/real.png)

\`\`\`markdown
![fake image](/fake.png)
<img src="/also-fake.jpg" />
\`\`\`

![another real](/real2.jpg)
      `
      const images = extractImagesUsage(content, {})
      expect(images).toEqual(['/real.png', '/real2.jpg'])
    })

    it('handles multiple sources combined', () => {
      const content = `
# Title
![markdown](/md.png)
<img src="/vue.jpg" />
<div style="background: url(/css.webp)">
      `
      const frontmatter = {
        image: '/frontmatter.png',
        background: 'https://example.com/bg.svg',
      }
      const images = extractImagesUsage(content, frontmatter)
      expect(images).toContain('/frontmatter.png')
      expect(images).toContain('https://example.com/bg.svg')
      expect(images).toContain('/md.png')
      expect(images).toContain('/vue.jpg')
      expect(images).toContain('/css.webp')
      expect(images).toHaveLength(5)
    })

    it('deduplicates identical URLs', () => {
      const content = `
![img](/same.png)
![img2](/same.png)
<img src="/same.png" />
      `
      const images = extractImagesUsage(content, {})
      expect(images).toEqual(['/same.png'])
    })

    it('trims whitespace from extracted URLs', () => {
      const content = '![img]( /path/with/spaces.png )'
      const images = extractImagesUsage(content, {})
      expect(images).toEqual(['/path/with/spaces.png'])
    })

    it('handles various image extensions', () => {
      const content = `
![png](/img.png)
![jpg](/img.jpg)
![jpeg](/img.jpeg)
![gif](/img.gif)
![svg](/img.svg)
![webp](/img.webp)
![avif](/img.avif)
![ico](/img.ico)
![bmp](/img.bmp)
![tiff](/img.tiff)
      `
      const images = extractImagesUsage(content, {})
      expect(images).toHaveLength(10)
    })

    it('handles case-insensitive image extensions', () => {
      const content = `
<img src="/image.PNG" />
<img src="/image.JpG" />
<img src="/image.WEBP" />
      `
      const images = extractImagesUsage(content, {})
      expect(images).toEqual(['/image.PNG', '/image.JpG', '/image.WEBP'])
    })
  })
})
