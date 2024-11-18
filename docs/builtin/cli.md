# Slidev CLI

`@slidev/cli` exposes a binary called `slidev` that you can use to develop, build, and export your slides.

## Prerequisites

To use the CLI, you can either install `@slidev/cli` globally or install it locally in your Node.js project. If you created your project with `npm init slidev`, the CLI is already installed locally.

::: warning
Usually `npx slidev` is not supported because the package name is actually `@slidev/cli`.
:::

The CLI options of the commands obey the following conventions:

- the value of the option can be passed after a space or a `=` character:

  Example: `slidev --port 8080` is equivalent to `slidev --port=8080`

- `true` can be omitted for boolean options:

  Example: `slidev --open` is equivalent to `slidev --open true`

::: info

If you use npm, please don't forget to add `--` before the options to pass them to Slidev:

```bash
npm run slidev -- --remote --port 8080 --open
```

:::

## `slidev [entry]` {#dev}

Start a local server for Slidev.

- `[entry]` (`string`, default: `slides.md`): path to the markdown file containing your slides.

Options:

- `--port`, `-p` (`number`, default: `3030`): port number.
- `--open`, `-o` (`boolean`, default: `false`): open in the browser.
- `--remote [password]` (`string`): listen to the public host and enable remote control, if a value is passed then the presenter mode is private and only accessible by passing the given password in the URL query `password` parameter.
- `--bind` (`string`, default: `0.0.0.0`): specify which IP addresses the server should listen on in the remote mode.
- `--log` (`'error', 'warn', 'info', 'silent'`, default: `'warn'`): Log level.
- `--force`, `-f` (`boolean`, default: `false`): force the optimizer to ignore the cache and re-bundle.
- `--theme`, `-t` (`string`): override theme.

## `slidev build [entry]` {#build}

Build a hostable SPA. See <LinkInline link="guide/hosting" /> for more details.

- `[entry]` (`string`, default: `slides.md`): path to the slides markdown file.

Options:

- `--out`, `-o` (`string`, default: `dist`): output directory
- `--base` (`string`, default: `/`): base URL (see https://vitejs.dev/config/shared-options.html#base)
- `--download` (`boolean`, default: `false`): allow the download of the slides as a PDF inside the SPA
- `--theme`, `-t` (`string`): override theme

## `slidev export [...entry]` {#export}

Export slides to PDF (or other format). See <LinkInline link="guide/exporting" /> for more details.

- `[entry]` (`string`, default: `slides.md`): path to the slides markdown entry.

Options:

- `--output` (`string`, default: use `exportFilename` (see https://sli.dev/custom/#frontmatter-configures) or use `[entry]-export`): path to the output.
- `--format` (`'pdf', 'png', 'pptx', 'md'`, default: `'pdf'`): output format.
- `--timeout` (`number`, default: `30000`): timeout for rendering the print page (see https://playwright.dev/docs/api/class-page#page-goto).
- `--range` (`string`): page ranges to export (example: `'1,4-5,6'`).
- `--dark` (`boolean`, default: `false`): export as dark theme.
- `--with-clicks`, `-c` (`boolean`, default: `false`): export pages for every click animation (see https://sli.dev/guide/animations.html#click-animation).
- `--theme`, `-t` (`string`): override theme.
- `--omit-background` (`boolean`, default: `false`): remove the default browser background

## `slidev format [entry]` {#format}

Format the markdown file. Note that this won't format the content of the slides, only the organization of the markdown file.

- `[entry]` (`string`, default: `slides.md`): path to the slides markdown entry.

## `slidev theme [subcommand]` {#theme}

Theme-related operations.

Subcommands:

- `eject [entry]`: Eject the current theme into the local file system. See <LinkInline link="features/eject-theme" />.
  - `[entry]` (`string`, default: `slides.md`): path to the slides markdown entry.
  - Options:
    - `--dir` (`string`, default: `theme`): the output dir.
    - `--theme`, `-t` (`string`): override theme.
