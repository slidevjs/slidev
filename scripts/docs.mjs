#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

const rootDir = resolve(import.meta.dirname, '..')

// Parse parameters: pnpm docs [lang] [command]
// For example: pnpm docs cn, pnpm docs cn build, pnpm docs
let lang = process.argv[2] || process.env.DOCS_LANG || ''
let command = process.argv[3] || 'dev'

// Determine document directory
let docsDir = 'docs' // Default English

if (lang && !['dev', 'build'].includes(lang)) {
  // Direct concatenation: cn -> docs-cn, jp -> docs-jp
  docsDir = lang.startsWith('docs-') ? lang : `docs-${lang}`
} else if (lang === 'dev' || lang === 'build') {
  // If the first parameter is a command, use the default docs
  command = lang
  docsDir = 'docs'
}

const targetDir = resolve(rootDir, docsDir)

// Check if directory exists
if (!existsSync(targetDir)) {
  console.warn(`⚠️  Directory "${docsDir}" not found, falling back to "docs"`)
  const fallbackDir = resolve(rootDir, 'docs')
  
  if (!existsSync(fallbackDir)) {
    console.error('❌ Default "docs" directory not found')
    process.exit(1)
  }
  
  docsDir = 'docs'
}

// Execute document command
console.log(`📚 Running docs ${command} from: ${docsDir}`)
try {
  execSync(`pnpm -C ${docsDir} run ${command}`, { stdio: 'inherit', cwd: rootDir })
} catch (error) {
  process.exit(error.status || 1)
}
