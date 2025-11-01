<script setup lang="ts">
defineProps<{
  title: string
}>()

const builtinIcons: Record<string, string> = {
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
  '.svg': 'i-vscode-icons:file-type-svg',
}

function matchIcon(title: string) {
  const colonMatch = title.match(/~([^~]+)~/g)
  if (colonMatch && colonMatch.length > 0) {
    const icon = colonMatch[0].slice(1, -1)
    return icon
  }

  const sortedKeys = Object.keys(builtinIcons).sort((a, b) => b.length - a.length)
  for (const key of sortedKeys) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return builtinIcons[key]
    }
  }
  return ''
}
</script>

<template>
  <div v-if="matchIcon(title)" :class="`${matchIcon(title)} w-3.5 h-3.5 relative`" />
</template>
