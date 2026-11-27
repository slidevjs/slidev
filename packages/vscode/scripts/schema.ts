import fs from 'node:fs/promises'
import tsj from 'ts-json-schema-generator'

const program = tsj
  .createGenerator({
    path: '../../packages/types/src/frontmatter.ts',
    tsconfig: '../../tsconfig.json',
    markdownDescription: true,
    additionalProperties: true,
    jsDoc: 'extended',
    skipTypeCheck: true,
  })

await Promise.all([
  fs.writeFile('./schema/headmatter.json', `${JSON.stringify(
    program.createSchema('Headmatter'),
    null,
    2,
  )}\n`),

  fs.writeFile('./schema/frontmatter.json', `${JSON.stringify(
    program.createSchema('Frontmatter'),
    null,
    2,
  )}\n`),
])
