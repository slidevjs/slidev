#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { readdir, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import process from 'node:process'

const projectRoot = resolve(process.argv[2] || process.cwd())
const slidevBin = join(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'slidev.cmd' : 'slidev',
)

function createSlidesContent(title, count) {
  const slides = Array.from({ length: count }, (_, index) => `# ${title}-${index + 1}`)
  return [
    '---',
    `title: ${title}`,
    '---',
    '',
    slides.join('\n\n---\n\n'),
    '',
  ].join('\n')
}

const cases = [
  {
    entry: 'slides-concurrency-a.md',
    output: 'export-concurrency-a',
    expectedPngCount: 8,
    content: createSlidesContent('ConcurrencyA', 8),
  },
  {
    entry: 'slides-concurrency-b.md',
    output: 'export-concurrency-b',
    expectedPngCount: 9,
    content: createSlidesContent('ConcurrencyB', 9),
  },
]

async function prepareCases() {
  await Promise.all(cases.flatMap(({ entry, output, content }) => [
    writeFile(join(projectRoot, entry), content, 'utf8'),
    rm(join(projectRoot, output), { recursive: true, force: true }),
  ]))
}

async function cleanupCases() {
  await Promise.all(cases.flatMap(({ entry, output }) => [
    rm(join(projectRoot, output), { recursive: true, force: true }),
    rm(join(projectRoot, entry), { force: true }),
  ]))
}

function runExport(entry, output) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(
      slidevBin,
      ['export', entry, '--format', 'png', '--output', output],
      {
        cwd: projectRoot,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', data => stdout += data.toString())
    child.stderr.on('data', data => stderr += data.toString())
    child.on('error', rejectRun)
    child.on('close', (code) => {
      if (code === 0) {
        resolveRun({ entry, output, stdout, stderr })
      }
      else {
        rejectRun(
          new Error(
            [
              `[integration] slidev export failed (${entry})`,
              `exit code: ${code}`,
              stdout.trim(),
              stderr.trim(),
            ].filter(Boolean).join('\n'),
          ),
        )
      }
    })
  })
}

async function assertOutputs() {
  for (const { output, expectedPngCount } of cases) {
    const outputDir = join(projectRoot, output)
    const files = await readdir(outputDir)
    const pngCount = files.filter(file => file.endsWith('.png')).length
    if (pngCount !== expectedPngCount) {
      throw new Error(
        `[integration] Unexpected PNG count in ${output}: expected ${expectedPngCount}, got ${pngCount}`,
      )
    }
  }
}

async function main() {
  await prepareCases()
  try {
    await Promise.all(
      cases.map(({ entry, output }) => runExport(entry, output)),
    )

    await assertOutputs()
    console.log('[integration] concurrent export test passed')
  }
  finally {
    await cleanupCases()
  }
}

await main()
