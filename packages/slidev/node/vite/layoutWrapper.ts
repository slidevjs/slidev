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
      const layouts = utils.getLayouts()
      const rawLayoutName = data.slides[index]?.frontmatter?.layout ?? data.slides[0]?.frontmatter?.defaults?.layout
      let layoutName = rawLayoutName || (index === 0 ? 'cover' : 'default')
      if (!layouts[layoutName]) {
        console.error(red(`\nUnknown layout "${bold(layoutName)}".${yellow(' Available layouts are:')}`)
          + Object.keys(layouts).map((i, idx) => (idx % 3 === 0 ? '\n    ' : '') + gray(i.padEnd(15, ' '))).join('  '))
        console.error()
        layoutName = 'default'
      }

      const setupTag = code.match(/^<script setup.*>/m)
      if (!setupTag)
        throw new Error(`[Slidev] Internal error: <script setup> block not found in slide ${index + 1}.`)

      const templatePart = code.slice(0, setupTag.index!)
      const scriptPart = code.slice(setupTag.index!)

      const bodyStart = templatePart.indexOf('<template>') + 10
      const bodyEnd = templatePart.lastIndexOf('</template>')
      let body = code.slice(bodyStart, bodyEnd).trim()
      if (body.startsWith('<div>') && body.endsWith('</div>'))
        body = body.slice(5, -6)

      return [
        templatePart.slice(0, bodyStart),
        `<InjectedLayout v-bind="_frontmatterToProps($frontmatter,${index})">\n${body}\n</InjectedLayout>`,
        templatePart.slice(bodyEnd),
        scriptPart.slice(0, setupTag[0].length),
        `import InjectedLayout from "${toAtFS(layouts[layoutName])}"`,
        templateImportContextUtils,
        templateInitContext,
        '$clicksContext.setup()',
        templateInjectionMarker,
        scriptPart.slice(setupTag[0].length),
      ].join('\n')
    },
  }
}
