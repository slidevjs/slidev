import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const __templateDir = resolve(__dirname, 'template')
const __pagesDir = resolve(__templateDir, 'pages')

const shouldCreatePagesDict = () => !existsSync(__pagesDir)

// key: copy to (relative ./)
// value: origin (relative ./template)
const needCopyFiles = {
  'slides.md': '../../../demo/starter/slides.md',
  'pages/imported-slides.md': '../../../demo/starter/pages/imported-slides.md',
  'snippets/external.ts': '../../../demo/starter/snippets/external.ts',
}

async function main() {
  if (shouldCreatePagesDict())
    await fs.mkdir(__pagesDir, { recursive: true })

  await Promise.all(
    Object.keys(needCopyFiles).map(async (relativeTargetPath) => {
      const sourcePath = resolve(__templateDir, needCopyFiles[relativeTargetPath])
      const targetPath = resolve(__templateDir, relativeTargetPath)
      if (existsSync(targetPath))
        await fs.rm(targetPath, { recursive: true, force: true })

      await fs.mkdir(dirname(targetPath), { recursive: true })
      await fs.copyFile(sourcePath, targetPath)
    }),
  )
  // eslint-disable-next-line no-console
  console.log('done...')
}

main()
