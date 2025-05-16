import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { resolvePath } from 'mlly'
import { defineConfig } from 'tsdown'
import { generateCodeblockPatch } from './syntaxes/codeblock-patch.ts'

export default defineConfig({
  // @ts-expect-error `entry` is valid option
  entry: {
    'index': 'src/index.ts',
    'language-server': 'language-server/bin.ts',
  },
  format: 'cjs',
  target: 'node18',
  clean: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: true,
  external: [
    'vscode',
  ],
  shims: ['./language-server/import-meta-url.ts'],
  define: {
    'import.meta.url': 'import_meta_url',
  },
  alias: {
    '@slidev/parser/fs': fileURLToPath(new URL('../parser/src/fs.ts', import.meta.url)),
    '@slidev/parser/core': fileURLToPath(new URL('../parser/src/core.ts', import.meta.url)),
    '@slidev/parser/types': fileURLToPath(new URL('../parser/src/types.ts', import.meta.url)),
    '@slidev/parser': fileURLToPath(new URL('../parser/src/index.ts', import.meta.url)),
  },
  plugins: [{
    name: 'umd2esm',
    setup(build: any) {
      build.onResolve({ filter: /^(vscode-.*-languageservice|jsonc-parser)/ }, async (args: any) => {
        const pathUmdMay = await resolvePath(args.path, { url: args.resolveDir })
        // Call twice the replace is to solve the problem of the path in Windows
        const pathEsm = pathUmdMay.replace('/umd/', '/esm/').replace('\\umd\\', '\\esm\\')
        return { path: pathEsm }
      })
    },
  }],
  async onSuccess() {
    const assetsDir = join(import.meta.dirname, '../../assets')
    const resDir = join(import.meta.dirname, './dist/res')

    if (!existsSync(resDir))
      mkdirSync(resDir, { recursive: true })

    for (const file of ['logo-mono.svg', 'logo-mono-dark.svg', 'logo.png', 'logo.svg'])
      copyFileSync(join(assetsDir, file), join(resDir, file))

    writeFileSync(
      join(import.meta.dirname, 'syntaxes/codeblock-patch.json'),
      JSON.stringify(generateCodeblockPatch(), null, 2),
    )
  },
})
