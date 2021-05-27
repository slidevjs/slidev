import fs from 'fs-extra'
import { $ } from 'zx'

await fs.copyFile('README.md', 'packages/slidev/README.md')
await $`npx pnpm -r publish --access public --no-git-checks --tag next`
