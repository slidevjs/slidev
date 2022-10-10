import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import * as url from 'node:url'
import { resolve } from 'node:path'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const __templateDir = resolve(__dirname, 'template')
const __pagesDir = resolve(__templateDir, 'pages')

const shouldCreatePagesDict = () => !existsSync(__pagesDir)

// key: copy to (relative ./)
// value: origin (relative ./template)
const needCopyFiles = {
  'slides.md': '../../../demo/starter/slides.md',
  'pages/multiple-entries.md': '../../../demo/starter/pages/multiple-entries.md',
}

function main() {
  if (shouldCreatePagesDict())
    mkdirSync(__pagesDir)
  Object.keys(needCopyFiles).forEach((relativeTargetPath) => {
    const sourcePath = resolve(__templateDir, needCopyFiles[relativeTargetPath])
    const targetPath = resolve(__templateDir, relativeTargetPath)
    const exist = existsSync(targetPath)
    if (exist)
      rmSync(targetPath)
    copyFileSync(sourcePath, targetPath)
  })
  // eslint-disable-next-line no-console
  console.log('done...')
}

main()
