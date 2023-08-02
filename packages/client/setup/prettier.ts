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
          (await import('prettier/plugins/babel')).default,
          (await import('prettier/plugins/typescript')).default,
        ]
        break
      case 'html':
        parser = 'html'
        plugins = [
          (await import('prettier/plugins/html')).default,
        ]
        break
      default:
        parser = 'babel'
        plugins = [
          (await import('prettier/plugins/babel')).default,
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
