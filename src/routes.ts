import { objectMap } from '@antfu/utils'
import { Component, createBlock, createVNode, defineComponent, withCtx } from 'vue'
import { RouteRecordRaw } from 'vue-router'
// @ts-expect-error
import generatedRoutes from '/@vite-slides/routes'

export const layouts = objectMap(
  import.meta.globEager('./layouts/*.vue'),
  (k, v) => [k.split(/[\\\/]/g).slice(-1)[0].replace(/\.\w+$/, ''), v.default as Component],
)

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: { path: '/0' } },
  ...generatedRoutes.map((i: RouteRecordRaw) => {
    const component = i.component!
    let layoutName = (i.meta?.layout || 'default') as string
    let layout = layouts[layoutName]
    if (!layout) {
      console.warn(`unknown layout name ${layoutName}`)
      layout = layouts.default
      layoutName = 'default'
    }
    i.component = defineComponent({
      name: `layout-${layoutName}`,
      render: () => createBlock(layout, null, { default: withCtx(() => [createVNode(component)]), _: 1 }),
      __file: layout.__file,
    })
    return i
  }),
]
