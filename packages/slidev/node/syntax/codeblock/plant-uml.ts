import { defineCodeblockTransformer } from '@slidev/types'
import { encode as encodePlantUml } from 'plantuml-encoder'

const RE_PLANT_UML = /^plantuml\s*(\{[^\n]*\})?/

export default defineCodeblockTransformer(async ({ info, code, options: { data: { config: { plantUmlServer } } } }) => {
  const match = info.match(RE_PLANT_UML)
  if (!match)
    return
  const [, options] = match
  const optionsProp = options ? `v-bind="${options}"` : ''
  const encoded = encodePlantUml(code.trim())
  return `<PlantUml ${optionsProp} code="${encoded}" server=${JSON.stringify(plantUmlServer)} />`
})
