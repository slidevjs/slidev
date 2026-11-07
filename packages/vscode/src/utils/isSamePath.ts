const windowsAbsolutePathRE = /^[A-Z]:[\\/]/i

export function isSamePath(a: string, b: string) {
  if (!windowsAbsolutePathRE.test(a) || !windowsAbsolutePathRE.test(b))
    return a === b

  return a.replaceAll('\\', '/').toLowerCase() === b.replaceAll('\\', '/').toLowerCase()
}
