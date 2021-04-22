/* eslint-disable @typescript-eslint/no-var-requires */
import chalk from 'chalk'
import minimist from 'minimist'

const argv: any = minimist(process.argv.slice(2))

console.log(chalk.green`slidev v${require('../package.json').version}`)
console.log(chalk.cyan`vite        v${require('vite/package.json').version}`)

const command = argv._[0]
const entry = argv._[command ? 1 : 0] || 'slides.md'

if (!command || command === 'dev') {
  import('./server')
    .then(i => i.createServer(entry, argv))
    .then(server => server.listen())
    .catch((err) => {
      console.error(chalk.red('failed to start server. error:\n'), err)
      process.exit(1)
    })
}
else if (command === 'build') {
  import('./build')
    .then(i => i.build(entry, argv))
    .catch((err) => {
      console.error(chalk.red('build error:\n'), err)
      process.exit(1)
    })
}
else if (command === 'export') {
  import('./export')
    .then(i => i.genratePDF(entry, argv))
    .catch((err) => {
      console.error(chalk.red('export error:\n'), err)
      process.exit(1)
    })
}
else if (command === 'format') {
  import('./parser')
    .then(async({ load, prettify, save }) => {
      const data = await load(entry)
      prettify(data)
      await save(data)
    })
    .catch((err) => {
      console.error(chalk.red('export error:\n'), err)
      process.exit(1)
    })
}
else {
  console.log(chalk.red(`unknown command "${command}".`))
  process.exit(1)
}
