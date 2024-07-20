import fs from 'node:fs/promises'
import tsj from 'ts-json-schema-generator'

const program = tsj
  .createGenerator({
    path: '../../packages/types/src/config.ts',
    tsconfig: '../../tsconfig.json',
    additionalProperties: true,
  })
  .createSchema('Headmatter')

await fs.writeFile('./schema/headmatter.json', JSON.stringify(program, null, 2))
