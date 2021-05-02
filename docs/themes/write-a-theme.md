# Write a Theme

To get started, we recommend you to use our generator to scaffolding your first theme

```bash
$ npm init slidev-theme
```

Then you can modify and play with it. Also refer to the [official themes](/themes/gallery) as examples.

## Capability

A theme can contribute to the following points:

- Global styles
- Provide web fonts
- Provide custom layouts or override existing one
- Provide custom components or override existing one
- Extend Windi CSS configurations
- Configure tools like Monaco and Prism

## Setup

To setup the testing playground for your theme, you can create `example.md` with the following frontmatter, to tell Slidev you are not inherit from any existing theme.

```md
---
theme: none
---
```

Optionally, you can also add some scripts to your `packages.json`

```json
// package.json
{
  "scripts": {
    "dev": "slidev example.md",
    "build": "slidev build example.md",
    "export": "slidev export example.md",
    "screenshot": "slidev export example.md --format png"
  }
}
```

To publish your theme, simply run `npm publish` and you are good to go. There is not build process required (which means you can directly publish `.vue` and `.ts` files, Slidev is smart enough to understand them).

Theme contribution points follow the same conventions as local customization, please refer to [the docs for the naming conventions](/custom/). 

