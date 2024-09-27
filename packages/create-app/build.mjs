import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'fs-extra'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const __templateDir = resolve(__dirname, 'template')
const __pagesDir = resolve(__templateDir, 'pages')

const shouldCreatePagesDict = () => !fs.existsSync(__pagesDir)

// key: copy to (relative ./)
// value: origin (relative ./template)
const needCopyFiles = {
  'slides.md': '../../../demo/starter/slides.md',
  'pages/imported-slides.md': '../../../demo/starter/pages/imported-slides.md',
  'snippets/external.ts': '../../../demo/starter/snippets/external.ts',
}

async function main() {
  if (shouldCreatePagesDict())
    await fs.ensureDir(__pagesDir)

  await Promise.all(
    Object.keys(needCopyFiles).map(async (relativeTargetPath) => {
      const sourcePath = resolve(__templateDir, needCopyFiles[relativeTargetPath])
      const targetPath = resolve(__templateDir, relativeTargetPath)
      if (fs.existsSync(targetPath))
        await fs.rm(targetPath)

      await fs.ensureDir(dirname(targetPath))
      await fs.copy(sourcePath, targetPath)
    }),
  )
  // eslint-disable-next-line no-console
  console.log('done...')
}

main()
