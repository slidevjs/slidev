#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

// @ts-check
const fs = require('fs')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const { prompt } = require('enquirer')
const execa = require('execa')

const cwd = process.cwd()

const renameFiles = {
  _gitignore: '.gitignore',
  _npmrc: '.npmrc',
}

async function init() {
  let targetDir = argv._[0]
  if (!targetDir) {
    /**
     * @type {{ projectName: string }}
     */
    const { projectName } = await prompt({
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      initial: 'slidev',
    })
    targetDir = projectName
  }
  const packageName = await getValidPackageName(targetDir)
  const root = path.join(cwd, targetDir)
  console.log(`\nScaffolding project in ${root}...`)

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  }
  else {
    const existing = fs.readdirSync(root)
    if (existing.length) {
      /**
       * @type {{ yes: boolean }}
       */
      const { yes } = await prompt({
        type: 'confirm',
        name: 'yes',
        initial: 'Y',
        message:
          `Target directory ${targetDir} is not empty.\n`
          + 'Remove existing files and continue?',
      })
      if (yes)
        emptyDir(root)

      else
        return
    }
  }

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
  for (const file of files.filter(f => f !== 'package.json'))
    write(file)

  const pkg = require(path.join(templateDir, 'package.json'))

  pkg.name = packageName

  write('package.json', JSON.stringify(pkg, null, 2))

  const pkgManager = /pnpm/.test(process.env.npm_execpath)
    ? 'pnpm'
    : /yarn/.test(process.env.npm_execpath) ? 'yarn' : 'npm'

  const related = path.relative(cwd, root)

  /**
   * @type {{ yes: boolean }}
   */
  const { yes } = await prompt({
    type: 'confirm',
    name: 'yes',
    initial: 'Y',
    message: 'Done. Do you want to install the dependency and start the server now?',
  })

  if (yes) {
    await execa(pkgManager, ['-C', related, 'install'], { stdio: 'inherit' })
    await execa(pkgManager, ['-C', related, 'run', 'dev'], { stdio: 'inherit' })
  }
  else {
    console.log('\nNow run:\n')
    if (root !== cwd)
      console.log(`  cd ${related}`)

    console.log(`  ${pkgManager === 'yarn' ? 'yarn' : `${pkgManager} install`}`)
    console.log(`  ${pkgManager === 'yarn' ? 'yarn dev' : `${pkgManager} run dev`}`)
    console.log()
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
  const packageNameRegExp = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/
  if (packageNameRegExp.test(projectName)) {
    return projectName
  }
  else {
    const suggestedPackageName = projectName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/^[._]/, '')
      .replace(/[^a-z0-9-~]+/g, '-')

    /**
     * @type {{ inputPackageName: string }}
     */
    const { inputPackageName } = await prompt({
      type: 'input',
      name: 'inputPackageName',
      message: 'Package name:',
      initial: suggestedPackageName,
      validate: input =>
        packageNameRegExp.test(input) ? true : 'Invalid package.json name',
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
