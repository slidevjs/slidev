import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob'

const files = await fg('*.vue', {
  cwd: fileURLToPath(new URL('../packages/client/layouts', import.meta.url)),
})

await fs.writeFile(new URL('../packages/types/src/builtin-layouts.ts', import.meta.url), `
export type BuiltinLayouts =
${files.sort().map(i => `  | '${i.replace('.vue', '')}'`).join('\n')}
`, 'utf-8')
