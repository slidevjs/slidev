# Exporting

> Exporting is relying on [Playwright](https://playwright.dev) to do the rendering, you will need to install [`playwright-chromium`](https://playwright.dev/docs/installation#download-single-browser-binary) for using this feature.
> If you are doing exporting in a CI environment, [this guide](https://playwright.dev/docs/ci) could also be helpful.

## PDF

Exporting your slides into PDF by the following command

```bash
$ npm i -D playwright-chromium
$ slidev export
```

After a few seconds, your slides will be ready at `./slides-exports.pdf`.

## PNGs

Passing the `--format png` option, it will export PNG images for each slide.

```bash
$ slidev export --format png
```

## Single-Page Application (SPA)

You can build the slides into a self hostable SPA by:

```bash
$ slidev build
```

The dist will be available under `dist/` and then you can host them on [GitHub Pages](https://pages.github.com/), [Netlify](https://netlify.app/), [Vercel](https://vercel.com/), or whatever you want. And share your slides with the world with a single link.

### Provide Downloadable PDF

You can provide a downloadable PDF to the viewers of your SPA. You can enable it by the following config:

```md
---
download: true
---
```

It will generate a pdf file along with the build. And a download button will appear in the SPA.

You can also provide a custom url to the PDF. And if so the rendering process will be skipped.

```md
---
download: 'https://myside.com/my-talk.pdf'
---
```

### Examples

Here are a few examples of the exported SPA:

- [Starter Template](https://sli.dev/demo/starter)
- [Composable Vue](https://talks.antfu.me/2021/composable-vue) by [Anthony Fu](https://github.com/antfu)
