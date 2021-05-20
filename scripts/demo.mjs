import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs-extra'
import { installBrowsersWithProgressBar } from 'playwright-chromium/lib/install/installer.js'
import { $, cd } from 'zx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

await installBrowsersWithProgressBar()

await $`npm run build`

const starterMd = path.resolve(__dirname, '../demo/starter/slides.md')
if (!fs.existsSync(starterMd))
  await fs.copyFile(path.resolve(__dirname, '../packages/create-app/template/slides.md'), starterMd)

cd(path.resolve(__dirname, '../demo/composable-vue'))
await $`npx slidev build -d --base /demo/composable-vue/ --out ../../dist/composable-vue`
cd(path.resolve(__dirname, '../demo/starter'))
await $`npx slidev build -d --base /demo/starter/ --out ../../dist/starter`
