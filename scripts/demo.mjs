import { fileURLToPath } from 'node:url'
import { $, cd, fs, path } from 'zx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const demo = path.resolve(__dirname, '../docs/.vitepress/dist/demo')

await $`npm run build`

const starterMd = path.resolve(__dirname, '../demo/starter/slides.md')
if (!fs.existsSync(starterMd))
  await fs.copyFile(path.resolve(__dirname, '../packages/create-app/template/slides.md'), starterMd)

cd(path.resolve(__dirname, '../demo/composable-vue'))
await $`npx slidev build --base /demo/composable/ --out ${demo}/composable-vue`
cd(path.resolve(__dirname, '../demo/starter'))
await $`npx slidev build --base /demo/starter/ --out ${demo}/starter`
