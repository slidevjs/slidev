---
name: exporting
description: Export presentations to PDF, PPTX, PNG, Markdown, or standalone HTML
---

# Exporting Slides

Export presentations to PDF, PPTX, PNG, Markdown, or standalone HTML.

## Browser Exporter

Access at `http://localhost:3030/export`:
- Select format and options
- Preview and download
- PPTX here is image-based; use the CLI for `pptx-editable`

## CLI Export

Static CLI exports require Playwright; standalone HTML does not:
```bash
pnpm add -D playwright-chromium
```

### Standalone HTML Export

```bash
slidev export --format html --output presentation.html --without-notes
slidev export --format html --max-bytes 8000000 --image-max-width 1920 --image-quality 85
slidev export --format html --allow-remote
```

Creates one interactive file opened directly in a browser with hash routing and embedded static assets, fonts, and media. Speaker notes are included unless removed. A hard byte cap checks the finished file after lossless deduplication; failure preserves existing output. Images remain unchanged unless dimensions/quality are configured, and sources are never modified.

Headmatter defaults live under `export.html.maxBytes`, `export.html.images` (`maxWidth`, `maxHeight`, `quality`), and `export.html.allowRemote`; individual CLI flags take precedence. JPEG resizing requires explicit quality. Print-only options do not apply.

`allowRemote` defaults to `false`. Enable it to retain HTTP(S) resources and permit known online embeds, including remote iframes. Export warns that connectivity is required. Local assets remain embedded. Use `--no-allow-remote` to override a headmatter opt-in. Size caps cover only the HTML bytes, not retained online resources; image processing affects only embedded images. Missing local files, local embedded documents, `srcdoc`, custom CSP/base tags, and unresolved worker/application chunks remain errors. Browser security restrictions still apply.

Without this opt-in, live embeds and external scripts/documents are rejected. Arbitrary runtime fetches/dynamic paths are not guaranteed offline. Test the default export offline and check asset redistribution rights.

### PDF Export

```bash
slidev export
slidev export --output my-slides.pdf
```

### PowerPoint Export

```bash
slidev export --format pptx           # each slide as an image
slidev export --format pptx-editable  # native shapes, selectable text
```

`pptx-editable` measures the rendered slides and rebuilds them as PowerPoint shapes. SVG (including Mermaid), canvas, iframes, KaTeX formulas, gradients and CSS filters stay pictures, and any slide that cannot be rebuilt falls back to the image export on its own. Fonts are named, not embedded. `--per-slide` is not supported with it.

### PNG Export

```bash
slidev export --format png
slidev export --format png --range 1-5
```

### Markdown Export

```bash
slidev export --format md
```

## Export Options

### With Click Steps

Export each click as separate page (default for PPTX formats):
```bash
slidev export --with-clicks
```

### Dark Mode

```bash
slidev export --dark
```

### Slide Range

```bash
slidev export --range 1,4-7,10
```

### Table of Contents

PDF with clickable outline:
```bash
slidev export --with-toc
```

### Timeout

For slow-rendering slides:
```bash
slidev export --timeout 60000
```

### Wait

Wait before capture:
```bash
slidev export --wait 2000
```

### Wait Until

Wait condition:
```bash
slidev export --wait-until networkidle   # Default
slidev export --wait-until domcontentloaded
slidev export --wait-until load
slidev export --wait-until none
```

### Transparent Background

```bash
slidev export --omit-background
```

### Custom Browser

```bash
slidev export --executable-path /path/to/chrome
```

## Headmatter Options

```yaml
---
exportFilename: my-presentation
download: true              # Add download button in build
export:
  format: pdf
  timeout: 30000
  withClicks: false
---
```

## Troubleshooting

### Missing Content

Increase wait time:
```bash
slidev export --wait 3000 --timeout 60000
```

### Wrong Global Layer State

Use `--per-slide` (not supported with `pptx-editable`) or use `slide-top.vue` instead of `global-top.vue`.

### Broken Emojis

Use system fonts or install emoji font on server.

### CI/CD Export

Install playwright browsers:
```bash
npx playwright install chromium
```
