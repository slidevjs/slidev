import type { CompilerOptions } from 'vue/compiler-sfc'

type NodeTransform = NonNullable<CompilerOptions['nodeTransforms']>[number]

// Values of the `NodeTypes`, `ElementTypes` and `ConstantTypes` enums of `@vue/compiler-core`,
// inlined so we don't need a direct dependency on the compiler packages.
const NODE_ROOT = 0
const NODE_ELEMENT = 1
const NODE_TEXT = 2
const NODE_SIMPLE_EXPRESSION = 4
const NODE_ATTRIBUTE = 6
const NODE_DIRECTIVE = 7
const NODE_IF_BRANCH = 10
const NODE_FOR = 11
const ELEMENT_TYPE_COMPONENT = 1
const CONSTANT_CAN_STRINGIFY = 3

interface Loc {
  start: { offset: number, line: number, column: number }
  end: { offset: number, line: number, column: number }
  source: string
}

interface AstNode {
  type: number
  loc: Loc
  [key: string]: any
}

/**
 * Directives that accept the `.mount` modifier, mapped to the `at` value they imply.
 */
const MOUNT_DIRECTIVES: Record<string, { at?: string, hide?: boolean }> = {
  'click': {},
  'after': { at: '+0' },
  'click-hide': { hide: true },
}

/**
 * Directives that have to stay on the outermost node, so they are moved to the wrapper.
 */
const STRUCTURAL_DIRECTIVES = ['if', 'else-if', 'else', 'for']

function getModifiers(dir: AstNode): string[] {
  return (dir.modifiers ?? []).map((m: string | AstNode) => typeof m === 'string'
    ? m
    : m.content)
}

function isMountDirective(prop: AstNode) {
  return prop.type === NODE_DIRECTIVE
    && prop.name in MOUNT_DIRECTIVES
    && getModifiers(prop).includes('mount')
}

function isKeyProp(prop: AstNode) {
  if (prop.type === NODE_ATTRIBUTE)
    return prop.name === 'key'
  return prop.type === NODE_DIRECTIVE
    && prop.name === 'bind'
    && prop.arg?.type === NODE_SIMPLE_EXPRESSION
    && prop.arg.isStatic
    && prop.arg.content === 'key'
}

function createAttribute(name: string, value: string | undefined, loc: Loc): AstNode {
  return {
    type: NODE_ATTRIBUTE,
    name,
    nameLoc: loc,
    value: value == null
      ? undefined
      : { type: NODE_TEXT, content: value, loc },
    loc,
  }
}

function createBind(name: string, exp: AstNode, loc: Loc): AstNode {
  return {
    type: NODE_DIRECTIVE,
    name: 'bind',
    rawName: `:${name}`,
    arg: {
      type: NODE_SIMPLE_EXPRESSION,
      content: name,
      isStatic: true,
      constType: CONSTANT_CAN_STRINGIFY,
      loc,
    },
    exp,
    modifiers: [],
    loc,
  }
}

/**
 * Modifiers of the directive that are not animation presets.
 */
const NON_ANIMATION_MODIFIERS = ['mount', 'hide']

function wrapElement(el: AstNode): AstNode | undefined {
  if (el.type !== NODE_ELEMENT)
    return

  const dirIndex = el.props.findIndex(isMountDirective)
  if (dirIndex === -1)
    return

  // `<template v-slot>` is a slot outlet, not content, so it's left untouched
  const isTemplate = el.tag === 'template'
  if (isTemplate && el.props.some((prop: AstNode) => prop.type === NODE_DIRECTIVE && prop.name === 'slot'))
    return

  const dir = el.props[dirIndex]
  const preset = MOUNT_DIRECTIVES[dir.name]
  const loc = dir.loc as Loc

  const props: AstNode[] = [
    createAttribute('mount', undefined, loc),
  ]
  if (preset.hide || getModifiers(dir).includes('hide'))
    props.push(createAttribute('hide', undefined, loc))
  if (preset.at != null)
    props.push(createAttribute('at', preset.at, loc))
  else if (dir.exp)
    props.push(createBind('at', dir.exp, loc))
  // e.g. `v-click.mount.fade.up` -> `animation="fade up"`
  const animations = getModifiers(dir).filter(m => !NON_ANIMATION_MODIFIERS.includes(m))
  if (animations.length)
    props.push(createAttribute('animation', animations.join(' '), loc))

  // Move `v-if` / `v-for` / `key` to the wrapper, so every rendered element still
  // gets its own click, just like with the plain `v-click` directive.
  const kept: AstNode[] = []
  el.props.forEach((prop: AstNode, idx: number) => {
    if (idx === dirIndex)
      return
    if ((prop.type === NODE_DIRECTIVE && STRUCTURAL_DIRECTIVES.includes(prop.name)) || isKeyProp(prop))
      props.push(prop)
    else
      kept.push(prop)
  })
  el.props = kept

  return {
    type: NODE_ELEMENT,
    ns: el.ns,
    tag: 'v-click',
    tagType: ELEMENT_TYPE_COMPONENT,
    props,
    // `<template>` isn't rendered, so its children are moved into the wrapper
    children: isTemplate
      ? el.children
      : [el],
    isSelfClosing: false,
    codegenNode: undefined,
    loc: el.loc,
  }
}

/**
 * Vue template transform for the `.mount` modifier of `v-click`, `v-after` and `v-click-hide`.
 *
 * A directive can't stop its own element from being mounted, so
 * `<div v-click.mount="3" />` is rewritten into `<v-click mount :at="3"><div /></v-click>`.
 * Animation modifiers are passed as the `animation` prop, and the children of
 * `<template v-click.mount>` are wrapped directly.
 *
 * The rewrite is done on the parent node, before its children are traversed,
 * so the moved element is only transformed once.
 */
export const transformVClickMount: NodeTransform = (node) => {
  const parent = node as unknown as AstNode
  if (![
    NODE_ROOT,
    NODE_ELEMENT,
    NODE_IF_BRANCH,
    NODE_FOR,
  ].includes(parent.type) || !Array.isArray(parent.children)) {
    return
  }

  parent.children.forEach((child: AstNode, idx: number) => {
    const wrapped = wrapElement(child)
    if (wrapped)
      parent.children[idx] = wrapped
  })
}
