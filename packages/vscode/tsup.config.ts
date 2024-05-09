import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node18',
  splitting: true,
  clean: true,
  shims: false,
  sourcemap: true,
  external: [
    'vscode',
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
