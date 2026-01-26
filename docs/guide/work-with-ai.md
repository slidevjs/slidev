# Work with AI

Thanks to Slidev being markdown-based, it works great with AI coding agents.

## Skills

Slidev provides official [skills](https://code.claude.com/docs/en/skills) for AI coding agents, enabling them to understand Slidev's syntax, features, and best practices when helping you create presentations.

### Installation

Install the Slidev skill to your AI coding agent:

```bash
npx add-skill slidevjs/slidev
```

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
Configure the presentation for PDF export with speaker notes
```

### What's Included

The Slidev skill provides knowledge about:

- Markdown syntax, slide separators, and frontmatter
- Click animations and transitions
- Code highlighting, Monaco editor, and magic-move
- Diagrams (Mermaid, PlantUML) and LaTeX math
- Built-in layouts and components
- Exporting and hosting options

## VS Code Extension

The <LinkInline link="features/vscode-extension" /> provides Language Model Tools that allow VS Code's Copilot and other AI assistants to interact with your Slidev project directly. These tools enable AI to:

- Get information about the active slide and project
- Retrieve content of specific slides
- List and search slides by title
- Navigate between slides

See <LinkInline link="features/vscode-extension#ai-integration" /> for more details.
