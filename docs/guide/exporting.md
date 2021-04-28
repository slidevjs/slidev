# Exporting

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
allow-download: true
---
```

It will generate a pdf file along with the build. And a download button will appear in the SPA.

If you are building it in a CI environment, you might need to have [`playwright-chromium`](https://playwright.dev/docs/installation#download-single-browser-binary) installed as well. Learn more [here](https://playwright.dev/docs/ci)

