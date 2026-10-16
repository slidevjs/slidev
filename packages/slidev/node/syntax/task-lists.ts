import type MarkdownExit from 'markdown-exit'
import { taskLists } from '@hedgedoc/markdown-it-plugins'

const RE_TASK_MARKER = /^ *\[[\sx]\] /i

/**
 * Task lists (`- [x] item`).
 *
 * With MDC enabled, the `[x]` / `[ ]` marker is parsed as an MDC inline span
 * before the task list rule runs, so the rule only sees `<span>x</span>` and
 * leaves it in the label. Fold that leading span back into plain text first,
 * so the marker gets stripped as usual.
 */
export default function MarkdownItTaskLists(md: MarkdownExit) {
  md.use(taskLists, { enabled: true, lineNumber: true, label: true })

  md.core.ruler.before('task-lists', 'task-lists-mdc-span', (state) => {
    const tokens = state.tokens
    for (let i = 2; i < tokens.length; i++) {
      const token = tokens[i]
      if (
        token.type !== 'inline'
        || tokens[i - 1].type !== 'paragraph_open'
        || tokens[i - 2].type !== 'list_item_open'
        || !RE_TASK_MARKER.test(token.content)
      ) {
        continue
      }

      const [open, marker, close, rest] = token.children ?? []
      if (
        open?.type === 'mdc_inline_span' && open.nesting === 1
        && marker?.type === 'text'
        && close?.type === 'mdc_inline_span' && close.nesting === -1
        && rest?.type === 'text'
      ) {
        rest.content = `[${marker.content}]${rest.content}`
        token.children!.splice(0, 3)
      }
    }
  })
}
