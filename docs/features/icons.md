---
relates:
  - Iconify: https://iconify.design/
  - Icones: https://icones.js.org/
  - unplugin-icons: https://github.com/antfu/unplugin-icons
tags: [components]
description: |
  Use icons from virtually all open-source icon sets directly in your markdown.
---

# Icons

Slidev allows you to have access to virtually all open-source icon sets **directly** in your markdown after installing the corresponding package. Powered by [`unplugin-icons`](https://github.com/antfu/unplugin-icons) and [Iconify](https://iconify.design/).

The naming follows [Iconify](https://iconify.design/)'s convention of `{collection-name}-{icon-name}`. For example:

- `<mdi-account-circle />` - <mdi-account-circle /> from [Material Design Icons](https://github.com/Templarian/MaterialDesign) - [`@iconify-json/mdi`](https://npmjs.com/package/@iconify-json/mdi)
- `<carbon-badge />` - <carbon-badge /> from [Carbon](https://github.com/carbon-design-system/carbon/tree/main/packages/icons) - [`@iconify-json/carbon`](https://npmjs.com/package/@iconify-json/carbon)
- `<uim-rocket />` - <uim-rocket /> from [Unicons Monochrome](https://github.com/Iconscout/unicons) - [`@iconify-json/uim`](https://npmjs.com/package/@iconify-json/uim)
- `<twemoji-cat-with-tears-of-joy />` - <twemoji-cat-with-tears-of-joy /> from [Twemoji](https://github.com/twitter/twemoji) - [`@iconify-json/twemoji`](https://npmjs.com/package/@iconify-json/twemoji)
- `<logos-vue />` - <logos-vue /> from [SVG Logos](https://github.com/gilbarbara/logos) - [`@iconify-json/logos`](https://npmjs.com/package/@iconify-json/logos)
- And much more...

::: code-group

```bash [pnpm]
pnpm add @iconify-json/[the-collection-you-want]
```

```bash [npm]
npm install @iconify-json/[the-collection-you-want]
```

```bash [yarn]
yarn add @iconify-json/[the-collection-you-want]
```

```bash [bun]
bun add @iconify-json/[the-collection-you-want]
```

```bash [deno]
deno add jsr:@iconify-json/[the-collection-you-want]
```

:::

We use [Iconify](https://iconify.design) as our data source of icons. You need to install the corresponding icon-set in `dependencies` by following the `@iconify-json/*` pattern. For example, `@iconify-json/mdi` for [Material Design Icons](https://materialdesignicons.com/), `@iconify-json/tabler` for [Tabler](https://tabler-icons.io/). You can refer to [Icônes](https://icones.js.org/) or [Iconify](https://icon-sets.iconify.design/) for all the collections available.

### Styling Icons

You can style the icons just like other HTML elements. For example:

```html
<uim-rocket />
<uim-rocket class="text-3xl text-red-400 mx-2" />
<uim-rocket class="text-3xl text-orange-400 animate-ping" />
```

<uim-rocket />
<uim-rocket class="text-3xl text-red-400 mx-2" />
<uim-rocket class="text-3xl text-orange-400 animate-ping ml-2" />
