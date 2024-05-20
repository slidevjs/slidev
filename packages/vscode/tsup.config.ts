import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node18',
  clean: true,
  minify: true,
  external: [
    'vscode',
  ],
  plugins: [
    {
      name: 'alias',
      esbuildOptions(options) {
        options.alias ||= {}
        options.alias['@vue/runtime-core'] = fileURLToPath(new URL('../../node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js', import.meta.url))
        options.alias['@vue/reactivity'] = fileURLToPath(new URL('../../node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js', import.meta.url))
        options.alias['@vue/shared'] = fileURLToPath(new URL('../../node_modules/@vue/shared/dist/shared.esm-bundler.js', import.meta.url))
      },
    },
  ],
  async onSuccess() {
    const assetsDir = join(__dirname, '../../assets')
    const resDir = join(__dirname, './dist/res')
    const iconsDir = join(resDir, 'icons')

    if (!existsSync(iconsDir))
      mkdirSync(iconsDir, { recursive: true })

    for (const file of ['logo-mono.svg', 'logo-mono-dark.svg', 'logo.png', 'logo.svg'])
      copyFileSync(resolve(assetsDir, file), resolve(resDir, file))
  },
})
