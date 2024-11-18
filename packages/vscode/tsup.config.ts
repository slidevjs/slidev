import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolvePath } from 'mlly'
import { defineConfig } from 'tsup'
import { generateCodeblockPatch } from './syntaxes/codeblock-patch'

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'language-server': 'language-server/bin.ts',
  },
  format: ['cjs'],
  target: 'node18',
  clean: true,
  minify: true,
  sourcemap: true,
  external: [
    'vscode',
  ],
  inject: ['./language-server/import-meta-url.ts'],
  define: {
    'import.meta.url': 'import_meta_url',
  },
  esbuildPlugins: [{
    name: 'umd2esm',
    setup(build) {
      build.onResolve({ filter: /^(vscode-.*-languageservice|jsonc-parser)/ }, async (args) => {
        const pathUmdMay = await resolvePath(args.path, { url: args.resolveDir })
        // Call twice the replace is to solve the problem of the path in Windows
        const pathEsm = pathUmdMay.replace('/umd/', '/esm/').replace('\\umd\\', '\\esm\\')
        return { path: pathEsm }
      })
    },
  }],
  async onSuccess() {
    const assetsDir = join(__dirname, '../../assets')
    const resDir = join(__dirname, './dist/res')

    if (!existsSync(resDir))
      mkdirSync(resDir, { recursive: true })

    for (const file of ['logo-mono.svg', 'logo-mono-dark.svg', 'logo.png', 'logo.svg'])
      copyFileSync(join(assetsDir, file), join(resDir, file))

    writeFileSync(
      join(__dirname, 'syntaxes/codeblock-patch.json'),
      JSON.stringify(generateCodeblockPatch(), null, 2),
    )
  },
})
