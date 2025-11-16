import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createGenerator } from '@unocss/core'
import fg from 'fast-glob'
import config from '../uno.config'

const uno = await createGenerator(config)

const files = await fg(
  '**/*.vue',
  {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    ignore: ['**/*.generated/**', '**/node_modules/**'],
    absolute: true,
  },
)

const tokens = new Set<string>()
for (const file of files) {
  const content = await fs.readFile(file, 'utf-8')
  await uno.applyExtractors(
    content,
    file,
    tokens,
  )
}

const result = await uno.generate(tokens)

await fs.writeFile(
  fileURLToPath(new URL('../.generated/unocss-tokens.ts', import.meta.url)),
  [
    '/* eslint-disable eslint-comments/no-unlimited-disable */',
    '/* eslint-disable */',
    `export default ${JSON.stringify(Array.from(result.matched).sort(), null, 2)}`,
  ].join('\n'),
  'utf-8',
)
