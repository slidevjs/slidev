import { encode as encodePlantUml } from 'plantuml-encoder'

export function transformPlantUml(md: string, server: string): string {
  return md
    .replace(/^```plantuml\s*?({.*?})?\n([\s\S]+?)\n```/mg, (full, options = '', content = '') => {
      const code = encodePlantUml(content.trim())
      options = options.trim() || '{}'
      return `<PlantUml :code="'${code}'" :server="'${server}'" v-bind="${options}" />`
    })
}
