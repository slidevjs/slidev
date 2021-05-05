# Write a Theme

To get started, we recommend you use our generator for scaffolding your first theme

```bash
$ npm init slidev-theme
```

Then you can modify and play with it. You can also refer to the [official themes](/themes/gallery) as examples.

## Capability

A theme can contribute to the following points:

- Global styles
- Provide web fonts
- Provide custom layouts or override the existing one
- Provide custom components or override the existing one
- Extend Windi CSS configurations
- Configure tools like Monaco and Prism

## Setup

To set up the testing playground for your theme, you can create `example.md` with the following frontmatter, to tell Slidev you are not inheriting from any existing theme.

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

To publish your theme, simply run `npm publish` and you are good to go. There is no build process required (which means you can directly publish `.vue` and `.ts` files, Slidev is smart enough to understand them).

Theme contribution points follow the same conventions as local customization, please refer to [the docs for the naming conventions](/custom/). 

## Color Schema

By default, Slidev assumes themes support both light mode and dark mode. If you only want your theme be presented in a designed color schema, you will need to specify it explicitly in `package.json`

```json
// package.json
{
  "name": "slidev-theme-my-cool-theme",
  "keywords": [
    "slidev-theme",
    "slidev"
  ],
  "slidev": {
    "colorSchema": "light" // or "dark" or "both"
  }
}
```

## Highlighter

Syntax highlighting colors are also provided in the theme. We support both [Prism](https://prismjs.com/) and [Shiki](https://github.com/shikijs/shiki). For more information please refer to [the syntax highlighting docs](/custom/highlighters).

You can support either one of them, or both. Refer to the default theme for configurations examples [prism.css](https://github.com/slidevjs/slidev/blob/main/packages/theme-default/styles/prism.css) / [shiki.ts](https://github.com/slidevjs/slidev/blob/main/packages/theme-default/setup/shiki.ts).

Also, remember to specify the supported highlighters in your `package.json`

```json
// package.json
{
  "slidev": {
    "highlighter": "shiki" // or "prism" or "all"
  }
}
```
