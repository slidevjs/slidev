#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
// @ts-check
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { blue, bold, cyan, dim, green, yellow } from 'kolorist'
import minimist from 'minimist'
import prompts from 'prompts'

const argv = minimist(process.argv.slice(2))
const cwd = process.cwd()
const require = createRequire(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const { version } = require('./package.json')

const renameFiles = {
  _gitignore: '.gitignore',
  _npmrc: '.npmrc',
}

async function init() {
  console.log()
  console.log(`  ${cyan('●') + blue('■') + yellow('▲')}`)
  console.log(`${bold('  Slidev') + dim(' Theme Creator')}  ${blue(`v${version}`)}`)
  console.log()

  let targetDir = argv._[0]
  if (!targetDir) {
    /**
     * @type {{ name: string }}
     */
    const { name } = await prompts({
      type: 'text',
      name: 'name',
      message: 'Theme name:',
      initial: 'slidev-theme-starter',
    })
    targetDir = name
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

  console.log(dim('  Scaffolding Slidev theme in ') + targetDir + dim(' ...'))

  prepareTemplate(root, path.join(__dirname, 'template'), packageName)

  const pkgManager = (/pnpm/.test(process.env.npm_execpath) || /pnpm/.test(process.env.npm_config_user_agent))
    ? 'pnpm'
    : /yarn/.test(process.env.npm_execpath) ? 'yarn' : 'npm'

  const related = path.relative(cwd, root)

  console.log(green('  Done.\n'))

  console.log(dim('\n  start it by:\n'))
  if (root !== cwd)
    console.log(blue(`  cd ${bold(related)}`))

  console.log(blue(`  ${pkgManager === 'yarn' ? 'yarn' : `${pkgManager} install`}`))
  console.log(blue(`  ${pkgManager === 'yarn' ? 'yarn dev' : `${pkgManager} run dev`}`))
  console.log()
  console.log(`  ${cyan('●')} ${blue('■')} ${yellow('▲')}`)
  console.log()
}

function prepareTemplate(root, templateDir, packageName) {
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
  for (const file of files.filter(f => !['package.json', 'README.md'].includes(f)))
    write(file)

  write(
    'package.json',
    JSON.stringify({
      name: packageName,
      version: '0.0.0',
      ...require(path.join(templateDir, 'package.json')),
    }, null, 2),
  )

  write(
    'README.md',
    fs
      .readFileSync(path.join(templateDir, 'README.md'), 'utf-8')
      .replace(/\{\{package-name\}\}/g, packageName)
      .replace(/\{\{name\}\}/g, getThemeName(packageName)),
  )
}

function copy(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory())
    copyDir(src, dest)

  else
    fs.copyFileSync(src, dest)
}

function getValidPackageName(projectName) {
  projectName = path.basename(projectName)
  if (!projectName.startsWith('slidev-theme-'))
    return `slidev-theme-${projectName}`
  return projectName
}

function getThemeName(pkgName) {
  return pkgName.replace(/^slidev-theme-/, '')
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
