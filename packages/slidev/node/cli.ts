import path from 'path'
import fs from 'fs-extra'
import yargs, { Argv } from 'yargs'
import { prompt } from 'enquirer'
import { blue } from 'kolorist'
import { version } from '../package.json'
import { build } from './build'
import { createServer } from './server'
import * as parser from './parser'

function commonOptions(args: Argv<{}>) {
  return args
    .positional('entry', {
      default: 'slides.md',
      type: 'string',
      describe: 'path to the slides markdown entry',
    })
    .option('template', {
      alias: 't',
      type: 'string',
      describe: 'overide theme',
    })
}

const cli = yargs
  .scriptName('slidev')
  .usage('$0 [args]')
  .version(version)
  .showHelpOnFail(false)
  .alias('h', 'help')
  .alias('v', 'version')

cli.command(
  '* [entry]',
  'Start a local server for Slidev',
  args => commonOptions(args)
    .option('port', {
      alias: 'p',
      default: 3030,
      type: 'number',
      describe: 'port',
    })
    .option('open', {
      alias: 'o',
      default: true,
      type: 'boolean',
      describe: 'open in browser',
    })
    .help(),
  async({ entry, port, open }) => {
    if (!fs.existsSync(entry)) {
      const { create } = await prompt<{create: boolean}>({
        name: 'create',
        type: 'confirm',
        message: `Entry file ${entry} does not exist, do you want to create it?`,
      })
      if (create)
        await fs.copyFile(path.resolve(__dirname, '../template.md'), entry)
      else
        process.exit(0)
    }

    const server = await createServer(entry, {
      server: {
        port,
        open,
      },
    })
    server.listen()
    server.watcher.add(entry)
  },
)

cli.command(
  'build [entry]',
  'Build hostable SPA',
  args => commonOptions(args)
    .help(),
  async({ entry }) => {
    await build(entry)
  },
)

cli.command(
  'format [entry]',
  'Format the markdown file',
  args => commonOptions(args)
    .help(),
  async({ entry }) => {
    const data = await parser.load(entry)
    parser.prettify(data)
    await parser.save(data)
  },
)

cli.command(
  'export [entry]',
  'Export slides to PDF',
  args => commonOptions(args)
    .option('output', {
      type: 'string',
      describe: 'path to the the port output',
    })
    .help(),
  async({ entry, output }) => {
    output = output || `${path.basename(entry, '.md')}.pdf`
    process.env.NODE_ENV = 'production'
    const { genratePDF } = await import('./export')
    await genratePDF(entry, output, { logLevel: 'error' })
    console.log(blue(`PDF Exported: ./${output}`))
    process.exit(0)
  },
)

cli.help().parse()
