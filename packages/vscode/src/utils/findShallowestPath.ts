export function findShallowestPath(paths: Iterable<string>) {
  let result: string | undefined
  let minSlashes = Number.POSITIVE_INFINITY
  for (const path of paths) {
    const slashes = [...path.matchAll(/\//g)].length
    if (slashes < minSlashes) {
      minSlashes = slashes
      result = path
    }
  }
  return result
}
