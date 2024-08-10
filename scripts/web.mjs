import { fileURLToPath } from 'node:url'
import { $, cd, path } from 'zx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dist = path.resolve(__dirname, '../docs/.vitepress/dist/web')

cd(path.resolve(__dirname, '../packages/web'))
await $`pnpm build --base /web/ --outDir ${dist}`
