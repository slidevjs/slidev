import { fileURLToPath } from 'node:url'
import { $, cd, path } from 'zx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const demo = path.resolve(__dirname, '../docs/.vitepress/dist/demo')

await $`npm run build`

const demos = [
  'composable-vue',
  'starter',
  'vue-runner',
]

for (const name of demos) {
  cd(path.resolve(__dirname, '../demo', name))
  await $`npx slidev build --base /demo/${name}/ --out ${demo}/${name}`
}
