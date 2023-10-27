// forked from https://github.com/jGleitz/markdown-it-prism
// it's modified to output line wrapper `<div class="line" />` for each line

import { createRequire } from 'node:module'
import type { Grammar } from 'prismjs'
import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/index.js'
import type MarkdownIt from 'markdown-it'
import * as htmlparser2 from 'htmlparser2'
import { escapeVueInCode } from './markdown'

const require = createRequire(import.meta.url)

interface Options {
  plugins: string[]
  /**
   * Callback for Prism initialisation. Useful for initialising plugins.
   * @param prism The Prism instance that will be used by the plugin.
   */
  init: (prism: typeof Prism) => void
  /**
   * The language to use for code blocks that specify a language that Prism does not know.
   */
  defaultLanguageForUnknown?: string
  /**
   * The language to use for code blocks that do not specify a language.
   */
  defaultLanguageForUnspecified?: string
  /**
   * Shorthand to set both {@code defaultLanguageForUnknown} and {@code defaultLanguageForUnspecified} to the same value. Will be copied
   * to each option if it is set to {@code undefined}.
   */
  defaultLanguage?: string
}

interface Attributes {
  [s: string]: string
}

class Tag {
  tagname: string
  attributes: Attributes

  constructor(tagname: string, attributes: Attributes) {
    this.tagname = tagname
    this.attributes = attributes
  }

  asOpen() {
    return `<${this.tagname} ${Object.entries(this.attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')}>`
  }

  asClosed() {
    return `</${this.tagname}>`
  }
}

const DEFAULTS: Options = {
  plugins: [],
  init: () => {
    // do nothing by default
  },
  defaultLanguageForUnknown: undefined,
  defaultLanguageForUnspecified: undefined,
  defaultLanguage: undefined,
}

/**
 * Loads the provided {@code lang} into prism.
 *
 * @param lang
 *        Code of the language to load.
 * @return The Prism language object for the provided {@code lang} code. {@code undefined} if the language is not known to Prism.
 */
function loadPrismLang(lang: string): Grammar | undefined {
  if (!lang)
    return undefined
  let langObject = Prism.languages[lang]
  if (langObject === undefined) {
    loadLanguages([lang])
    langObject = Prism.languages[lang]
  }
  return langObject
}

/**
 * Loads the provided Prism plugin.a
 * @param name
 *        Name of the plugin to load
 * @throws {Error} If there is no plugin with the provided {@code name}
 */
function loadPrismPlugin(name: string): void {
  try {
    require(`prismjs/plugins/${name}/prism-${name}`)
  }
  catch (e) {
    throw new Error(`Cannot load Prism plugin "${name}". Please check the spelling.`)
  }
}

/**
 * Select the language to use for highlighting, based on the provided options and the specified language.
 *
 * @param options
 *        The options that were used to initialise the plugin.
 * @param lang
 *        Code of the language to highlight the text in.
 * @return  The name of the language to use and the Prism language object for that language.
 */
function selectLanguage(options: Options, lang: string): [string, Grammar | undefined] {
  let langToUse = lang
  if (langToUse === '' && options.defaultLanguageForUnspecified !== undefined)
    langToUse = options.defaultLanguageForUnspecified

  let prismLang = loadPrismLang(langToUse)
  if (prismLang === undefined && options.defaultLanguageForUnknown !== undefined) {
    langToUse = options.defaultLanguageForUnknown
    prismLang = loadPrismLang(langToUse)
  }
  return [langToUse, prismLang]
}

/**
 * Highlights the provided text using Prism.
 *
 * @param markdownit
 *        The markdown-it instance
 * @param options
 *        The options that have been used to initialise the plugin.
 * @param text
 *        The text to highlight.
 * @param lang
 *        Code of the language to highlight the text in.
 * @return wrapped in `<pre>` and `<code>`, both equipped with the appropriate class
 *  (markdown-it’s langPrefix + lang). If Prism knows `lang`, `text` will be highlighted by it.
 */
function highlight(markdownit: MarkdownIt, options: Options, text: string, lang: string): string {
  const [langToUse, prismLang] = selectLanguage(options, lang)
  let code = text.trimEnd()
  code = prismLang
    ? highlightPrism(code, prismLang, langToUse)
    : markdownit.utils.escapeHtml(code)
  code = code.split(/\r?\n/g)
    .map(line => `<span class="line">${line}</span>`)
    .join('\n')
  const classAttribute = langToUse
    ? ` class="slidev-code ${markdownit.options.langPrefix}${markdownit.utils.escapeHtml(langToUse)}"`
    : ''
  return escapeVueInCode(`<pre${classAttribute}><code>${code}</code></pre>`)
}

function highlightPrism(code: string, prismLang: Grammar, langToUse: string) {
  // keep track of open tags
  const openTags: Tag[] = []
  // create parser
  const parser = new htmlparser2.Parser({
    onopentag(tagname, attributes) {
      openTags.push(new Tag(tagname, attributes))
    },
    onclosetag() {
      openTags.pop()
    },
  })
  // highlight code
  code = Prism.highlight(code, prismLang, langToUse)
  // split result by line
  code = code.split(/\r?\n/g).map((line) => {
    // if tag hierarchy is not empty, open elements at start of line
    const prefix = openTags.map(tag => tag.asOpen()).join('')
    // parse line
    parser.write(line)
    // if tag hierarchy is not empty, close elements at end of line
    const postfix = openTags.reverse().map(tag => tag.asClosed()).join('')
    // concatenate result
    return prefix + line + postfix
  }).join('\n')
  // clear parser
  parser.end()
  return code
}

/**
 * Checks whether an option represents a valid Prism language
 *
 * @param options
 *        The options that have been used to initialise the plugin.
 * @param optionName
 *        The key of the option inside {@code options} that shall be checked.
 * @throws {Error} If the option is not set to a valid Prism language.
 */
function checkLanguageOption(
  options: Options,
  optionName: 'defaultLanguage' | 'defaultLanguageForUnknown' | 'defaultLanguageForUnspecified',
): void {
  const language = options[optionName]
  if (language !== undefined && loadPrismLang(language) === undefined)
    throw new Error(`Bad option ${optionName}: There is no Prism language '${language}'.`)
}

/**
 * Initialisation function of the plugin. This function is not called directly by clients, but is rather provided
 * to MarkdownIt’s {@link MarkdownIt.use} function.
 *
 * @param markdownit
 *        The markdown it instance the plugin is being registered to.
 * @param useroptions
 *        The options this plugin is being initialised with.
 */
export default function markdownItPrism(markdownit: MarkdownIt, useroptions: Options): void {
  const options = Object.assign({}, DEFAULTS, useroptions)

  checkLanguageOption(options, 'defaultLanguage')
  checkLanguageOption(options, 'defaultLanguageForUnknown')
  checkLanguageOption(options, 'defaultLanguageForUnspecified')
  options.defaultLanguageForUnknown = options.defaultLanguageForUnknown || options.defaultLanguage
  options.defaultLanguageForUnspecified = options.defaultLanguageForUnspecified || options.defaultLanguage

  options.plugins.forEach(loadPrismPlugin)
  options.init(Prism)

  // register ourselves as highlighter
  markdownit.options.highlight = (text, lang) => highlight(markdownit, options, text, lang)
}
