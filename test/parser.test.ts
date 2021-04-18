import { resolve, basename } from 'path'
import fg from 'fast-glob'
import { prettify, load, stringify } from '../packages/vite-slides/node'

describe('md parser', () => {
  const files = fg.sync('*.md', {
    cwd: resolve(__dirname, 'fixtures/markdown'),
    absolute: true,
  })

  for (const file of files) {
    it(basename(file), async() => {
      const data = await load(file)

      expect(stringify(data).trim()).toEqual(data.raw.trim())

      prettify(data)

      expect(stringify(data)).toMatchSnapshot('formatted')
    })
  }
})
