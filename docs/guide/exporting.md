---
outline: deep
---

# Exporting

Usually the slides are displayed in a web browser, but you can also export them to PDF, PPTX, PNG, Markdown, or standalone HTML files for sharing or printing. This feature is available through the CLI command [`slidev export`](../builtin/cli#export).

Interactive features may not be available in static exports. Standalone HTML preserves local interactivity without hosting. You can also build and host your slides as a web application. See [Building and Hosting](./hosting) for more information.

## The Browser Exporter <Badge> Recommended </Badge> {#browser}

> Available since v0.50.0-beta.11

Slidev provides a UI in the browser for exporting your slides. You can access it by clicking the "Export" button in "More options" menu in the [navigation bar](./ui#navigation-bar), or go to `http://localhost:<port>/export` directly.

In the UI, you can export the slides as PDF, or capture the slides as images and download them as a PPTX or zip file. Editable PPTX is only available via the [CLI](#editable-pptx).

Note that browsers other than **modern Chromium-based browsers** may not work well with the exporting UI. If you encounter any issues, please try use the CLI instead.

> The following content of this page is for the CLI only.

## The CLI {#cli}

Exporting to PDF, PPTX, or PNG relies on [Playwright](https://playwright.dev) for rendering the slides. Therefore [`playwright-chromium`](https://npmjs.com/package/playwright-chromium) is required to be installed in your project:

::: code-group

```bash [pnpm]
$ pnpm add -D playwright-chromium
```

```bash [npm]
$ npm i -D playwright-chromium
```

```bash [yarn]
$ yarn add -D playwright-chromium
```

```bash [bun]
$ bun add -D playwright-chromium
```

```bash [deno]
$ deno add -D npm:playwright-chromium
```

:::

## Formats

### Standalone HTML

Export the presentation as one interactive HTML file that recipients can open directly in a modern browser, without installing Slidev or running a server:

```bash
$ slidev export --format html
$ slidev export --format html --output presentation.html --without-notes
```

HTML export uses the production build pipeline and does **not** require Playwright. JavaScript, CSS, supported static assets, fonts, and local media are embedded in the file. Identical asset payloads are stored only once. Navigation uses hash routing; click reveals, animations, and local component interactions remain interactive.

Speaker notes are included by default, just as in a normal build. Use `--without-notes` before distributing a deck with private notes. Review redistribution rights for embedded fonts, images, and media.

#### File Size and Images

Set a hard limit on the final, uncompressed HTML file size, in bytes:

```bash
$ slidev export --format html --max-bytes 8000000
$ slidev export --format html --max-bytes 8000000 --image-max-width 1920 --image-max-height 1080 --image-quality 85
```

Or configure defaults in headmatter:

```yaml
---
export:
  html:
    maxBytes: 8000000
    images:
      maxWidth: 1920
      maxHeight: 1080
      quality: 85
---
```

CLI flags override individual headmatter settings. No size cap or image transformation is enabled by default. `maxBytes` includes base64 encoding, application code, fonts, and all other HTML overhead. Exactly the specified number of bytes is allowed. An oversized export fails with asset-size diagnostics and preserves an existing destination file; it never silently lowers quality or removes content.

Image dimensions are positive integers and preserve aspect ratio without upscaling. `quality` is an integer from 1 to 100 for JPEG, WebP, and AVIF. PNG resizing is lossless; SVG and animated images are not rasterized or flattened. Resizing JPEG requires an explicit quality. WebP/AVIF use lossless encoding when no quality is specified. Sources are never modified, and audio/video are not recompressed. A deck containing large media may not fit the requested budget.

#### Online Resources

By default, HTML export embeds supported static resources and rejects known live embeds. To retain online resources, enable `allowRemote`:

```bash
$ slidev export --format html --allow-remote
```

Or configure the headmatter:

```yaml
---
export:
  html:
    allowRemote: true
---
```

With this option, HTTP(S) resources remain online instead of being downloaded. This includes remote images, fonts, stylesheets, scripts, media, and embedded documents. YouTube, Tweets, BlueSky, and remote iframes are permitted. Protocol-relative resource URLs use HTTPS. Local assets remain embedded. Export prints a connectivity warning, and the resulting file is not guaranteed to work offline. Remote services can still reject embedding through their own browser policies.

Use `--no-allow-remote` to override a headmatter opt-in. The option applies only to HTML export. Image processing applies only to embedded images, and `maxBytes` measures the HTML file, not its retained remote resources. Missing local assets, local embedded documents, `srcdoc`, unresolved worker/application chunks, and custom CSP/base tags remain errors.

#### Offline Limitations

Without `allowRemote`, known live embeds such as YouTube, Tweets, and iframes, external scripts, and embedded documents are rejected. Configured web-font stylesheets and other supported declared static resources are downloaded during export, so the build machine may need internet access. Downloads are bounded to 30 seconds per resource, 32 MiB per resource, and 128 MiB total.

Normal hyperlinks remain links. Arbitrary component-generated network requests, dynamically constructed asset paths, nested external resources inside custom assets, and cross-window presenter synchronization are not guaranteed offline. Use local data and supported static asset references, and test the delivered HTML with networking disabled. Standalone HTML is not a PWA and does not include service workers, hosting redirects, or an automatically generated PDF.

HTML exports the whole deck with its reveals. Print-only flags such as `--range`, `--with-clicks`, `--with-toc`, `--per-slide`, and rendering timing/scale options do not apply. Explicit HTML-only flags are rejected for other export formats.

### PDF

After installing `playwright-chromium` as described above, you can export your slides to PDF using the following command:

```bash
$ slidev export
```

By default, the PDF will be placed at `./slides-export.pdf`.

### PPTX

Slidev can also export your slides as a PPTX file:

```bash
$ slidev export --format pptx
```

Note that all the slides in the PPTX file will be exported as images, so the text will not be selectable. Presenter notes will be conveyed into the PPTX file on a per-slide basis.

In this mode, the `--with-clicks` option is enabled by default. To disable it, pass `--with-clicks false`.

### Editable PPTX

If the recipient needs to edit the deck rather than only present it, export it with native shapes instead of pictures:

```bash
$ slidev export --format pptx-editable
```

The slides are measured in the browser and rebuilt as PowerPoint shapes, so text is selectable and editable, boxes can be moved and recolored, and presenter notes are carried over as usual. This does not replace `--format pptx`, which stays the most visually faithful option.

What stays a picture: anything PowerPoint has no equivalent for. That includes SVG (so Mermaid diagrams and icons), `<canvas>`, `<iframe>`, videos, KaTeX formulas, CSS gradients, `filter`, `backdrop-filter`, `mix-blend-mode` and `clip-path`. Only the element concerned becomes a picture, not the whole slide.

If a slide cannot be rebuilt safely, or ends up mostly pictures anyway, it falls back to the same image export used by `--format pptx`, for that slide alone, and the reason is printed.

Worth knowing before you send the file on:

- A `.pptx` names fonts, it does not embed them. The export prints which font families it referenced; recipients need those installed or PowerPoint will substitute.
- PowerPoint does not measure text exactly as a browser does, so a long paragraph may wrap onto a different number of lines.
- Decorations a theme draws with `::before` or `::after` in normal flow are left out, and the export lists them. Code block line numbers are one of these: they come from a CSS counter, which has no text and no box that a computed style can report.

Like `--format pptx`, this exports one slide per click step unless you pass `--with-clicks false`. `--per-slide` is not supported with it.

### PNGs and Markdown

When passing in the `--format png` option, Slidev will export PNG images for each slide instead of a PDF:

```bash
$ slidev export --format png
```

You can also compile a markdown file composed of compiled png using `--format md`:

```bash
$ slidev export --format md
```

## Presenter Notes {#presenter-notes}

To print your presenter notes separately from the slides, use [`slidev export-notes`](../builtin/cli#export-notes). This requires the same [Playwright installation](#cli) as slide exports.

```bash
$ slidev export-notes
```

By default, this creates `./slides-export-notes.pdf`. The PDF includes the notes, slide titles, and slide numbers for slides with notes. Slides without notes and slide previews are not included.

To use a different entry file or output filename:

```bash
$ slidev export-notes talk.md --output speaker-notes.pdf
```

## Options

Here are some common options you can use with the `slidev export` command. For a full list of options, see the [CLI documentation](../builtin/cli#export).

### Export Clicks Steps

By default, Slidev exports one page per slide with clicks animations disabled (except for PPTX formats, which export one slide per click step). If you want to export slides with multiple steps into multiple pages, pass the `--with-clicks` option:

```bash
$ slidev export --with-clicks
```

### Output Filename

You can specify the output filename with the `--output` option:

```bash
$ slidev export --output my-pdf-export
```

Or in the headmatter configuration:

```yaml
---
exportFilename: my-pdf-export
---
```

### Export with Range

By default, all slides in the presentation are exported. If you want to export a specific slide or a range of slides you can set the `--range` option and specify which slides you would like to export:

```bash
$ slidev export --range 1,6-8,10
```

This option accepts both specific slide numbers and ranges. The example above would export slides 1,6,7,8 and 10.

### Multiple Exports

You can also export multiple slides at once:

```bash
$ slidev export slides1.md slides2.md
```

Or (only available in certain shells):

```bash
$ slidev export *.md
```

In this case, each input file will generate its own PDF file.

### Dark Mode

In case you want to export your slides using the dark version of the theme, use the `--dark` option:

```bash
$ slidev export --dark
```

### Timeouts

For big presentations, you might want to increase the Playwright timeout with `--timeout`:

```bash
$ slidev export --timeout 60000
```

### Wait

Some parts of your slides may require a longer time to render. You can use the `--wait` option to have an extra delay before exporting:

```bash
$ slidev export --wait 10000
```

There is also a `--wait-until` option to wait for a state before exporting each slide. If you keep encountering timeout issues, you can try setting this option:

```bash
$ slidev export --wait-until none
```

Possible values:

- `'networkidle'` - (_default_) consider operation to be finished when there are no network connections for at least `500` ms. This is the safest, but may cause timeouts.
- `'domcontentloaded'` - consider operation to be finished when the `DOMContentLoaded` event is fired.
- `'load'` - consider operation to be finished when the `load` event is fired.
- `'none'` - do not wait for any event.

::: warning
When specifying values other than `'networkidle'`, please make sure the printed slides are complete and correct. If some contents are missing, you may need to use the `--wait` option.
:::

### Executable Path

Chromium may miss some features like codecs that are required to decode some videos. You can set the browser executable path for Playwright to your Chrome or Edge using `--executable-path`:

```bash
$ slidev export --executable-path [path_to_chromium]
```

### PDF Outline

> Available since v0.36.10

You can generate the PDF outline by passing the `--with-toc` option:

```bash
$ slidev export --with-toc
```

### Omit Background

When exporting to PNGs, you can remove the default browser background by passing `--omit-background`:

```bash
$ slidev export --omit-background
```

The default browser background is the white background visible on all browser windows and is different than other backgrounds applied throughout the application using CSS styling. [See Playwright docs](https://playwright.dev/docs/api/class-page#page-screenshot-option-omit-background). You will then need to apply additional CSS styling to the application to reveal the transparency.

Here is a basic example that covers all backgrounds in the application:

```css
* {
  background: transparent !important;
}
```

## Troubleshooting

### Missing Content or Animation not Finished

If you find that some content is missing or the animations are not finished in the exported PDF, you can try adding a wait time before exporting each slide:

```bash
$ slidev export --wait 1000
```

### Broken Emojis

If the PDF or PNG are missing Emojis, you are likely missing required fonts (such as. e.g. [Google's _Noto Emoji_](https://fonts.google.com/noto/specimen/Noto+Emoji)) in your environment.

This can affect e.g. CI/CD-like in-container sort of Linux environments. It can be fixed e.g. like this:

```bash
$ curl -L --output NotoColorEmoji.ttf https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf
$ sudo mv NotoColorEmoji.ttf /usr/local/share/fonts/
$ fc-cache -fv
```

### Wrong Context in Global Layers

See the tip in https://sli.dev/features/global-layers.
