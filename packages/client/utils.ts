import type { SlideRoute } from '@slidev/types'
import type { DirectiveBinding, InjectionKey } from 'vue'
import { configs } from './env'

export function getSlideClass(route?: SlideRoute, extra = '') {
  const classes = ['slidev-page', extra]

  const no = route?.meta?.slide?.no
  if (no != null)
    classes.push(`slidev-page-${no}`)

  return classes.filter(Boolean).join(' ')
}

export async function downloadPDF() {
  const { saveAs } = await import('file-saver')
  saveAs(
    typeof configs.download === 'string'
      ? configs.download
      : configs.exportFilename
        ? `${configs.exportFilename}.pdf`
        : `${import.meta.env.BASE_URL}slidev-exported.pdf`,
    `${configs.title}.pdf`,
  )
}

export function directiveInject<T = unknown>(dir: DirectiveBinding<any>, key: InjectionKey<T> | string, defaultValue?: T): T | undefined {
  return (dir.instance?.$ as any).provides[key as any] ?? defaultValue
}

export function directiveProvide<T = unknown>(dir: DirectiveBinding<any>, key: InjectionKey<T> | string, value?: T) {
  const instance = dir.instance?.$ as any
  if (instance) {
    let provides = instance.provides
    const parentProvides = instance.parent?.provides
    if (provides === parentProvides)
      provides = instance.provides = Object.create(parentProvides)
    provides[key as any] = value
  }
}
