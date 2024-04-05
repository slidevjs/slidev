import { encode as encodePlantUml } from 'plantuml-encoder'
import type { MarkdownTransformContext } from '@slidev/types'

export function transformPlantUml(ctx: MarkdownTransformContext, server: string) {
  ctx.s.replace(/^```plantuml\s*?({.*?})?\n([\s\S]+?)\n```/mg, (full, options = '', content = '', index: number) => {
    const code = encodePlantUml(content.trim())
    options = options.trim() || '{}'
    ctx.ignores.push([index, index + full.length])
    return `<PlantUml :code="'${code}'" :server="'${server}'" v-bind="${options}" />`
  })
}
