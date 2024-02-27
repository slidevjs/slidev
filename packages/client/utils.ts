import type { RouteRecordRaw } from 'vue-router'
import * as _lz from 'lz-string'

// @ts-expect-error compat
export const lz: typeof _lz = _lz.default ?? ('compress' in _lz ? _lz : globalThis.LZString)

export function getSlideClass(route?: RouteRecordRaw, extra = '') {
  const classes = ['slidev-page', extra]

  const no = route?.meta?.slide?.no
  if (no != null)
    classes.push(`slidev-page-${no}`)

  return classes.filter(Boolean).join(' ')
}
