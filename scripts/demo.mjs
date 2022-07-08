import { fileURLToPath } from 'url'
import { $, cd, fs, path } from 'zx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

await $`npm run build`

const starterMd = path.resolve(__dirname, '../demo/starter/slides.md')
if (!fs.existsSync(starterMd))
  await fs.copyFile(path.resolve(__dirname, '../packages/create-app/template/slides.md'), starterMd)

cd(path.resolve(__dirname, '../demo/composable-vue'))
await $`npx slidev build -d --base /composable-vue/ --out ../../dist/composable-vue`
cd(path.resolve(__dirname, '../demo/starter'))
await $`npx slidev build -d --base /starter/ --out ../../dist/starter`
