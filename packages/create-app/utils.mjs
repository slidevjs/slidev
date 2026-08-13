/**
 * @param {string | null} packageManager
 */
export function getManualPackageManager(packageManager) {
  return packageManager ?? 'npm'
}

/**
 * @param {string} template
 * @param {string} packageManager
 */
export function renderReadme(template, packageManager) {
  return template
    .replace('npm install', `${packageManager} install`)
    .replace('npm run dev', `${packageManager} run dev`)
}
