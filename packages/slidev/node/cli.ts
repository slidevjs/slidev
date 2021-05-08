import path from 'path'
import http from 'http'
import os from 'os'
import fs from 'fs-extra'
import yargs, { Argv } from 'yargs'
import prompts from 'prompts'
import { blue, bold, cyan, dim, green, yellow } from 'kolorist'
import { LogLevel, ViteDevServer } from 'vite'
import * as parser from '@slidev/parser/fs'
import { version } from '../package.json'
import { createServer } from './server'
import { ResolvedSlidevOptions, resolveOptions } from './options'
import { resolveThemeName } from './themes'

const cli = yargs
  .scriptName('slidev')
  .usage('$0 [args]')
  .version(version)
  .strict()
  .showHelpOnFail(false)
  .alias('h', 'help')
  .alias('v', 'version')

cli.command(
  '* [entry]',
  'Start a local server for Slidev',
  args => commonOptions(args)
    .option('port', {
      alias: 'p',
      type: 'number',
      describe: 'port',
    })
    .option('open', {
      alias: 'o',
      default: false,
      type: 'boolean',
      describe: 'open in browser',
    })
    .option('log', {
      default: 'warn',
      type: 'string',
      choices: ['error', 'warn', 'info', 'silent'],
      describe: 'log level',
    })
    .strict()
    .help(),
  async({ entry, theme, port, open, log }) => {
    if (!fs.existsSync(entry) && !entry.endsWith('.md'))
      entry = `${entry}.md`

    if (!fs.existsSync(entry)) {
      const { create } = await prompts({
        name: 'create',
        type: 'confirm',
        initial: 'Y',
        message: `Entry file ${yellow(`"${entry}"`)} does not exist, do you want to create it?`,
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
      port = port || await findFreePort(3030)
      server = (await createServer(
        options,
        {
          onDataReload(newData, data) {
            if (!theme && resolveThemeName(newData.config.theme) !== resolveThemeName(data.config.theme)) {
              console.log(yellow('\n  restarting on theme change\n'))
              initServer()
            }
            else if (newData.config.monaco !== data.config.monaco || newData.config.highlighter !== data.config.highlighter) {
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
    .option('out', {
      alias: 'o',
      type: 'string',
      default: 'dist',
      describe: 'output dir',
    })
    .option('base', {
      type: 'string',
      describe: 'output base',
    })
    .option('download', {
      alias: 'd',
      type: 'boolean',
      describe: 'allow download as PDF',
    })
    .strict()
    .help(),
  async({ entry, theme, watch, base, download, out }) => {
    const { build } = await import('./build')

    const options = await resolveOptions({ entry, theme }, 'build')
    if (download && !options.data.config.download)
      options.data.config.download = download

    printInfo(options)
    await build(options, {}, {
      base,
      build: {
        watch: watch ? {} : undefined,
        outDir: out,
      },
    })
  },
)

cli.command(
  'format [entry]',
  'Format the markdown file',
  args => commonOptions(args)
    .strict()
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
    .strict()
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
    const port = await findFreePort(12445)
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
    await server.listen(port)
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

cli
  .help()
  .parse()

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
    console.log(`${dim('  slide show     ')} > ${cyan(`http://localhost:${bold(port)}/`)}`)
    console.log(`${dim('  presenter mode ')} > ${blue(`http://localhost:${bold(port)}/presenter`)}`)

    Object.values(os.networkInterfaces())
      .forEach(v => (v || [])
        .filter(details => details.family === 'IPv4' && !details.address.includes('127.0.0.1'))
        .forEach(({ address }) => {
          console.log(`${dim('  remote control ')} > ${blue(`http://${address}:${port}/presenter`)}`)
        }),
      )
  }
  console.log()
  console.log()
}

function isPortFree(port: number) {
  return new Promise((resolve) => {
    const server = http.createServer()
      .listen(port, () => {
        server.close()
        resolve(true)
      })
      .on('error', () => {
        resolve(false)
      })
  })
}

async function findFreePort(start: number): Promise<number> {
  if (await isPortFree(start))
    return start
  return findFreePort(start + 1)
}
