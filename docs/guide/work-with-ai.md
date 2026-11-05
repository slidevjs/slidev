# Work with AI

Thanks to Slidev being markdown-based, it works great with AI coding agents.

## MCP Server

Slidev has a built-in <LinkInline link="features/mcp" /> that gives any MCP-capable agent structured tools to inspect, edit, reorder, and navigate your slides.

When the dev server is running, point your agent to `http://localhost:<port>/__mcp`:

::: code-group

```bash [Claude Code]
claude mcp add --transport http slidev http://localhost:3030/__mcp
```

```bash [Codex]
codex mcp add slidev --url http://localhost:3030/__mcp
```

:::

Use the port reported by your dev server.

Or run a standalone stdio server that operates on the files directly:

```bash
slidev mcp slides.md
```

See <LinkInline link="features/mcp" /> for the available tools and configuration.

## Skills

Slidev provides official [Agent Skills](https://agentskills.io/) for AI coding agents, enabling them to understand Slidev's syntax, features, and best practices when helping you create presentations.

### Installation

From your presentation project, install the Slidev skill to your AI coding agent:

```bash
npx skills add slidevjs/slidev
```

To target Codex directly:

```bash
npx skills add slidevjs/slidev --agent codex --skill slidev
```

Invoke it in Codex with `$slidev`, or let the agent select it for a matching task.

The source code of the skill is [here](https://github.com/slidevjs/slidev/tree/main/skills/slidev).

### Example Prompts

Once installed, you can ask agents to help with various Slidev tasks:

```
Create a Slidev presentation about TypeScript generics with code examples
```

```
Add a two-column slide with code on the left and explanation on the right
```

```
Set up click animations to reveal bullet points one by one
```

```
Create a Slidev talk about a message queue with a custom visual style, a diagram,
and a code walkthrough. Use the available browser tools to review the slides
and click states, then refine the result.
```

```
Export this deck as an editable PPTX, inspect the exported result, and report
which content remains editable.
```

### What's Included

The Slidev skill provides knowledge about:

- Markdown syntax, slide separators, and frontmatter
- Click animations and transitions
- Code highlighting, Monaco editor, and magic-move
- Diagrams (Mermaid, PlantUML) and LaTeX math
- [Built-in and custom layouts](./layout), [Vue components](./component), images, and styling
- Exporting and hosting options

## Preview and Review

Agents with browser tools can open the running presentation and inspect its rendered appearance. In the Codex desktop app, you can ask it to use the built-in browser for this review. The MCP navigation tool can select a slide and click state, while the browser tools provide the visual inspection; navigation alone does not capture a screenshot.

Ask the agent to inspect the exported artifact too when requesting PDF or PPTX. In particular, browser appearance does not establish PowerPoint rendering or editability. See [Exporting](./exporting) for the differences between image and editable PPTX.

## VS Code Extension

The <LinkInline link="features/vscode-extension" /> provides Language Model Tools that allow VS Code's Copilot and other AI assistants to interact with your Slidev project directly. These tools enable AI to:

- Get information about the active slide and project
- Retrieve content of specific slides
- List and search slides by title
- Navigate between slides

See <LinkInline link="features/vscode-extension#ai-integration" /> for more details.
