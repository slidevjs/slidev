import { run } from './run'

const PACKAGE_NAME = 'chromium'

export const getChromiumPath = () => {
  try {
    delete require.cache[PACKAGE_NAME]
    delete require.cache[require.resolve(PACKAGE_NAME)]
  }
  catch (error) {}
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { path } = require(PACKAGE_NAME)
  return path
}

let chromiumPath

try {
  chromiumPath = getChromiumPath()
  console.log(`Chromium path: ${chromiumPath}`)
}
catch (requireError) {
  console.log('Chromium is not available, attempting to download')
  run(`npx pnpm i --store=node_modules/.pnpm-store -D ${PACKAGE_NAME}`)
  chromiumPath = getChromiumPath()
  console.log(`Chromium path: ${chromiumPath}`)
}

process.env.CHROME_PATH = chromiumPath
