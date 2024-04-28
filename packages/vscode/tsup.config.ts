import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig } from 'tsup'
import { icons } from '@iconify-json/carbon'
import { copySync } from 'fs-extra'

const ICON_NAMES = [
  'align-box-bottom-center',
  'align-box-bottom-left',
  'align-box-bottom-right',
  'align-box-middle-center',
  'align-box-middle-left',
  'align-box-middle-right',
  'align-box-top-center',
  'align-box-top-left',
  'align-box-top-right',
  'book',
  'border-none',
  'certificate-check',
  'certificate',
  'checkbox-checked',
  'checkbox',
  'chevron-down',
  'chevron-up',
  'code',
  'collapse-categories',
  'cut-in-half',
  'dicom-overlay',
  'fit-to-screen',
  'home',
  'identification',
  'image',
  'layers',
  'legend',
  'lightning',
  'media-library',
  'migrate-alt',
  'new-tab',
  'non-certified',
  'open-panel-filled-bottom',
  'open-panel-filled-left',
  'open-panel-filled-right',
  'open-panel-filled-top',
  'overlay',
  'play',
  'presentation-file',
  'script-reference',
  'text-align-center',
  'text-align-justify',
  'text-align-left',
  'text-align-right',
  'timer',
  'user-speaker',
  'view-off',
]

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node18',
  splitting: true,
  clean: true,
  shims: false,
  external: [
    'vscode',
  ],
  async onSuccess() {
    const assetsDir = join(__dirname, '../../assets')
    const resDir = join(__dirname, 'res')

    console.warn('DEBUG', readdirSync(assetsDir), resolve(assetsDir, 'logo-mono.svg'), existsSync(resolve(assetsDir, 'logo-mono.svg')))

    for (const file of ['logo-mono.svg', 'logo.png', 'logo.svg'])
      copySync(resolve(assetsDir, file), resolve(resDir, file))

    for (const icon of ICON_NAMES) {
      writeFileSync(
        resolve(resDir, `icons/carbon-${icon}.svg`),
        `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32">${icons.icons[icon].body}</svg>`,
      )
    }
  },
})
