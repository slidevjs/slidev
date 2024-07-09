import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import { bold, gray, red, yellow } from 'kolorist'
import { toAtFS } from '../resolver'
import { regexSlideSourceId, templateImportContextUtils, templateInitContext, templateInjectionMarker } from './common'

export function createLayoutWrapperPlugin(
  { data, utils }: ResolvedSlidevOptions,
): Plugin {
  return {
    name: 'slidev:layout-wrapper',
    async transform(code, id) {
      const match = id.match(regexSlideSourceId)
      if (!match)
        return
      const [, no, type] = match
      if (type !== 'md')
        return
      const index = +no - 1
      const layouts = await utils.getLayouts()
      const rawLayoutName = data.slides[index]?.frontmatter?.layout ?? data.slides[0]?.frontmatter?.default?.layout
      let layoutName = rawLayoutName || (index === 0 ? 'cover' : 'default')
      if (!layouts[layoutName]) {
        console.error(red(`\nUnknown layout "${bold(layoutName)}".${yellow(' Available layouts are:')}`)
        + Object.keys(layouts).map((i, idx) => (idx % 3 === 0 ? '\n    ' : '') + gray(i.padEnd(15, ' '))).join('  '))
        console.error()
        layoutName = 'default'
      }

      const imports = [
        `import InjectedLayout from "${toAtFS(layouts[layoutName])}"`,
        templateImportContextUtils,
        templateInitContext,
        templateInjectionMarker,
      ]

      code = code.replace(/(<script setup.*>)/g, `$1\n${imports.join('\n')}\n`)
      const injectA = code.indexOf('<template>') + '<template>'.length
      const injectB = code.lastIndexOf('</template>')
      let body = code.slice(injectA, injectB).trim()
      if (body.startsWith('<div>') && body.endsWith('</div>'))
        body = body.slice(5, -6)
      code = `${code.slice(0, injectA)}\n<InjectedLayout v-bind="_frontmatterToProps($frontmatter,${index})">\n${body}\n</InjectedLayout>\n${code.slice(injectB)}`

      return code
    },
  }
}
