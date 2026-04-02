# Slidev Skills for Claude Code

Agent skills that help Claude Code understand and work with [Slidev](https://sli.dev) presentations.

## Installation

```bash
npx skills add slidevjs/slidev
```

This will add the Slidev skill to your Claude Code configuration.

## What's Included

The Slidev skill provides Claude Code with knowledge about:

- **Core Syntax** - Markdown syntax, slide separators, frontmatter
- **Animations** - Click animations, transitions, motion effects
- **Code Features** - Line highlighting, Monaco editor, code groups, magic-move
- **Diagrams** - Mermaid, PlantUML, LaTeX math
- **Layouts** - Built-in layouts, slots, global layers
- **Presenter Mode** - Recording, timer, remote access
- **Exporting** - PDF, PPTX, PNG, SPA hosting

## Usage

Once installed, Claude Code will automatically use Slidev knowledge when:

- Creating new presentations
- Adding slides with code examples
- Setting up animations and transitions
- Configuring themes and layouts
- Exporting presentations

### Example Prompts

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

## Documentation

- [Slidev Documentation](https://sli.dev)
- [Theme Gallery](https://sli.dev/resources/theme-gallery)
- [Showcases](https://sli.dev/resources/showcases)

## License

MIT
