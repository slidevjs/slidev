import { expect, it } from 'vitest'
import { parseCodeblockInfo } from './parse'

it('parses nested code block options', () => {
  expect(parseCodeblockInfo(`txt {editorOptions:{lineNumbers:'off'}}`)).toEqual({
    lang: 'txt',
    title: '',
    rangeStr: '',
    options: `{editorOptions:{lineNumbers:'off'}}`,
    rest: '',
  })
})

it('preserves existing code block info fields and trailing content', () => {
  expect(parseCodeblockInfo(`ts [filename.ts]{1,2|3}{editorOptions:{lineNumbers:'off'}} trailing`)).toEqual({
    lang: 'ts',
    title: 'filename.ts',
    rangeStr: '1,2|3',
    options: `{editorOptions:{lineNumbers:'off'}}`,
    rest: ' trailing',
  })
})

it('ignores braces inside option strings', () => {
  expect(parseCodeblockInfo(`txt {title:'}'}`)).toEqual({
    lang: 'txt',
    title: '',
    rangeStr: '',
    options: `{title:'}'}`,
    rest: '',
  })
})
