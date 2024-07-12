import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsup'
import { resolvePath } from 'mlly'

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
  esbuildOptions(options) {
    options.alias ||= {}
    options.alias['@vue/runtime-core'] = fileURLToPath(new URL('../../node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js', import.meta.url))
    options.alias['@vue/reactivity'] = fileURLToPath(new URL('../../node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js', import.meta.url))
    options.alias['@vue/shared'] = fileURLToPath(new URL('../../node_modules/@vue/shared/dist/shared.esm-bundler.js', import.meta.url))
  },
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
    const iconsDir = join(resDir, 'icons')

    if (!existsSync(iconsDir))
      mkdirSync(iconsDir, { recursive: true })

    for (const file of ['logo-mono.svg', 'logo-mono-dark.svg', 'logo.png', 'logo.svg'])
      copyFileSync(join(assetsDir, file), join(resDir, file))
  },
})
