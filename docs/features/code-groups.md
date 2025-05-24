---
depends:
  - guide/syntax#code-block
tags: [codeblock]
description: |
  Group multiple code blocks and automatically match icon by the title name.
---

# Code Groups

> [!NOTE]
> This feature requires [MDC Syntax](/features/mdc#mdc-syntax). Enable `mdc: true` to use it.

You can group multiple code blocks like this:

````md
::code-group

```sh [npm]
npm i @slidev/cli
```

```sh [yarn]
yarn add @slidev/cli
```

```sh [pnpm]
pnpm add @slidev/cli
```

::
````

## Title Icon Matching

`code groups` and `code block` also supports the automatically icon matching by the title name:

![code-groups-demo](/assets/code-groups-demo.png)

::: details All builtin icons

```js
const builtinIcons = {
  // package managers
  'pnpm': 'i-vscode-icons:file-type-light-pnpm',
  'npm': 'i-vscode-icons:file-type-npm',
  'yarn': 'i-vscode-icons:file-type-yarn',
  'bun': 'i-vscode-icons:file-type-bun',
  'deno': 'i-vscode-icons:file-type-deno',
  // frameworks
  'vue': 'i-vscode-icons:file-type-vue',
  'svelte': 'i-vscode-icons:file-type-svelte',
  'angular': 'i-vscode-icons:file-type-angular',
  'react': 'i-vscode-icons:file-type-reactjs',
  'next': 'i-vscode-icons:file-type-light-next',
  'nuxt': 'i-vscode-icons:file-type-nuxt',
  'solid': 'logos:solidjs-icon',
  'astro': 'i-vscode-icons:file-type-light-astro',
  // bundlers
  'rollup': 'i-vscode-icons:file-type-rollup',
  'webpack': 'i-vscode-icons:file-type-webpack',
  'vite': 'i-vscode-icons:file-type-vite',
  'esbuild': 'i-vscode-icons:file-type-esbuild',
  // configuration files
  'package.json': 'i-vscode-icons:file-type-node',
  'tsconfig.json': 'i-vscode-icons:file-type-tsconfig',
  '.npmrc': 'i-vscode-icons:file-type-npm',
  '.editorconfig': 'i-vscode-icons:file-type-editorconfig',
  '.eslintrc': 'i-vscode-icons:file-type-eslint',
  '.eslintignore': 'i-vscode-icons:file-type-eslint',
  'eslint.config': 'i-vscode-icons:file-type-eslint',
  '.gitignore': 'i-vscode-icons:file-type-git',
  '.gitattributes': 'i-vscode-icons:file-type-git',
  '.env': 'i-vscode-icons:file-type-dotenv',
  '.env.example': 'i-vscode-icons:file-type-dotenv',
  '.vscode': 'i-vscode-icons:file-type-vscode',
  'tailwind.config': 'vscode-icons:file-type-tailwind',
  'uno.config': 'i-vscode-icons:file-type-unocss',
  'unocss.config': 'i-vscode-icons:file-type-unocss',
  '.oxlintrc': 'i-vscode-icons:file-type-oxlint',
  'vue.config': 'i-vscode-icons:file-type-vueconfig',
  // filename extensions
  '.mts': 'i-vscode-icons:file-type-typescript',
  '.cts': 'i-vscode-icons:file-type-typescript',
  '.ts': 'i-vscode-icons:file-type-typescript',
  '.tsx': 'i-vscode-icons:file-type-typescript',
  '.mjs': 'i-vscode-icons:file-type-js',
  '.cjs': 'i-vscode-icons:file-type-js',
  '.json': 'i-vscode-icons:file-type-json',
  '.js': 'i-vscode-icons:file-type-js',
  '.jsx': 'i-vscode-icons:file-type-js',
  '.md': 'i-vscode-icons:file-type-markdown',
  '.py': 'i-vscode-icons:file-type-python',
  '.ico': 'i-vscode-icons:file-type-favicon',
  '.html': 'i-vscode-icons:file-type-html',
  '.css': 'i-vscode-icons:file-type-css',
  '.scss': 'i-vscode-icons:file-type-scss',
  '.yml': 'i-vscode-icons:file-type-light-yaml',
  '.yaml': 'i-vscode-icons:file-type-light-yaml',
  '.php': 'i-vscode-icons:file-type-php',
}
```

:::

## Custom Icon

You can also specify the icon manually by the following steps:

1. Add the icon to the `uno.config.ts` file:

```ts [uno.config.ts] {3-5}
import { defineConfig } from 'unocss'

export default defineConfig({
  safelist: [
    'i-vscode-icons:file-type-coverage',
  ],
})
```

2. Use the icon in the code block with the `~icon~` syntax:

````md
```sh [npm ~i-vscode-icons:file-type-coverage~]
npm i @slidev/cli
```
````
