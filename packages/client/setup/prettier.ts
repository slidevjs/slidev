import { format } from 'prettier'

export async function formatCode(code: string, lang: string) {
  try {
    let parser = 'babel'
    let plugins: any[] = []

    switch (lang) {
      case 'ts':
      case 'typescript':
        parser = 'typescript'
        plugins = [
          // @ts-expect-error missing types
          (await import('prettier/esm/parser-babel')).default,
          // @ts-expect-error missing types
          (await import('prettier/esm/parser-typescript')).default,
        ]
        break
      case 'html':
        parser = 'html'
        plugins = [
          // @ts-expect-error missing types
          (await import('prettier/esm/parser-html')).default,
        ]
        break
      default:
        parser = 'babel'
        plugins = [
          // @ts-expect-error missing types
          (await import('prettier/esm/parser-babel')).default,
        ]
    }

    return format(code, {
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      useTabs: false,
      parser,
      plugins,
    })
  }
  catch (e) {
    console.error(e)
    return code
  }
}
