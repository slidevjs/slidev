---
name: icons
description: Using open-source icons in slides
---

# Icons

Use any open-source icon directly in markdown. Powered by unplugin-icons and Iconify.

## Installation

```bash
pnpm add @iconify-json/[collection-name]
```

## Usage

Use component syntax `<collection-icon-name />`:

```md
<mdi-account-circle />
<carbon-badge />
<uim-rocket />
<logos-vue />
```

## Popular Collections

- `@iconify-json/mdi` - Material Design Icons
- `@iconify-json/carbon` - Carbon Design
- `@iconify-json/logos` - SVG Logos
- `@iconify-json/twemoji` - Twitter Emoji

## Styling

Style like any HTML element:

```html
<uim-rocket class="text-3xl text-red-400 mx-2" />
<uim-rocket class="text-3xl text-orange-400 animate-ping" />
```

## Browse Icons

- https://icones.js.org/
- https://icon-sets.iconify.design/
