import type { MarkdownTransformContext } from '@slidev/types'
import { encode as encodePlantUml } from 'plantuml-encoder'

export function transformPlantUml(ctx: MarkdownTransformContext) {
  const server = ctx.options.data.config.plantUmlServer
  ctx.s.replace(
    /^```plantuml[^\n{}]*(\{[^}\n]*\})?\n([\s\S]+?)\n```/gm,
    (full, options = '', content = '') => {
      const code = encodePlantUml(content.trim())
      options = options.trim() || '{}'
      return `<PlantUml :code="'${code}'" :server="'${server}'" v-bind="${options}" />`
    },
  )
}
