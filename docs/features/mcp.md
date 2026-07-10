---
relates:
  - guide/work-with-ai
  - Model Context Protocol: https://modelcontextprotocol.io/
  - features/vscode-extension
since: v52.17.0
tags: [editor, tool]
description: |
  Built-in MCP server that lets AI agents inspect, edit, reorder, and navigate your slides.
---

# MCP Server

Slidev ships a built-in [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server, so any MCP-capable AI agent (Claude Code, Codex, Cursor, VS Code Copilot, etc.) can work with your slides through structured tools instead of raw text edits — reading slides, updating content and notes, inserting/removing/reordering slides, and even driving the live presentation.

## Via the Dev Server

When the dev server is running, the MCP server is available over HTTP (streamable transport) at:

```
http://localhost:<port>/__mcp
```

For example, register it with your agent:

::: code-group

```bash [Claude Code]
claude mcp add --transport http slidev http://localhost:3030/__mcp
```

```json [VS Code / Cursor]
{
  "mcpServers": {
    "slidev": {
      "type": "http",
      "url": "http://localhost:3030/__mcp"
    }
  }
}
```

:::

With the dev server connected, agents can also use the `goto-slide` tool to navigate all connected browsers to a slide — handy for visually verifying a slide right after editing it. Edits made through the MCP tools are written back to your markdown files and hot-reloaded instantly.

To disable the endpoint, set in your headmatter:

```yaml
---
mcp: false
---
```

## Via Stdio

Without a dev server, you can start a standalone MCP server over stdio, operating directly on the markdown files:

```bash
slidev mcp [entry]
```

For example:

```json
{
  "mcpServers": {
    "slidev": {
      "command": "npx",
      "args": ["slidev", "mcp", "slides.md"]
    }
  }
}
```

## Available Tools

| Tool              | Description                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `get-slidev-info` | Deck overview: entry file, title, slide count, markdown files, dev server URL and current position |
| `list-slides`     | List all slides with number, title, layout, and source file                                        |
| `get-slide`       | Full source of one slide: frontmatter, content, and note                                           |
| `update-slide`    | Update the content, note, and/or frontmatter of a slide                                            |
| `insert-slide`    | Insert a new slide after an existing one                                                           |
| `remove-slide`    | Remove a slide                                                                                     |
| `move-slide`      | Move a slide before/after another one to reorder the deck                                          |
| `goto-slide`      | Navigate the live presentation to a slide (dev server only)                                        |

Slides are addressed by their rendered 1-based number, matching the slide numbers shown in the presentation.
