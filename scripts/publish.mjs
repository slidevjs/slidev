import { $, fs } from 'zx'

await fs.copyFile('README.md', 'packages/slidev/README.md')
await fs.copy('skills', 'packages/slidev/skills', { overwrite: true })
await $`pnpm -r publish --access public --no-git-checks`
