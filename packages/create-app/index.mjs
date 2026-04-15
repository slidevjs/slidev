#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
// @ts-check
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { blue, bold, cyan, dim, green, yellow } from 'ansis'
import minimist from 'minimist'
import prompts from 'prompts'
import { x } from 'tinyexec'

const argv = minimist(process.argv.slice(2))
const cwd = process.cwd()
const require = createRequire(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const { version } = require('./package.json')

const RE_PNPM = /pnpm/
const RE_YARN = /yarn/
const RE_VALID_PACKAGE_NAME = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/
const RE_WHITESPACE = /\s+/g
const RE_LEADING_DOT_UNDERSCORE = /^[._]/
const RE_NON_ALPHANUMERIC = /[^a-z0-9-~]+/g

const renameFiles = {
  _gitignore: '.gitignore',
  _npmrc: '.npmrc',
}

async function init() {
  console.log()
  console.log(`  ${cyan('●') + blue('■') + yellow('▲')}`)
  console.log(`${bold('  Slidev') + dim(' Creator')}  ${blue(`v${version}`)}`)
  console.log()

  let targetDir = argv._[0]
  if (!targetDir) {
    /**
     * @type {{ projectName: string }}
     */
    const { projectName } = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'slidev',
    })
    targetDir = projectName.trim()
  }
  const packageName = await getValidPackageName(targetDir)
  const root = path.join(cwd, targetDir)

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  }
  else {
    const existing = fs.readdirSync(root)
    if (existing.length) {
      console.log(yellow(`  Target directory "${targetDir}" is not empty.`))
      /**
       * @type {{ yes: boolean }}
       */
      const { yes } = await prompts({
        type: 'confirm',
        name: 'yes',
        initial: 'Y',
        message: 'Remove existing files and continue?',
      })
      if (yes)
        emptyDir(root)

      else
        return
    }
  }

  console.log(dim('  Scaffolding project in ') + targetDir + dim(' ...'))

  const templateDir = path.join(__dirname, 'template')

  const write = (file, content) => {
    const targetPath = renameFiles[file]
      ? path.join(root, renameFiles[file])
      : path.join(root, file)
    if (content)
      fs.writeFileSync(targetPath, content)

    else
      copy(path.join(templateDir, file), targetPath)
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter(f => f !== 'package.json' && f !== 'README.md'))
    write(file)

  const pkg = require(path.join(templateDir, 'package.json'))

  pkg.name = packageName

  write('package.json', JSON.stringify(pkg, null, 2))

  const userAgent = process.env.npm_config_user_agent || ''
  const execPath = process.env.npm_execpath || ''
  const pkgManager = typeof Deno !== 'undefined'
    ? 'deno'
    : typeof Bun !== 'undefined'
      ? 'bun'
      : (RE_PNPM.test(execPath) || RE_PNPM.test(userAgent))
          ? 'pnpm'
          : RE_YARN.test(execPath) || RE_YARN.test(userAgent)
            ? 'yarn'
            : 'npm'

  const related = path.relative(cwd, root)

  console.log(green('  Done.\n'))

  /**
   * @type {{ yes: boolean }}
   */
  const { yes } = await prompts({
    type: 'confirm',
    name: 'yes',
    initial: 'Y',
    message: 'Install and start it now?',
  })

  if (yes) {
    const { agent } = await prompts({
      name: 'agent',
      type: 'select',
      message: 'Choose the package manager',
      choices: ['npm', 'yarn', 'pnpm', 'bun', 'deno'].map(i => ({ value: i, title: i })),
    })

    if (!agent)
      return

    writeReadme(agent)
    await x(agent, ['install'], { nodeOptions: { stdio: 'inherit', cwd: root } })
    await x(agent, ['run', 'dev'], { nodeOptions: { stdio: 'inherit', cwd: root } })
  }
  else {
    writeReadme(pkgManager)
    console.log(dim('\n  start it later by:\n'))
    if (root !== cwd)
      console.log(blue(`  cd ${bold(related)}`))

    console.log(blue(`  ${pkgManager} install`))
    console.log(blue(`  ${pkgManager} run dev`))
    console.log()
    console.log(`  ${cyan('●')} ${blue('■')} ${yellow('▲')}`)
    console.log()
  }

  function writeReadme(pm) {
    const readmeTemplate = fs.readFileSync(path.join(templateDir, 'README.md'), 'utf-8')
    const readmeContent = readmeTemplate
      .replace('{{PM_INSTALL}}', `${pm} install`)
      .replace('{{PM_DEV}}', `${pm} run dev`)
    write('README.md', readmeContent)
  }
}

function copy(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory())
    copyDir(src, dest)

  else
    fs.copyFileSync(src, dest)
}

async function getValidPackageName(projectName) {
  projectName = path.basename(projectName)
  const packageNameRegExp = RE_VALID_PACKAGE_NAME
  if (packageNameRegExp.test(projectName)) {
    return projectName
  }
  else {
    const suggestedPackageName = projectName
      .trim()
      .toLowerCase()
      .replace(RE_WHITESPACE, '-')
      .replace(RE_LEADING_DOT_UNDERSCORE, '')
      .replace(RE_NON_ALPHANUMERIC, '-')

    /**
     * @type {{ inputPackageName: string }}
     */
    const { inputPackageName } = await prompts({
      type: 'text',
      name: 'inputPackageName',
      message: 'Package name:',
      initial: suggestedPackageName,
      validate: input => packageNameRegExp.test(input) ? true : 'Invalid package.json name',
    })
    return inputPackageName
  }
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function emptyDir(dir) {
  if (!fs.existsSync(dir))
    return

  for (const file of fs.readdirSync(dir)) {
    const abs = path.resolve(dir, file)
    // baseline is Node 12 so can't use rmSync :(
    if (fs.lstatSync(abs).isDirectory()) {
      emptyDir(abs)
      fs.rmdirSync(abs)
    }
    else {
      fs.unlinkSync(abs)
    }
  }
}

init().catch((e) => {
  console.error(e)
})
