const fs = require('fs-extra')

async function main(){
  await fs.remove('.vitepress/@slidev')
  await fs.copy('node_modules/@slidev', '.vitepress/@slidev', { dereference: true })
}

main()
