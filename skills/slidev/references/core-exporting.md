---
name: exporting
description: Export presentations to PDF, PPTX, PNG, or Markdown
---

# Exporting Slides

Export presentations to PDF, PPTX, PNG, or Markdown.

## Browser Exporter

Open `/export` at the running dev server URL (usually `http://localhost:3030/export`):
- Select format and options
- Preview and download

Browser PPTX export produces image slides. Use the CLI for editable PPTX.

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
slidev export --format pptx           # each slide as an image
slidev export --format pptx-editable  # native shapes, selectable text
```

`pptx-editable` measures the rendered slides and rebuilds them as PowerPoint shapes. SVG (including Mermaid), canvas, iframes, KaTeX formulas, gradients and CSS filters stay pictures, and any slide that cannot be rebuilt falls back to the image export on its own. Fonts are named, not embedded. `--per-slide` is not supported with it.

Choose the format according to the requested appearance and editability. Inspect the exported PPTX in an available presentation viewer, including representative text and complex visuals, and check export warnings for image fallbacks. Browser preview alone does not establish the PPTX's rendering or which elements remain editable.

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

Export click states as separate static slides/pages, not native PowerPoint animations. This is enabled by default for both PPTX formats; pass `--with-clicks false` to disable it. For other formats, enable it with:
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

### Browser Errors

If `playwright-chromium` is missing, install it with the project's package manager. A missing browser executable, failed asset, or navigation timeout has a different cause; inspect the error before changing dependencies. Use the browser installation command below or `--executable-path` when the error concerns the browser executable.

### Missing Content

Check for failed assets and rendering errors. If content needs more time to finish, increase wait time:
```bash
slidev export --wait 3000 --timeout 60000
```

### Wrong Global Layer State

For formats that support it, use `--per-slide`. For `pptx-editable`, which does not support this flag, use `slide-top.vue` instead of `global-top.vue` when the content needs per-slide context.

### Broken Emojis

Use system fonts or install emoji font on server.

### CI/CD Export

Install playwright browsers:
```bash
npx playwright install chromium
```
