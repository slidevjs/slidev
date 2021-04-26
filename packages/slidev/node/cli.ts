import path from 'path'
import fs from 'fs-extra'
import yargs, { Argv } from 'yargs'
import { prompt } from 'enquirer'
import { green, yellow } from 'kolorist'
import { ViteDevServer } from 'vite'
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
    .option('theme', {
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
  async({ entry, theme, port, open }) => {
    if (!fs.existsSync(entry)) {
      const { create } = await prompt<{create: boolean}>({
        name: 'create',
        type: 'confirm',
        initial: 'Y',
        message: `Entry file ${entry} does not exist, do you want to create it?`,
      })
      if (create)
        await fs.copyFile(path.resolve(__dirname, '../template.md'), entry)
      else
        process.exit(0)
    }

    let server: ViteDevServer | undefined

    async function initServer() {
      if (server)
        await server.close()
      server = (await createServer(
        {
          entry,
          theme,
        },
        {
          onDataReload(newData, data) {
            if (!theme && newData.config.theme !== data.config.theme) {
              console.log(yellow('Slidev reloaded on theme change'))
              initServer()
            }
          },
        },
        {
          server: {
            port,
            open,
          },
        },
      )).server
      await server.listen()
    }

    initServer()
  },
)

cli.command(
  'build [entry]',
  'Build hostable SPA',
  args => commonOptions(args)
    .help(),
  async(args) => {
    await build(args)
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
    .option('format', {
      default: 'pdf',
      type: 'string',
      choices: ['pdf', 'png'],
      describe: 'output format',
    })
    .option('timeout', {
      default: 100,
      type: 'number',
      describe: 'timeout for rendering each page',
    })
    .help(),
  async({
    entry,
    theme,
    output,
    format,
    timeout,
  }) => {
    output = output || `${path.basename(entry, '.md')}-export`
    process.env.NODE_ENV = 'production'
    const { exportSlides } = await import('./export')
    const port = 12445
    const { server, resolved } = await createServer(
      { entry, theme },
      {},
      {
        server: { port },
        logLevel: 'error',
        clearScreen: true,
      },
    )
    await server.listen()
    parser.filterDisabled(resolved.data)
    output = await exportSlides({
      port,
      pages: resolved.data.slides.length,
      format: format as any,
      output,
      timeout,
    })
    console.log(green(`Exported: ./${output}`))
    server.close()
    process.exit(0)
  },
)

cli.help().parse()
