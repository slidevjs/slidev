---
name: vscode-extension
description: Manage slides visually in VS Code
---

# VS Code Extension

Manage slides visually in VS Code.

## Installation

Install from VS Code Marketplace: `antfu.slidev`

## Features

- Preview slides in side panel
- Slides tree view
- Drag and drop to reorder slides
- Folding for slide blocks
- Multiple project support
- One-click dev server start

## Usage

1. Click `Slidev` icon in activity bar
2. Projects tree shows all Slidev projects in workspace
3. Slides tree shows slides in active project
4. Preview panel shows live preview

## Commands

Type `Slidev` in command palette to see available commands.

## Configuration

Include specific files as Slidev entries:

```json
{
  "slidev.include": ["**/presentation.md"]
}
```

Custom dev command:

```json
{
  "slidev.dev-command": "pnpm slidev ${args}"
}
```

## Placeholders

- `${args}` - All CLI arguments
- `${port}` - Port number
