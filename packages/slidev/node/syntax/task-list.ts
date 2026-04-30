import type { MarkdownExit } from 'markdown-exit'
import { taskLists as HedgeDocMarkdownItTaskList } from '@hedgedoc/markdown-it-plugins'

type TaskListOptions = Parameters<typeof HedgeDocMarkdownItTaskList>[1]
type Token = ReturnType<MarkdownExit['parseInline']>[number]

const TASK_LIST_MARKER_RE = /^\[[ x]\]\s/i
const COMARK_TASK_LIST_MARKER_RE = /^[ x]$/i

export default function MarkdownItTaskList(md: MarkdownExit, options?: TaskListOptions) {
  md.use(HedgeDocMarkdownItTaskList, options)

  md.core.ruler.after('task-lists', 'slidev_task_list_comark', (state) => {
    for (const token of state.tokens) {
      if (token.type !== 'inline' || !TASK_LIST_MARKER_RE.test(token.content))
        continue

      removeLeadingComarkMarker(token.children)
    }
  })
}

function removeLeadingComarkMarker(children?: Token[]) {
  if (!children?.length)
    return

  let index = children.findIndex(child => child.type === 'taskListItemCheckbox')
  if (index < 0)
    return

  index += 1
  if (children[index]?.type === 'taskListItemLabel_open')
    index += 1

  if (
    children[index]?.type !== 'mdc_inline_span'
    || children[index]?.nesting !== 1
    || children[index + 1]?.type !== 'text'
    || !COMARK_TASK_LIST_MARKER_RE.test(children[index + 1].content)
    || children[index + 2]?.type !== 'mdc_inline_span'
    || children[index + 2]?.nesting !== -1
  ) {
    return
  }

  children.splice(index, 3)

  const next = children[index]
  if (next?.type === 'text' && next.content.startsWith(' '))
    next.content = next.content.slice(1)
}
