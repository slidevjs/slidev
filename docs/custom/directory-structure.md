# Directory Structure

Slidev employs some directory structure conventions to minimize the configuration surface and to make the functionality extensions flexible and intuitive.

The conventional directory structure is:

```bash
your-slidev/
  ├── components/       # custom components
  ├── layouts/          # custom layouts
  ├── public/           # static assets
  ├── setup/            # custom setup / hooks
  ├── snippets/         # code snippets
  ├── styles/           # custom style
  ├── index.html        # injections to index.html
  ├── slides.md         # the main slides entry
  └── vite.config.ts    # extending vite config
```

All of them are optional.

## Components

Pattern: `./components/*.{vue,js,ts,jsx,tsx,md}`

Components inside this directory can be directly used in the slides Markdown with the same component name as the file name.

For example:

```bash
your-slidev/
  ├── ...
  └── components/
      ├── ...
      └── MyComponent.ts
```

```md
<!-- slides.md -->

# My Slide

<MyComponent :count="4"/>
```

This feature is powered by [`unplugin-vue-components`](https://github.com/antfu/unplugin-vue-components), learn more there.

Slidev also provides some [built-in components](/builtin/components) for you to use.

## Layouts

Pattern: `./layouts/*.{vue,js,ts,jsx,tsx}`

```bash
your-slidev/
  ├── ...
  └── layouts/
      ├── ...
      └── my-cool-layout.vue
```

You can use any filename for your layout. You then reference your layout in your YAML header using the filename.

```yaml
---
layout: my-cool-layout
---
```

If the layout you provide has the same name as a built-in layout or a theme layout, your custom layout will override the built-in/theme layout. The priority order is `local > theme > built-in`.

Refer to [Write a Layout](../guide/write-layout) for how to write a custom layout.

## Public

Conventions: `./public/*`

Assets in this directory will be served at root path `/` during dev, and copied to the root of the dist directory as-is. Read more about [Vite's `public` directory](https://vitejs.dev/guide/assets.html#the-public-directory).

## Style

Conventions: `./style.css` | `./styles/index.{css,js,ts}`

Files following this convention will be injected to the App root. If you need to import multiple CSS entries, you can create the following structure and manage the import order yourself.

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

Styles will be processed by [UnoCSS](https://unocss.dev/) and [PostCSS](https://postcss.org/), so you can use CSS nesting and [at-directives](https://unocss.dev/transformers/directives#apply) and Nested CSS out-of-box. For example:

<!-- eslint-skip -->

```less
.slidev-layout {
  --uno: px-14 py-10 text-[1.1rem];

  h1, h2, h3, h4, p, div {
    --uno: select-none;
  }

  pre, code {
    --uno: select-text;
  }

  a {
    color: theme('colors.primary');
  }
}
```

Learn more about the syntax [here](https://unocss.dev/transformers/directives#apply).

## `index.html`

Conventions: `index.html`

The `index.html` provides the ability to inject meta tags and/or scripts to the main `index.html`

For example, for the following custom `index.html`:

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

The final hosted `index.html` will be:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/gh/slidevjs/slidev/assets/favicon.png">
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

## Global Layers

Conventions: `global-top.vue` | `global-bottom.vue`

<LinkCard link="feature/global-layers" />
