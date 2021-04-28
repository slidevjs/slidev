import { run } from './run'

const PACKAGE_NAME = 'chromium'
const PACKAGE_MANAGERS = [
  {
    name: 'npm',
    installCommand: 'install',
  },
  {
    name: 'yarn',
    installCommand: 'add',
  },
]

export const getChromiumPath = () => {
  try {
    delete require.cache[require.resolve(PACKAGE_NAME)]
  }
  catch (error) {}

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { path } = require(PACKAGE_NAME)
  return path
}

export const installChromium = async(runTask, packageManagerName) => {
  const packageManager = PACKAGE_MANAGERS.find(packageManager => packageManager.name === packageManagerName)

  if (!packageManager)
    throw new Error(`Invalid package manager: ${packageManagerName} (available package managers: ${PACKAGE_MANAGERS.map(packageManager => packageManager.name).join(', ')})`)

  const installCommand = `${packageManager.name} ${packageManager.installCommand} ${PACKAGE_NAME}`
  await runTask(installCommand)
}

let chromiumPath

try {
  chromiumPath = getChromiumPath()
}
catch (requireError) {
  console.log('Chromium is not available, attempting to download')
  run(`npx ni -D ${PACKAGE_NAME}`)
  chromiumPath = getChromiumPath()
}

process.env.CHROME_PATH = chromiumPath
