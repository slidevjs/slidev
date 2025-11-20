import { existsSync } from 'node:fs'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { resolvePath } from 'mlly'
import { defineConfig } from 'tsdown'
import { generateCodeblockPatch } from './syntaxes/codeblock-patch.ts'

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'language-server': 'language-server/bin.ts',
  },
  format: 'cjs',
  target: 'node20',
  clean: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: true,
  external: [
    'vscode',
  ],
  alias: {
    '@slidev/parser/fs': fileURLToPath(new URL('../parser/src/fs.ts', import.meta.url)),
    '@slidev/parser/core': fileURLToPath(new URL('../parser/src/core.ts', import.meta.url)),
    '@slidev/parser/types': fileURLToPath(new URL('../parser/src/types.ts', import.meta.url)),
    '@slidev/parser': fileURLToPath(new URL('../parser/src/index.ts', import.meta.url)),
  },
  plugins: [
    {
      name: 'umd2esm',
      resolveId: {
        filter: {
          id: /^(vscode-.*-languageservice|vscode-languageserver-types|jsonc-parser)/,
        },
        async handler(source, importer) {
          const pathUmdMay = await resolvePath(source, { url: importer })
          // Call twice the replace is to solve the problem of the path in Windows
          const pathEsm = pathUmdMay.replace('/umd/', '/esm/').replace('\\umd\\', '\\esm\\')
          return { id: pathEsm }
        },
      },
    },
  ],
  async onSuccess() {
    const assetsDir = join(import.meta.dirname, '../../assets')
    const resDir = join(import.meta.dirname, './dist/res')

    if (!existsSync(resDir))
      await mkdir(resDir, { recursive: true })

    for (const file of ['logo-mono.svg', 'logo-mono-dark.svg', 'logo.png', 'logo.svg'])
      await copyFile(join(assetsDir, file), join(resDir, file))

    await writeFile(
      join(import.meta.dirname, 'syntaxes/codeblock-patch.json'),
      JSON.stringify(generateCodeblockPatch(), null, 2),
    )
  },
})
