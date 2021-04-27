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

> ⚗️ Experimental

Since Slidev is a web app, there is no reason you can't host it.

You can build the slides into a self hostable SPA by:

```bash
$ slidev build
```

The dist will be available under `dist/` and then you can host them on [GitHub Pages](https://pages.github.com/), [Netlify](https://netlify.app/), [Vercel](https://vercel.com/), or whatever you want. And share your slides with the world with a single link.

> Please note there are some issues on build mode with the Monaco integrations. We will focus on the overall features of Slidev and deal with it later.
