import { copy, remove } from 'fs-extra'

async function main() {
  await remove('.vitepress/@slidev')
  await copy('node_modules/@slidev', '.vitepress/@slidev', { dereference: true })
}

main()
