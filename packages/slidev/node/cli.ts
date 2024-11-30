import type { ResolvedSlidevOptions, SlidevConfig, SlidevData } from '@slidev/types'
import type { LogLevel, ViteDevServer } from 'vite'
import type { Argv } from 'yargs'
import { exec } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import * as readline from 'node:readline'
import { verifyConfig } from '@slidev/parser'
import equal from 'fast-deep-equal'
import fs from 'fs-extra'
import { getPort } from 'get-port-please'
import { blue, bold, cyan, dim, gray, green, underline, yellow } from 'kolorist'
import openBrowser from 'open'
import yargs from 'yargs'
import { version } from '../package.json'
import { createServer } from './commands/serve'
import { getThemeMeta, resolveTheme } from './integrations/themes'
import { resolveOptions } from './options'
import { parser } from './parser'
import { getRoots, isInstalledGlobally, resolveEntry } from './resolver'
import setupPreparser from './setups/preparser'

const CONFIG_RESTART_FIELDS: (keyof SlidevConfig)[] = [
  'monaco',
  'routerMode',
  'fonts',
  'css',
  'mdc',
  'editor',
  'theme',
]

/**
 * Files that triggers a restart when added or removed
 */
const FILES_CREATE_RESTART = [
  'global-bottom.vue',
  'global-top.vue',
  'uno.config.js',
  'uno.config.ts',
  'unocss.config.js',
  'unocss.config.ts',
]

const FILES_CHANGE_RESTART = [
  'setup/shiki.ts',
  'setup/katex.ts',
  'setup/preparser.ts',
]

setupPreparser()

const cli = yargs(process.argv.slice(2))
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
    .option('remote', {
      type: 'string',
      describe: 'listen public host and enable remote control',
    })
    .option('tunnel', {
      default: false,
      type: 'boolean',
      describe: 'open a Cloudflare Quick Tunnel to make Slidev available on the internet',
    })
    .option('log', {
      default: 'warn',
      type: 'string',
      choices: ['error', 'warn', 'info', 'silent'],
      describe: 'log level',
    })
    .option('inspect', {
      default: false,
      type: 'boolean',
      describe: 'enable the inspect plugin for debugging',
    })
    .option('force', {
      alias: 'f',
      default: false,
      type: 'boolean',
      describe: 'force the optimizer to ignore the cache and re-bundle  ',
    })
    .option('bind', {
      type: 'string',
      default: '0.0.0.0',
      describe: 'specify which IP addresses the server should listen on in remote mode',
    })
    .strict()
    .help(),
  async ({ entry, theme, port: userPort, open, log, remote, tunnel, force, inspect, bind }) => {
    let server: ViteDevServer | undefined
    let port = 3030

    let lastRemoteUrl: string | undefined

    let restartTimer: ReturnType<typeof setTimeout> | undefined
    function restartServer() {
      clearTimeout(restartTimer!)
      restartTimer = setTimeout(() => {
        console.log(yellow('\n  restarting...\n'))
        initServer()
      }, 500)
    }

    async function initServer() {
      if (server)
        await server.close()
      const options = await resolveOptions({ entry, remote, theme, inspect }, 'dev')
      const host = remote !== undefined ? bind : 'localhost'
      port = userPort || await getPort({
        port: 3030,
        random: false,
        portRange: [3030, 4000],
        host,
      })
      server = (await createServer(
        options,
        {
          server: {
            port,
            strictPort: true,
            open,
            host,
            // @ts-expect-error Vite <= 4
            force,
          },
          optimizeDeps: {
            // Vite 5
            force,
          },
          logLevel: log as LogLevel,
        },
        {
          async loadData(loadedSource) {
            const { data: oldData, entry } = options
            const loaded = await parser.load(options.userRoot, entry, loadedSource, 'dev')

            const themeRaw = theme || loaded.headmatter.theme as string || 'default'
            if (options.themeRaw !== themeRaw) {
              console.log(yellow('\n  restarting on theme change\n'))
              restartServer()
              return false
            }
            // Because themeRaw is not changed, we don't resolve it again
            const themeMeta = options.themeRoots[0] ? await getThemeMeta(themeRaw, options.themeRoots[0]) : undefined
            const newData: SlidevData = {
              ...loaded,
              themeMeta,
              config: parser.resolveConfig(loaded.headmatter, themeMeta, entry),
            }

            if (CONFIG_RESTART_FIELDS.some(i => !equal(newData.config[i], oldData.config[i]))) {
              console.log(yellow('\n  restarting on config change\n'))
              restartServer()
              return false
            }

            if ((newData.features.katex && !oldData.features.katex) || (newData.features.monaco && !oldData.features.monaco)) {
              console.log(yellow('\n  restarting on feature change\n'))
              restartServer()
              return false
            }

            return newData
          },
        },
      ))

      await server.listen()

      let tunnelUrl = ''
      if (tunnel) {
        if (remote != null)
          tunnelUrl = await openTunnel(port)
        else
          console.log(yellow('\n  --remote is required for tunneling, Cloudflare Quick Tunnel is not enabled.\n'))
      }

      let publicIp: string | undefined
      if (remote)
        publicIp = await import('public-ip').then(r => r.publicIpv4())

      lastRemoteUrl = printInfo(options, port, remote, tunnelUrl, publicIp)
    }

    async function openTunnel(port: number) {
      const { startTunnel } = await import('untun')
      const tunnel = await startTunnel({
        port,
        acceptCloudflareNotice: true,
      })
      return await tunnel?.getURL() ?? ''
    }

    const SHORTCUTS = [
      {
        name: 'r',
        fullname: 'restart',
        action() {
          initServer()
        },
      },
      {
        name: 'o',
        fullname: 'open',
        action() {
          openBrowser(`http://localhost:${port}`)
        },
      },
      {
        name: 'e',
        fullname: 'edit',
        action() {
          exec(`code "${entry}"`)
        },
      },
      {
        name: 'q',
        fullname: 'quit',
        action() {
          try {
            server?.close()
          }
          finally {
            process.exit()
          }
        },
      },
      {
        name: 'c',
        fullname: 'qrcode',
        async action() {
          if (!lastRemoteUrl)
            return
          await import('uqr')
            .then(async (r) => {
              const code = r.renderUnicodeCompact(lastRemoteUrl!)
              console.log(`\n${dim('  QR Code for remote control: ')}\n  ${blue(lastRemoteUrl!)}\n`)
              console.log(code.split('\n').map(i => `  ${i}`).join('\n'))
              const publicIp = await import('public-ip').then(r => r.publicIpv4())
              if (publicIp)
                console.log(`\n${dim(' Public IP: ')}  ${blue(publicIp)}\n`)
            })
        },
      },
    ]

    function bindShortcut() {
      process.stdin.resume()
      process.stdin.setEncoding('utf8')
      readline.emitKeypressEvents(process.stdin)
      if (process.stdin.isTTY)
        process.stdin.setRawMode(true)

      process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') {
          process.exit()
        }
        else {
          const [sh] = SHORTCUTS.filter(item => item.name === str)
          if (sh) {
            try {
              sh.action()
            }
            catch (err) {
              console.error(`Failed to execute shortcut ${sh.fullname}`, err)
            }
          }
        }
      })
    }

    initServer()
    bindShortcut()

    // Start watcher to restart server on file changes
    const { watch } = await import('chokidar')
    const watcher = watch([
      ...FILES_CREATE_RESTART,
      ...FILES_CHANGE_RESTART,
    ], {
      ignored: ['node_modules', '.git'],
      ignoreInitial: true,
    })
    watcher.on('unlink', (file) => {
      console.log(yellow(`\n  file ${file} removed, restarting...\n`))
      restartServer()
    })
    watcher.on('add', (file) => {
      console.log(yellow(`\n  file ${file} added, restarting...\n`))
      restartServer()
    })
    watcher.on('change', (file) => {
      if (FILES_CREATE_RESTART.includes(file))
        return
      console.log(yellow(`\n  file ${file} changed, restarting...\n`))
      restartServer()
    })
  },
)

cli.command(
  'build [entry..]',
  'Build hostable SPA',
  args => exportOptions(commonOptions(args))
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
    .option('inspect', {
      default: false,
      type: 'boolean',
      describe: 'enable the inspect plugin for debugging',
    })
    .strict()
    .help(),
  async (args) => {
    const { entry, theme, base, download, out, inspect } = args
    const { build } = await import('./commands/build')

    for (const entryFile of entry as unknown as string[]) {
      const options = await resolveOptions({ entry: entryFile, theme, inspect, download }, 'build')

      printInfo(options)
      await build(
        options,
        {
          base,
          build: {
            outDir: entry.length === 1 ? out : path.join(out, path.basename(entryFile, '.md')),
          },
        },
        { ...args, entry: entryFile },
      )
    }
  },
)

cli.command(
  'format [entry..]',
  'Format the markdown file',
  args => commonOptions(args)
    .strict()
    .help(),
  async ({ entry }) => {
    for (const entryFile of entry as unknown as string[]) {
      const md = await parser.parse(await fs.readFile(entryFile, 'utf-8'), entryFile)
      parser.prettify(md)
      await parser.save(md)
    }
  },
)

cli.command(
  'theme [subcommand]',
  'Theme related operations',
  (command) => {
    return command
      .command(
        'eject',
        'Eject current theme into local file system',
        args => commonOptions(args)
          .option('dir', {
            type: 'string',
            default: 'theme',
          }),
        async ({ entry: entryRaw, dir, theme: themeInput }) => {
          const entry = await resolveEntry(entryRaw)
          const roots = await getRoots(entry)
          const data = await parser.load(roots.userRoot, entry)
          let themeRaw = themeInput || data.headmatter.theme as string | null | undefined
          themeRaw = themeRaw === null ? 'none' : (themeRaw || 'default')
          if (themeRaw === 'none') {
            console.error('Cannot eject theme "none"')
            process.exit(1)
          }
          if ('/.'.includes(themeRaw[0]) || (themeRaw[0] !== '@' && themeRaw.includes('/'))) {
            console.error('Theme is already ejected')
            process.exit(1)
          }
          const [name, root] = (await resolveTheme(themeRaw, entry)) as [string, string]

          await fs.copy(root, path.resolve(dir), {
            filter: i => !/node_modules|.git/.test(path.relative(root, i)),
          })

          const dirPath = `./${dir}`
          const firstSlide = data.entry.slides[0]
          firstSlide.frontmatter.theme = dirPath
          parser.prettifySlide(firstSlide)
          await parser.save(data.entry)

          console.log(`Theme "${name}" ejected successfully to "${dirPath}"`)
        },
      )
  },
  () => {
    cli.showHelp()
    process.exit(1)
  },
)

cli.command(
  'export [entry..]',
  'Export slides to PDF',
  args => exportOptions(commonOptions(args))
    .strict()
    .help(),
  async (args) => {
    const { entry, theme } = args
    const { exportSlides, getExportOptions } = await import('./commands/export')
    const port = await getPort(12445)

    for (const entryFile of entry as unknown as string) {
      const options = await resolveOptions({ entry: entryFile, theme }, 'export')
      const server = await createServer(
        options,
        {
          server: { port },
          clearScreen: false,
        },
      )
      await server.listen(port)
      printInfo(options)
      const result = await exportSlides({
        port,
        ...getExportOptions({ ...args, entry: entryFile }, options),
      })
      console.log(`${green('  ✓ ')}${dim('exported to ')}./${result}\n`)
      server.close()
    }

    process.exit(0)
  },
)

cli.command(
  'export-notes [entry..]',
  'Export slide notes to PDF',
  args => args
    .positional('entry', {
      default: 'slides.md',
      type: 'string',
      describe: 'path to the slides markdown entry',
    })
    .option('output', {
      type: 'string',
      describe: 'path to the output',
    })
    .option('timeout', {
      default: 30000,
      type: 'number',
      describe: 'timeout for rendering the print page',
    })
    .option('wait', {
      default: 0,
      type: 'number',
      describe: 'wait for the specified ms before exporting',
    })
    .strict()
    .help(),
  async ({
    entry,
    output,
    timeout,
    wait,
  }) => {
    const { exportNotes } = await import('./commands/export')
    const port = await getPort(12445)

    for (const entryFile of entry as unknown as string[]) {
      const options = await resolveOptions({ entry: entryFile }, 'export')
      const server = await createServer(
        options,
        {
          server: { port },
          clearScreen: false,
        },
      )
      await server.listen(port)

      printInfo(options)

      const result = await exportNotes({
        port,
        output: output || (options.data.config.exportFilename ? `${options.data.config.exportFilename}-notes` : `${path.basename(entryFile, '.md')}-export-notes`),
        timeout,
        wait,
      })
      console.log(`${green('  ✓ ')}${dim('exported to ')}./${result}\n`)

      server.close()
    }

    process.exit(0)
  },
)

cli
  .help()
  .parse()

function commonOptions(args: Argv<object>) {
  return args
    .positional('entry', {
      default: 'slides.md',
      type: 'string',
      describe: 'path to the slides markdown entry',
    })
    .option('theme', {
      alias: 't',
      type: 'string',
      describe: 'override theme',
    })
}

function exportOptions<T>(args: Argv<T>) {
  return args
    .option('output', {
      type: 'string',
      describe: 'path to the output',
    })
    .option('format', {
      type: 'string',
      choices: ['pdf', 'png', 'pptx', 'md'],
      describe: 'output format',
    })
    .option('timeout', {
      type: 'number',
      describe: 'timeout for rendering the print page',
    })
    .option('wait', {
      type: 'number',
      describe: 'wait for the specified ms before exporting',
    })
    .option('wait-until', {
      type: 'string',
      choices: ['networkidle', 'load', 'domcontentloaded', 'none'],
      describe: 'wait until the specified event before exporting each slide',
    })
    .option('range', {
      type: 'string',
      describe: 'page ranges to export, for example "1,4-5,6"',
    })
    .option('dark', {
      type: 'boolean',
      describe: 'export as dark theme',
    })
    .option('with-clicks', {
      alias: 'c',
      type: 'boolean',
      describe: 'export pages for every clicks',
    })
    .option('executable-path', {
      type: 'string',
      describe: 'executable to override playwright bundled browser',
    })
    .option('with-toc', {
      type: 'boolean',
      describe: 'export pages with outline',
    })
    .option('per-slide', {
      type: 'boolean',
      describe: 'slide slides slide by slide. Works better with global components, but will break cross slide links and TOC in PDF',
    })
    .option('scale', {
      type: 'number',
      describe: 'scale factor for image export',
    })
    .option('omit-background', {
      type: 'boolean',
      describe: 'export png pages without the default browser background',
    })
}

function printInfo(
  options: ResolvedSlidevOptions,
  port?: number,
  remote?: string,
  tunnelUrl?: string,
  publicIp?: string,
) {
  console.log()
  console.log()
  console.log(`  ${cyan('●') + blue('■') + yellow('▲')}`)
  console.log(`${bold('  Slidev')}  ${blue(`v${version}`)} ${isInstalledGlobally.value ? yellow('(global)') : ''}`)
  console.log()

  verifyConfig(options.data.config, options.data.themeMeta, v => console.warn(yellow(`  ! ${v}`)))

  console.log(dim('  theme       ') + (options.theme ? green(options.theme) : gray('none')))
  console.log(dim('  css engine  ') + blue('unocss'))
  console.log(dim('  entry       ') + dim(path.normalize(path.dirname(options.entry)) + path.sep) + path.basename(options.entry))

  if (port) {
    const query = remote ? `?password=${remote}` : ''
    const presenterPath = `${options.data.config.routerMode === 'hash' ? '/#/' : '/'}presenter/${query}`
    const entryPath = `${options.data.config.routerMode === 'hash' ? '/#/' : '/'}entry${query}/`
    const overviewPath = `${options.data.config.routerMode === 'hash' ? '/#/' : '/'}overview${query}/`
    console.log()
    console.log(`${dim('  public slide show ')}  > ${cyan(`http://localhost:${bold(port)}/`)}`)
    if (query)
      console.log(`${dim('  private slide show ')} > ${cyan(`http://localhost:${bold(port)}/${query}`)}`)
    console.log(`${dim('  presenter mode ')}     > ${blue(`http://localhost:${bold(port)}${presenterPath}`)}`)
    console.log(`${dim('  slides overview ')}    > ${blue(`http://localhost:${bold(port)}${overviewPath}`)}`)
    if (options.inspect)
      console.log(`${dim('  vite inspector')}      > ${yellow(`http://localhost:${bold(port)}/__inspect/`)}`)

    let lastRemoteUrl = ''

    if (remote !== undefined) {
      Object.values(os.networkInterfaces())
        .forEach(v => (v || [])
          .filter(details => String(details.family).slice(-1) === '4' && !details.address.includes('127.0.0.1'))
          .forEach(({ address }) => {
            lastRemoteUrl = `http://${address}:${port}${entryPath}`
            console.log(`${dim('  remote control ')}     > ${blue(lastRemoteUrl)}`)
          }))

      if (publicIp) {
        lastRemoteUrl = `http://${publicIp}:${port}${entryPath}`
        console.log(`${dim('  remote control ')}     > ${blue(lastRemoteUrl)}`)
      }

      if (tunnelUrl) {
        lastRemoteUrl = `${tunnelUrl}${entryPath}`
        console.log(`${dim('  remote via tunnel')}   > ${yellow(lastRemoteUrl)}`)
      }
    }
    else {
      console.log(`${dim('  remote control ')}     > ${dim('pass --remote to enable')}`)
    }

    console.log()
    console.log(`${dim('  shortcuts ')}          > ${underline('r')}${dim('estart | ')}${underline('o')}${dim('pen | ')}${underline('e')}${dim('dit | ')}${underline('q')}${dim('uit')}${lastRemoteUrl ? ` | ${dim('qr')}${underline('c')}${dim('ode')}` : ''}`)

    return lastRemoteUrl
  }
}
