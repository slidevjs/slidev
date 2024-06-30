# Command Line Interface (CLI)

`@slidev/cli` exposes a binary called `slidev` that you can use to develop, build, and export your slides.

::: warning
`pnpx slidev` is not supported because the package name is `@slidev/cli`.
:::

You can install `@slidev/cli` globally, or use it in a package.json script:

```json
{
  "script": {
    "dev": "slidev"
  }
}
```

In that case, you will be able to run `npm run dev`.

You can pass options to any command:

- boolean option are `true` if they are present, false otherwise (example: `slidev --open`)
- some options can have values you can add just after the option or by using the `=` character (example: `slidev --port 8080` or `slidev --port=8080`)

If you use npm, please don't forget to add `--` before the options to pass them to Slidev:

```bash
npm run slidev -- --open
```

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

Build a hostable SPA.

- `[entry]` (`string`, default: `slides.md`): path to the slides markdown file.

Options:

- `--out`, `-o` (`string`, default: `dist`): output dir.
- `--base` (`string`, default: `/`): base URL (see https://cli.vuejs.org/config/#publicpath)
- `--download` (`boolean`, default: `false`): allow the download of the slides as a PDF inside the SPA.
- `--theme`, `-t` (`string`): override theme.

## `slidev export [entry]` {#export}

Export slides to PDF (or other format). See [Exporting](/guide/exporting.html) for more details.

- `[entry]` (`string`, default: `slides.md`): path to the slides markdown entry.

Options:

- `--output` (`string`, default: use `exportFilename` (see https://sli.dev/custom/#frontmatter-configures) or use `[entry]-export`): path to the output.
- `--format` (`'pdf', 'png', 'pptx', 'md'`, default: `'pdf'`): output format.
- `--timeout` (`number`, default: `30000`): timeout for rendering the print page (see https://playwright.dev/docs/api/class-page#page-goto).
- `--range` (`string`): page ranges to export (example: `'1,4-5,6'`).
- `--dark` (`boolean`, default: `false`): export as dark theme.
- `--with-clicks`, `-c` (`boolean`, default: `false`): export pages for every click animation (see https://sli.dev/guide/animations.html#click-animations).
- `--theme`, `-t` (`string`): override theme.

## `slidev format [entry]` {#format}

Format the markdown file.

- `[entry]` (`string`, default: `slides.md`): path to the slides markdown entry.

## `slidev theme [subcommand]` {#theme}

Theme-related operations.

Subcommands:

- `eject [entry]`: Eject the current theme into the local file system
  - `[entry]` (`string`, default: `slides.md`): path to the slides markdown entry.
  - Options:
    - `--dir` (`string`, default: `theme`): the output dir.
    - `--theme`, `-t` (`string`): override theme.
