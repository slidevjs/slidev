import { encode as encodePlantUml } from 'plantuml-encoder'
import type { MarkdownTransformContext } from '@slidev/types'

export function transformPlantUml(ctx: MarkdownTransformContext) {
  const server = ctx.options.data.config.plantUmlServer
  ctx.s.replace(/^```plantuml\s*?({.*?})?\n([\s\S]+?)\n```/mg, (full, options = '', content = '') => {
    const code = encodePlantUml(content.trim())
    options = options.trim() || '{}'
    return `<PlantUml :code="'${code}'" :server="'${server}'" v-bind="${options}" />`
  })
}
