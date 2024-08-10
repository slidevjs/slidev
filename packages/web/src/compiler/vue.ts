// Ported from https://github.com/vuejs/repl/blob/main/src/transform.ts

import type { BindingMetadata, CompilerOptions, SFCDescriptor } from 'vue/compiler-sfc'
import * as compiler from 'vue/compiler-sfc'
import { toArray } from '@antfu/utils'
import { hash } from 'ohash'
import { sfcOptions } from '../configs/plugins'
import { transformTS } from './ts'
import type { CompileResult } from './file'
import { isJsxFile, isTsFile } from './utils'

export const COMP_IDENTIFIER = `__sfc__`

async function doCompileScript(
  descriptor: SFCDescriptor,
  id: string,
  ssr: boolean,
  isTS: boolean,
  isJSX: boolean,
): Promise<[code: string, bindings: BindingMetadata | undefined]> {
  if (descriptor.script || descriptor.scriptSetup) {
    const expressionPlugins: CompilerOptions['expressionPlugins'] = []
    if (isTS) {
      expressionPlugins.push('typescript')
    }
    if (isJSX) {
      expressionPlugins.push('jsx')
    }

    const compiledScript = compiler.compileScript(descriptor, {
      inlineTemplate: true,
      ...sfcOptions?.script,
      id,
      genDefaultAs: COMP_IDENTIFIER,
      templateOptions: {
        ...sfcOptions?.template,
        ssr,
        ssrCssVars: descriptor.cssVars,
        compilerOptions: {
          ...sfcOptions?.template?.compilerOptions,
          expressionPlugins,
        },
      },
    })
    let code = compiledScript.content
    if (isTS) {
      code = await transformTS(code, isJSX)
    }
    if (isJSX) {
      code = await import('./jsx').then(m => m.transformJSX(code))
    }

    return [code, compiledScript.bindings]
  }
  else {
    return [`\nconst ${COMP_IDENTIFIER} = {}`, undefined]
  }
}

async function doCompileTemplate(
  descriptor: SFCDescriptor,
  id: string,
  bindingMetadata: BindingMetadata | undefined,
  ssr: boolean,
  isTS: boolean,
  isJSX: boolean,
) {
  const expressionPlugins: CompilerOptions['expressionPlugins'] = []
  if (isTS) {
    expressionPlugins.push('typescript')
  }
  if (isJSX) {
    expressionPlugins.push('jsx')
  }

  let { code, errors } = compiler.compileTemplate({
    isProd: false,
    ...sfcOptions?.template,
    ast: descriptor.template!.ast,
    source: descriptor.template!.content,
    filename: descriptor.filename,
    id,
    scoped: descriptor.styles.some(s => s.scoped),
    slotted: descriptor.slotted,
    ssr,
    ssrCssVars: descriptor.cssVars,
    compilerOptions: {
      ...sfcOptions?.template?.compilerOptions,
      bindingMetadata,
      expressionPlugins,
    },
  })
  if (errors.length) {
    return errors
  }

  const fnName = ssr ? `ssrRender` : `render`

  code
    = `\n${code.replace(
      /\nexport (function|const) (render|ssrRender)/,
      `$1 ${fnName}`,
    )}` + `\n${COMP_IDENTIFIER}.${fnName} = ${fnName}`

  if (isTS) {
    code = await transformTS(code, isJSX)
  }
  if (isJSX) {
    code = await import('./jsx').then(m => m.transformJSX(code))
  }

  return code
}

function isCustomElement(filename: string) {
  const filter = sfcOptions.customElement || /\.ce\.vue$/
  if (filter === true) {
    return true
  }
  return toArray(filter).some((f) => {
    if (typeof f === 'string') {
      return filename.includes(f)
    }
    return f.test(filename)
  })
}

export async function compileVue(filename: string, code: string): Promise<CompileResult> {
  const id = hash(filename)
  const { errors, descriptor } = compiler.parse(code, {
    filename,
    sourceMap: true,
    templateParseOptions: sfcOptions?.template?.compilerOptions,
  })
  if (errors.length) {
    return {
      errors,
    }
  }

  const styleLangs = descriptor.styles.map(s => s.lang).filter(Boolean)
  const templateLang = descriptor.template?.lang
  if (styleLangs.length && templateLang) {
    return {
      errors: [
      `lang="${styleLangs.join(
        ',',
      )}" pre-processors for <style> and lang="${templateLang}" `
      + `for <template> are currently not supported.`,
      ],
    }
  }
  else if (styleLangs.length) {
    return {
      errors: [
      `lang="${styleLangs.join(
        ',',
      )}" pre-processors for <style> are currently not supported.`,
      ],
    }
  }
  else if (templateLang) {
    return {
      errors: [
      `lang="${templateLang}" pre-processors for `
      + `<template> are currently not supported.`,
      ],
    }
  }

  const scriptLang = descriptor.script?.lang || descriptor.scriptSetup?.lang
  const isTS = isTsFile(scriptLang)
  const isJSX = isJsxFile(scriptLang)

  if (scriptLang && scriptLang !== 'js' && !isTS && !isJSX) {
    return {
      errors: [`Unsupported lang "${scriptLang}" in <script> blocks.`],
    }
  }

  const hasScoped = descriptor.styles.some(s => s.scoped)
  let clientCode = ''

  let clientScript: string
  let bindings: compiler.BindingMetadata | undefined
  try {
    ;[clientScript, bindings] = await doCompileScript(
      descriptor,
      id,
      false,
      isTS,
      isJSX,
    )
  }
  catch (e: any) {
    return {
      errors: [e.stack.split('\n').slice(0, 12).join('\n')],
    }
  }

  clientCode += clientScript

  // template
  // only need dedicated compilation if not using <script setup>
  if (
    descriptor.template
    && (!descriptor.scriptSetup)
  ) {
    const clientTemplateResult = await doCompileTemplate(
      descriptor,
      id,
      bindings,
      false,
      isTS,
      isJSX,
    )
    if (Array.isArray(clientTemplateResult)) {
      return {
        errors: clientTemplateResult,
      }
    }
    clientCode += `;${clientTemplateResult}`
  }

  if (hasScoped) {
    clientCode += `\n${COMP_IDENTIFIER}.__scopeId = ${JSON.stringify(`data-v-${id}`)}`
  }

  // styles
  const isCE = isCustomElement(filename)

  let css = ''
  const styles: string[] = []
  for (const style of descriptor.styles) {
    if (style.module) {
      return {
        errors: [`<style module> is not supported in the playground.`],
      }
    }

    const styleResult = await compiler.compileStyleAsync({
      ...sfcOptions?.style,
      source: style.content,
      filename,
      id,
      scoped: style.scoped,
      modules: !!style.module,
    })
    if (styleResult.errors.length) {
      // postcss uses pathToFileURL which isn't polyfilled in the browser
      // ignore these errors for now
      if (!styleResult.errors[0].message.includes('pathToFileURL')) {
        // store.errors = styleResult.errors
      }
      // proceed even if css compile errors
    }
    else {
      if (isCE) {
        styles.push(styleResult.code)
      }
      else {
        css += `${styleResult.code}\n`
      }
    }
  }

  if (clientCode) {
    const ceStyles = isCE
      ? `\n${COMP_IDENTIFIER}.styles = ${JSON.stringify(styles)}`
      : ''

    clientCode += `\n${COMP_IDENTIFIER}.__file = ${JSON.stringify(filename)}${
        ceStyles
        }\nexport default ${COMP_IDENTIFIER}`
  }

  return {
    css: css.trim(),
    js: clientCode.trimStart(),
  }
}
