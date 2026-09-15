import MarkdownItComark from '@comark/markdown-it'
import MarkdownExit from 'markdown-exit'
import { expect, it } from 'vitest'
import MarkdownItTaskList from './task-list'

it('does not render task list markers when comark is enabled', async () => {
  const md = MarkdownExit({ html: true })
  md.use(MarkdownItTaskList, { enabled: true, lineNumber: true, label: true })
  md.use(MarkdownItComark)

  const result = await md.renderAsync('- [x] test\n- [ ] test')

  expect(result).toContain('<label for="task-item-0">test</label>')
  expect(result).toContain('<label for="task-item-1">test</label>')
  expect(result).not.toContain('<span>x</span>')
  expect(result).not.toContain('<span> </span>')
})
