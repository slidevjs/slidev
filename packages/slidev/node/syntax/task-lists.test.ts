import MarkdownItComark from '@comark/markdown-it'
import MarkdownExit from 'markdown-exit'
import { expect, it } from 'vitest'
import MarkdownItTaskLists from './task-lists'

const source = `
- [x] Completed task
- [ ] Still pending
- [X] Done with [a span]{.red}
`

it('task lists', async () => {
  const md = MarkdownExit()
  md.use(MarkdownItTaskLists)

  expect(await md.renderAsync(source)).toMatchInlineSnapshot(`
    "<ul class="contains-task-list">
    <li class="task-list-item  enabled"><input class="task-list-item-checkbox" type="checkbox" checked="" data-line="1" id="task-item-1" /><label for="task-item-1">Completed task</label></li>
    <li class="task-list-item  enabled"><input class="task-list-item-checkbox" type="checkbox" data-line="2" id="task-item-2" /><label for="task-item-2">Still pending</label></li>
    <li class="task-list-item  enabled"><input class="task-list-item-checkbox" type="checkbox" checked="" data-line="3" id="task-item-3" /><label for="task-item-3">Done with [a span]{.red}</label></li>
    </ul>
    "
  `)
})

it('task lists with mdc', async () => {
  const md = MarkdownExit()
  md.use(MarkdownItTaskLists)
  md.use(MarkdownItComark)

  expect(await md.renderAsync(source)).toMatchInlineSnapshot(`
    "<ul class="contains-task-list">
    <li class="task-list-item  enabled"><input class="task-list-item-checkbox" type="checkbox" checked="" data-line="1" id="task-item-1" /><label for="task-item-1">Completed task</label></li>
    <li class="task-list-item  enabled"><input class="task-list-item-checkbox" type="checkbox" data-line="2" id="task-item-2" /><label for="task-item-2">Still pending</label></li>
    <li class="task-list-item  enabled"><input class="task-list-item-checkbox" type="checkbox" checked="" data-line="3" id="task-item-3" /><label for="task-item-3">Done with <span class="red">a span</span></label></li>
    </ul>
    "
  `)
})
