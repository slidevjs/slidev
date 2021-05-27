#!/usr/bin/env node
'use strict'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const importFrom = require('import-from')
try {
  importFrom('@slidev/cli/dist/cli', process.cwd())
}
catch {
  require('../dist/cli')
}
