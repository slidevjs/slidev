---
name: mcp
description: Built-in MCP server for AI agents to inspect, edit, reorder, and navigate slides
---

# MCP Server

Slidev ships a built-in MCP (Model Context Protocol) server exposing structured tools to read, edit, reorder, and navigate a deck. Prefer these tools over raw text edits for slide-level operations (update/insert/remove/move) — they handle Slidev's compound separators correctly and hot-reload the presentation.

## Usage

With a running dev server (streamable HTTP):

```
http://localhost:<port>/__mcp
```

```bash
# e.g. for Claude Code
claude mcp add --transport http slidev http://localhost:3030/__mcp
```

Standalone over stdio (no dev server, operates on files directly):

```bash
slidev mcp [entry]
```

## Tools

| Tool | Description |
| --- | --- |
| `slidev-get-info` | Deck overview: entry, title, slide count, markdown files, server URL, current position |
| `slidev-list-slides` | All slides with number, title, layout, source file |
| `slidev-get-slide` | Full source of one slide: frontmatter, content, note |
| `slidev-update-slide` | Update content, note, and/or frontmatter of a slide |
| `slidev-insert-slide` | Insert a new slide after an existing one |
| `slidev-remove-slide` | Remove a slide |
| `slidev-move-slide` | Move a slide before/after another to reorder the deck |
| `slidev-goto-slide` | Navigate the live presentation to a slide (dev server only) |

## Behavior

- Slides are addressed by rendered 1-based numbers (as shown in the presentation)
- Edits are saved to the markdown files; a running dev server hot-reloads instantly
- The first slide of the entry file cannot be removed/moved (its frontmatter is the deck headmatter)
- Slides imported via `src:` are edited in their own file; moves cannot cross files
- Disable with `mcp: false` in the headmatter
