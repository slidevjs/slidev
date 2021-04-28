import path from 'path'
import fs from 'fs-extra'
import yargs, { Argv } from 'yargs'
import { prompt } from 'enquirer'
import { blue, bold, cyan, dim, green, yellow } from 'kolorist'
import { LogLevel, ViteDevServer } from 'vite'
import { version } from '../package.json'
import { build } from './build'
import { createServer } from './server'
import * as parser from './parser'
import { ResolvedSlidevOptions, resolveOptions } from './plugins/options'
import { resolveThemeName } from './themes'

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
    .option('log', {
      default: 'warn',
      type: 'string',
      choices: ['error', 'warn', 'info', 'silent'],
      describe: 'log level',
    })
    .help(),
  async({ entry, theme, port, open, log }) => {
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
      const options = await resolveOptions({ entry, theme }, 'dev')
      server = (await createServer(
        options,
        {
          onDataReload(newData, data) {
            if (!theme && resolveThemeName(newData.config.theme) !== resolveThemeName(data.config.theme)) {
              console.log(yellow('\n  restarting on theme change\n'))
              initServer()
            }
            else if (newData.config.monaco !== data.config.monaco) {
              console.log(yellow('\n  restarting on config change\n'))
              initServer()
            }
          },
        },
        {
          server: {
            port,
            open,
          },
          logLevel: log as LogLevel,
        },
      ))
      await server.listen()
      printInfo(options, port)
    }

    initServer()
  },
)

cli.command(
  'build [entry]',
  'Build hostable SPA',
  args => commonOptions(args)
    .option('watch', {
      alias: 'w',
      default: false,
      describe: 'build watch',
    })
    .option('base', {
      type: 'string',
      describe: 'output base',
    })
    .help(),
  async({ entry, theme, watch, base }) => {
    console.log(yellow('  [Slidev] the SPA build is experimental, recommend to use dev server instead at this moment.'))

    const options = await resolveOptions({ entry, theme }, 'build')
    printInfo(options)
    await build(options, {}, {
      base,
      build: {
        watch: watch ? {} : undefined,
      },
    })
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
    .option('range', {
      type: 'string',
      describe: 'page ranges to export, for example "1,4-5,6"',
    })
    .help(),
  async({
    entry,
    theme,
    output,
    format,
    timeout,
    range,
  }) => {
    output = output || `${path.basename(entry, '.md')}-export`
    process.env.NODE_ENV = 'production'
    const { exportSlides } = await import('./export')
    const port = 12445
    const options = await resolveOptions({ entry, theme }, 'build')
    const server = await createServer(
      options,
      {},
      {
        server: { port },
        logLevel: 'error',
        clearScreen: false,
      },
    )
    await server.listen()
    printInfo(options)
    parser.filterDisabled(options.data)
    output = await exportSlides({
      port,
      total: options.data.slides.length,
      range,
      format: format as any,
      output,
      timeout,
    })
    console.log(`${green('  ✓ ')}${dim('exported to ')}./${output}\n`)
    server.close()
    process.exit(0)
  },
)

cli.help().parse()

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

function printInfo(options: ResolvedSlidevOptions, port?: number) {
  console.log()
  console.log()
  console.log(`  ${cyan('●') + blue('■') + yellow('▲')}`)
  console.log(`${bold('  Slidev')}  ${blue(`v${version}`)}`)
  console.log()
  console.log(dim('  theme   ') + green(options.theme))
  console.log(dim('  entry   ') + dim(path.dirname(options.entry) + path.sep) + path.basename(options.entry))
  if (port) {
    console.log()
    console.log(`${dim('  presenter mode ')} > ${blue(`http://localhost:${bold(port)}/presenter`)}`)
    console.log(`${dim('  slide show     ')} > ${cyan(`http://localhost:${bold(port)}/`)}`)
  }
  console.log()
  console.log()
}
