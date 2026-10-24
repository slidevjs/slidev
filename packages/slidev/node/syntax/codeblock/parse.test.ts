import { describe, expect, it } from 'vitest'
import { extractBalancedBlock, parseCodeblockInfo } from './parse'

describe('parseCodeblockInfo', () => {
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

  it('ignores braces inside single-quoted strings', () => {
    expect(parseCodeblockInfo(`txt {title:'}'}`)).toEqual({
      lang: 'txt',
      title: '',
      rangeStr: '',
      options: `{title:'}'}`,
      rest: '',
    })
  })

  it('ignores braces inside double-quoted strings', () => {
    expect(parseCodeblockInfo(`txt {title:"}"}`)).toEqual({
      lang: 'txt',
      title: '',
      rangeStr: '',
      options: `{title:"}"}`,
      rest: '',
    })
  })

  it('ignores braces inside template literals', () => {
    expect(parseCodeblockInfo('txt {title:`}`}')).toEqual({
      lang: 'txt',
      title: '',
      rangeStr: '',
      options: '{title:`}`}',
      rest: '',
    })
  })

  it('handles escaped quotes inside strings', () => {
    expect(parseCodeblockInfo(`txt {title:'it\\\'s } ok'}`)).toEqual({
      lang: 'txt',
      title: '',
      rangeStr: '',
      options: `{title:'it\\\'s } ok'}`,
      rest: '',
    })
  })

  it('supports languages containing `#` and `+`', () => {
    expect(parseCodeblockInfo(`c# [Program.cs]{1}{lines:true}`)).toEqual({
      lang: 'c#',
      title: 'Program.cs',
      rangeStr: '1',
      options: `{lines:true}`,
      rest: '',
    })
    expect(parseCodeblockInfo(`c++ {lines:true}`)).toEqual({
      lang: 'c++',
      title: '',
      rangeStr: '',
      options: `{lines:true}`,
      rest: '',
    })
  })

  it('handles code blocks without options', () => {
    expect(parseCodeblockInfo(`ts {1-3}`)).toEqual({
      lang: 'ts',
      title: '',
      rangeStr: '1-3',
      options: undefined,
      rest: '',
    })
    expect(parseCodeblockInfo(`ts [filename.ts]`)).toEqual({
      lang: 'ts',
      title: 'filename.ts',
      rangeStr: '',
      options: undefined,
      rest: '',
    })
    expect(parseCodeblockInfo(`ts`)).toEqual({
      lang: 'ts',
      title: '',
      rangeStr: '',
      options: undefined,
      rest: '',
    })
  })

  it('handles unclosed braces gracefully', () => {
    expect(parseCodeblockInfo(`ts {unclosed`)).toEqual({
      lang: 'ts',
      title: '',
      rangeStr: '',
      options: undefined,
      rest: '{unclosed',
    })
  })

  it('handles deeply nested objects and empty options', () => {
    expect(parseCodeblockInfo(`ts {a:{b:{c:{d:1}}}}`)).toEqual({
      lang: 'ts',
      title: '',
      rangeStr: '',
      options: '{a:{b:{c:{d:1}}}}',
      rest: '',
    })
    expect(parseCodeblockInfo(`ts {}`)).toEqual({
      lang: 'ts',
      title: '',
      rangeStr: '',
      options: '{}',
      rest: '',
    })
  })

  it('handles leading whitespace before options and extra trailing braces', () => {
    expect(parseCodeblockInfo(`ts   {lines:true}`)).toEqual({
      lang: 'ts',
      title: '',
      rangeStr: '',
      options: '{lines:true}',
      rest: '',
    })
    expect(parseCodeblockInfo(`ts {lines:true}} extra`)).toEqual({
      lang: 'ts',
      title: '',
      rangeStr: '',
      options: '{lines:true}',
      rest: '} extra',
    })
  })
})

describe('extractBalancedBlock', () => {
  it('extracts balanced nested block', () => {
    const res = extractBalancedBlock(`{runnerOptions: {container: 'out'}}`)
    expect(res).toBeDefined()
    expect(res?.body).toBe(`{runnerOptions: {container: 'out'}}`)
    expect(res?.rest).toBe('')
  })

  it('extracts block with leading whitespace', () => {
    const res = extractBalancedBlock(`  {runnerOptions: {container: 'out'}} trailing`)
    expect(res).toBeDefined()
    expect(res?.body).toBe(`{runnerOptions: {container: 'out'}}`)
    expect(res?.rest).toBe(' trailing')
  })

  it('returns undefined when no block is present', () => {
    expect(extractBalancedBlock('')).toBeUndefined()
    expect(extractBalancedBlock('foo bar')).toBeUndefined()
  })
})
