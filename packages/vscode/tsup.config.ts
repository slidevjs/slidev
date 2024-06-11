import { copyFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
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
  async onSuccess() {
    const assetsDir = join(__dirname, '../../assets')
    const resDir = join(__dirname, './dist/res')

    for (const file of ['logo-mono.svg', 'logo-mono-dark.svg', 'logo.png', 'logo.svg'])
      copyFileSync(resolve(assetsDir, file), resolve(resDir, file))
  },
})
