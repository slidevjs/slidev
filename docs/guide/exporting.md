# Exporting

## PDF

Exporting your slides into PDF by the following command

```bash
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

By default, it also generates a pdf file along with the build. And in the SPA, there will be a button for viewers to download the slides as PDF. If you don't want that, you can disable it by:

```md
---
allow-download: false
---
```
