---
name: exporting
description: Export presentations to PDF, PPTX, PNG, or Markdown
---

# Exporting Slides

Export presentations to PDF, PPTX, PNG, or Markdown.

## Browser Exporter

Access at `http://localhost:3030/export`:
- Select format and options
- Preview and download

## CLI Export

Requires playwright:
```bash
pnpm add -D playwright-chromium
```

### PDF Export

```bash
slidev export
slidev export --output my-slides.pdf
```

### PowerPoint Export

```bash
slidev export --format pptx
```

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

Export each click as separate page:
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

Use `--per-slide` or use `slide-top.vue` instead of `global-top.vue`.

### Broken Emojis

Use system fonts or install emoji font on server.

### CI/CD Export

Install playwright browsers:
```bash
npx playwright install chromium
```
