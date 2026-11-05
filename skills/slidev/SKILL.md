---
name: slidev
description: Create and present web-based slidedecks for developers using Slidev with Markdown, Vue components, code highlighting, animations, and interactive features. Use when building technical presentations, conference talks, code walkthroughs, teaching materials, or developer decks.
---

# Slidev - Presentation Slides for Developers

Web-based slides maker built on Vite, Vue, and Markdown.

## When to Use

- Technical presentations or slidedecks with live code examples
- Syntax-highlighted code snippets with animations
- Interactive demos (Monaco editor, runnable code)
- Mathematical equations (LaTeX) or diagrams (Mermaid, PlantUML)
- Record presentations with presenter notes
- Export to PDF, PPTX, or host as SPA
- Code walkthroughs for developer talks or workshops

## Quick Start

```bash
pnpm create slidev    # Create project
pnpm run dev          # Start dev server (opens http://localhost:3030)
pnpm run build        # Build static SPA
pnpm run export       # Export to PDF (requires playwright-chromium)
```

Use the existing project's scripts and package manager. Read the dev server's reported URL; port 3030 is the default, but another port may be selected.

## Authoring and Preview

Preserve an existing deck's theme and conventions when making focused edits. Choose the composition and tools that serve the material; built-in layouts are starting points, and custom Vue components, layouts, and CSS can extend them.

Load references for the features you need:

- Visual composition: [image layouts](references/core-layouts.md#image-layouts), [custom layouts](references/core-layouts.md#custom-layouts), [fonts](references/core-headmatter.md#fonts), [theme configuration](references/core-headmatter.md#theme--appearance), [scoped CSS](references/style-scoped.md), and [custom Vue components](references/core-components.md#custom-components). Put custom Vue components in `components/` and local images in `public/`, referenced as `/image.png`.
- Explanations and interaction: [click reveals](references/core-animations.md), [Magic Move](references/code-magic-move.md), [Mermaid](references/diagram-mermaid.md), or [runnable code](references/editor-monaco-run.md), as appropriate.
- Delivery: [exporting](references/core-exporting.md) for PDF/PPTX/images; [hosting](references/core-hosting.md) when publishing a web presentation is requested.

Use available browser tools, including an agent's built-in browser when available, to review the rendered slides and relevant click states. After editing, inspect the hot-reloaded result and refine the affected slides. [MCP navigation](references/tool-mcp.md) can select a slide and click state, but does not capture its appearance. Without browser tools, inspect exported slide images with available image tools and state any checks that remain unavailable.

When export is requested, inspect the exported artifact too; see [exporting](references/core-exporting.md) for format-specific checks and limitations.

## Basic Syntax

```md
---
theme: default
title: My Presentation
---

# First Slide

Content here

---

# Second Slide

More content

<!--
Presenter notes go here
-->
```

- `---` separates slides
- First frontmatter = headmatter (deck config)
- HTML comments = presenter notes

## Core References

| Topic | Description | Reference |
|-------|-------------|-----------|
| Markdown Syntax | Slide separators, frontmatter, notes, code blocks | [core-syntax](references/core-syntax.md) |
| Animations | v-click, v-clicks, motion, transitions | [core-animations](references/core-animations.md) |
| Headmatter | Deck-wide configuration options | [core-headmatter](references/core-headmatter.md) |
| Frontmatter | Per-slide configuration options | [core-frontmatter](references/core-frontmatter.md) |
| CLI Commands | Dev, build, export, theme commands | [core-cli](references/core-cli.md) |
| Components | Built-in Vue components | [core-components](references/core-components.md) |
| Layouts | Built-in slide layouts | [core-layouts](references/core-layouts.md) |
| Exporting | PDF, PPTX, PNG export options | [core-exporting](references/core-exporting.md) |
| Hosting | Build and deploy to various platforms | [core-hosting](references/core-hosting.md) |
| Global Context | $nav, $slidev, composables API | [core-global-context](references/core-global-context.md) |

## Feature Reference

### Code & Editor

| Feature | Usage | Reference |
|---------|-------|-----------|
| Line highlighting | `` ```ts {2,3} `` | [code-line-highlighting](references/code-line-highlighting.md) |
| Click-based highlighting | `` ```ts {1\|2-3\|all} `` | [code-line-highlighting](references/code-line-highlighting.md) |
| Line numbers | `lineNumbers: true` or `{lines:true}` | [code-line-numbers](references/code-line-numbers.md) |
| Scrollable code | `{maxHeight:'100px'}` | [code-max-height](references/code-max-height.md) |
| Code tabs | `::code-group` (requires `comark: true`) | [code-groups](references/code-groups.md) |
| Monaco editor | `` ```ts {monaco} `` | [editor-monaco](references/editor-monaco.md) |
| Run code | `` ```ts {monaco-run} `` | [editor-monaco-run](references/editor-monaco-run.md) |
| Edit files | `<<< ./file.ts {monaco-write}` | [editor-monaco-write](references/editor-monaco-write.md) |
| Code animations | `` ````md magic-move `` | [code-magic-move](references/code-magic-move.md) |
| TypeScript types | `` ```ts twoslash `` | [code-twoslash](references/code-twoslash.md) |
| Import code | `<<< @/snippets/file.js` | [code-import-snippet](references/code-import-snippet.md) |

### Diagrams & Math

| Feature | Usage | Reference |
|---------|-------|-----------|
| Mermaid diagrams | `` ```mermaid `` | [diagram-mermaid](references/diagram-mermaid.md) |
| PlantUML diagrams | `` ```plantuml `` | [diagram-plantuml](references/diagram-plantuml.md) |
| LaTeX math | `$inline$` or `$$block$$` | [diagram-latex](references/diagram-latex.md) |

### Layout & Styling

| Feature | Usage | Reference |
|---------|-------|-----------|
| Canvas size | `canvasWidth`, `aspectRatio` | [layout-canvas-size](references/layout-canvas-size.md) |
| Zoom slide | `zoom: 0.8` | [layout-zoom](references/layout-zoom.md) |
| Scale elements | `<Transform :scale="0.5">` | [layout-transform](references/layout-transform.md) |
| Layout slots | `::right::`, `::default::` | [layout-slots](references/layout-slots.md) |
| Scoped CSS | `<style>` in slide | [style-scoped](references/style-scoped.md) |
| Global layers | `global-top.vue`, `global-bottom.vue` | [layout-global-layers](references/layout-global-layers.md) |
| Draggable elements | `v-drag`, `<v-drag>` | [layout-draggable](references/layout-draggable.md) |
| Icons | `<mdi-icon-name />` | [style-icons](references/style-icons.md) |

### Animation & Interaction

| Feature | Usage | Reference |
|---------|-------|-----------|
| Click animations | `v-click`, `<v-clicks>` | [core-animations](references/core-animations.md) |
| Rough markers | `v-mark.underline`, `v-mark.circle` | [animation-rough-marker](references/animation-rough-marker.md) |
| Drawing mode | Press `C` or config `drawings:` | [animation-drawing](references/animation-drawing.md) |
| Direction styles | `forward:delay-300` | [style-direction](references/style-direction.md) |
| Note highlighting | `[click]` in notes | [animation-click-marker](references/animation-click-marker.md) |

### Syntax Extensions

| Feature | Usage | Reference |
|---------|-------|-----------|
| Comark syntax | `comark: true` + `{style="color:red"}` | [syntax-comark](references/syntax-comark.md) |
| Block frontmatter | `` ```yaml `` instead of `---` | [syntax-block-frontmatter](references/syntax-block-frontmatter.md) |
| Import slides | `src: ./other.md` | [syntax-importing-slides](references/syntax-importing-slides.md) |
| Merge frontmatter | Main entry wins | [syntax-frontmatter-merging](references/syntax-frontmatter-merging.md) |

### Presenter & Recording

| Feature | Usage | Reference |
|---------|-------|-----------|
| Recording | Press `G` for camera | [presenter-recording](references/presenter-recording.md) |
| Timer | `duration: 30min`, `timer: countdown` | [presenter-timer](references/presenter-timer.md) |
| Remote control | `slidev --remote` | [presenter-remote](references/presenter-remote.md) |
| Ruby text | `notesAutoRuby:` | [presenter-notes-ruby](references/presenter-notes-ruby.md) |

### Export & Build

| Feature | Usage | Reference |
|---------|-------|-----------|
| Export options | `slidev export` | [core-exporting](references/core-exporting.md) |
| Build & deploy | `slidev build` | [core-hosting](references/core-hosting.md) |
| Build with PDF | `download: true` | [build-pdf](references/build-pdf.md) |
| Cache images | Automatic for remote URLs | [build-remote-assets](references/build-remote-assets.md) |
| OG image | `seoMeta.ogImage` or `og-image.png` | [build-og-image](references/build-og-image.md) |
| SEO tags | `seoMeta:` | [build-seo-meta](references/build-seo-meta.md) |

**Export prerequisite**: CLI export uses `playwright-chromium`. If it is missing, add it using the project's package manager. For browser launch, timeout, or rendering errors, diagnose the reported cause; see [export troubleshooting](references/core-exporting.md#troubleshooting).

### Editor & Tools

| Feature | Usage | Reference |
|---------|-------|-----------|
| Side editor | Click edit icon | [editor-side](references/editor-side.md) |
| VS Code extension | Install `antfu.slidev` | [editor-vscode](references/editor-vscode.md) |
| Prettier | `prettier-plugin-slidev` | [editor-prettier](references/editor-prettier.md) |
| Eject theme | `slidev theme eject` | [tool-eject-theme](references/tool-eject-theme.md) |
| MCP server (AI agents) | `http://localhost:<port>/__mcp` or `slidev mcp` | [tool-mcp](references/tool-mcp.md) |

### Lifecycle & API

| Feature | Usage | Reference |
|---------|-------|-----------|
| Slide hooks | `onSlideEnter()`, `onSlideLeave()` | [api-slide-hooks](references/api-slide-hooks.md) |
| Navigation API | `$nav`, `useNav()` | [core-global-context](references/core-global-context.md) |

## Common Layouts

| Layout | Purpose |
|--------|---------|
| `cover` | Title/cover slide |
| `center` | Centered content |
| `default` | Standard slide |
| `two-cols` | Two columns (use `::right::`) |
| `two-cols-header` | Header + two columns |
| `image` / `image-left` / `image-right` | Image layouts |
| `iframe` / `iframe-left` / `iframe-right` | Embed URLs |
| `quote` | Quotation |
| `section` | Section divider |
| `fact` / `statement` | Data/statement display |
| `intro` / `end` | Intro/end slides |

## Resources

- Documentation: https://sli.dev
- Theme Gallery: https://sli.dev/resources/theme-gallery
- Showcases: https://sli.dev/resources/showcases
