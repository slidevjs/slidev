# Customizations

Slidev is fully customizable, from styling to tooling configurations. It allows you to configure the underneath tools like [Vite](/custom/config-vite), [Windi CSS](/custom/config-windicss), [Monaco](/custom/config-monaco), and so on.

## Directory Structure

Slidev uses some directory stricture conventions to minimalize the configure surface and make the functionality extensions flexible and intuitive.

The basic structure will be like

```bash
your-slidev/
  ├── components/       # custom components
  ├── layouts/          # custom layouts
  ├── public/           # static assets
  ├── setup/            # custom setup / hooks
  ├── styles/           # custom style
  ├── index.html        # injections to index.html
  ├── slides.md         # the main slides entry
  ├── vite.config.ts    # extending vite config
  └── windi.config.ts   # extending windicss config
```

All of them are optional, you can use

### Components

Conventions: `./components/*.{vue,js,ts,jsx,tsx}`

Components in side this directory can be directly used in the slides Markdown with the same component name as the file name.

For example:

```bash
your-slidev/
  ├── ...
  └── components/
      ├── MyComponent.vue
      └── HelloWorld.ts
```

```md
<!-- slides.md -->

# My Slide

<MyComponent :count="4"/>

<!-- both works -->
<hello-world foo="bar">
  Slot
</hello-world>
```

This feature is powered by [`vite-plugin-components`](https://github.com/antfu/vite-plugin-components), learn more there.

Slidev also provides some [built-in components](/builtin/components) for you to use.

### Layouts

Conventions: `./layouts/*.{vue,js,ts,jsx,tsx}`

```
your-slidev/
  ├── ...
  └── layouts/
      ├── cover.vue
      └── my-cool-theme.vue
```

You can put those components in any name and use it as the same name in your markdown.

```md
---
layout: my-cool-theme
---
```

When you provide the layouts with the same name as the layouts provided by Slidev built-in or the theme, it will be override with yours. The priority list is `local > theme > built-in`.

In the layout component, use `<slot/>` for placing the slide content. For example:

```html
<!-- default.vue -->
<template>
  <div class="layout-master default">
    <slot />
  </div>
</template>
```

### Public

Conventions: `./public/*`

Assets in this directory will be served at root path `/` during dev, and copied to the root of the dist directory as-is. Read more about [Vite's `public` directory](https://vitejs.dev/guide/assets.html#the-public-directory).

### Style

Conventions: `./style.css` | `./styles/index.{css,js,ts}`

Files follow this convention will be injected to the App root. When you need to import multiple css entries, you can create the following structure and managing the import order yourself.

```bash
your-slidev/
  ├── ...
  └── styles/
      ├── index.ts
      ├── base.css
      ├── code.css
      └── layouts.css
```

```ts
// styles/index.ts

import './base.css'
import './code.css'
import './layouts.css'
```

Styles will be processed by [Windi CSS](http://windicss.org/) and [PostCSS](https://postcss.org/), so you can use css nesting and [at-directives](https://windicss.org/features/directives.html) out-of-box. For example:

```less
.layout-master {
  @apply px-14 py-10 text-[1.1rem];

  h1, h2, h3, h4, p, div {
    @apply select-none;
  }

  pre, code {
    @apply select-text;
  }

  a {
    color: theme('colors.primary');
  }
}
```

[Learn more about the syntax](https://windicss.org/features/directives.html).

### `index.html`

Conventions: `index.html`

The `index.html` provides the ability to inject some meta tags or scripts to the main `index.html`

For example, define your `index.html` like this:

```html
<!-- ./index.html -->
<head>
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Nunito+Sans:wght@200;400;600&display=swap" rel="stylesheet">
</head>

<body>
  <script src="./your-scripts"></script>
</body>
```

The finial hosted html will be like:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" href="https://raw.githubusercontent.com/slidevjs/slidev/main/assets/favicon.png">
  <!-- injected head -->
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Nunito+Sans:wght@200;400;600&display=swap" rel="stylesheet">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="__ENTRY__"></script>
  <!-- injected body -->
  <script src="./your-scripts"></script>
</body>
</html>
```

### Setup

Conventions: `./setup/*.ts`

> TODO:

## `vite.config.ts`

Refer to the [Configure Vite](/custom/config-vite) section.

## `windicss.config.ts`

Refer to the [Configure Windi CSS](/custom/config-windicss) section.
