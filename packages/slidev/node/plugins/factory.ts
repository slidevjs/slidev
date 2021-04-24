import type { Plugin } from 'vite'
import { kebabCase } from 'vite-plugin-components'

const PREFIX = '/@vue-factory/'
const SUFFIX = '/compose.vue'

export function VueFactoryResolver(name: string) {
  name = kebabCase(name).replace(/(\d+)/g, '-$1')
  const prefixes = ['grid', 'flex', 'text', 'font', 'opacity']
  for (const pre of prefixes) {
    if (name === pre || name.startsWith(`${pre}-`)) {
      const classes = [name]
      if (name !== pre)
        classes.push(pre)
      return `/@vue-factory/class=${classes.join(',')}/compose.vue`
    }
  }
}

export function VitePluginVueFactory(): Plugin {
  let windi: any

  return {
    name: 'vite-plugin-vue-factory',
    configResolved(config) {
      windi = config.plugins.find(i => i.name === 'vite-plugin-windicss')
    },
    resolveId(id) {
      return id.startsWith(PREFIX) ? id : null
    },
    load(id) {
      if (!id.startsWith(PREFIX))
        return

      const data = id.slice(PREFIX.length, -SUFFIX.length)
      const params = new URLSearchParams(data)

      const classes = (params.get('class') || '').split(',').join(' ')
      const tag = params.get('tag') || 'div'

      console.log({ classes, tag })

      const content = `<template><${tag} class="${classes}"><slot/></${tag}></template>`

      console.log(windi?.api)

      windi?.api?.extractFile(content)

      return content
    },
  }
}

export default VitePluginVueFactory
