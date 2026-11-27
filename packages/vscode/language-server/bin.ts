#!/usr/bin/env node
/* eslint-disable no-console */
import process from 'node:process'
import { version } from '../package.json'

if (process.argv.includes('--version'))
  console.log(version)
else
  import('./index.js')
