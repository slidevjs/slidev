import path from 'node:path'
import { workspaceRoot } from '../state'

export function searchEntry() {
  return path.resolve(workspaceRoot, './slides.md')
}
