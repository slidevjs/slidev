---
outline: deep
---

# Exporting

Usually the slides are displayed in a web browser, but you can also export them to PDF, PPTX, PNG, or Markdown files for sharing or printing. This feature is available through the CLI command [`slidev export`](../builtin/cli#export).

However, interactive features in your slides may not be available in the exported files. You can build and host your slides as a web application to keep the interactivity. See [Building and Hosting](./hosting) for more information.

## Preparation

Exporting to PDF, PPTX, or PNG relies on [Playwright](https://playwright.dev) for rendering the slides. Therefore [`playwright-chromium`](https://npmjs.com/package/playwright-chromium) is required to be installed in your project:

::: code-group

```bash [npm]
$ npm i -D playwright-chromium
```

```bash [pnpm]
$ pnpm add -D playwright-chromium
```

```bash [yarn]
$ yarn add -D playwright-chromium
```

:::

## Formats

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

### PNGs and Markdown

When passing in the `--format png` option, Slidev will export PNG images for each slide instead of a PDF:

```bash
$ slidev export --format png
```

You can also compile a markdown file composed of compiled png using `--format md`:

```bash
$ slidev export --format md
```

## Options

Here are some common options you can use with the `slidev export` command. For a full list of options, see the [CLI documentation](../builtin/cli#export).

### Export Clicks Steps

By default, Slidev exports one page per slide with clicks animations disabled. If you want to export slides with multiple steps into multiple pages, pass the `--with-clicks` option:

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
