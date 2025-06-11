# Writing Themes

> Please read <LinkInline link="guide/theme-addon" /> first.

Each slides project can only have one theme. Themes should focus on providing the appearance of slides. If the feature isn't related to the appearance and can be used separately, it should be implemented as an [addon](./write-addon).

To get started, we recommend you use our generator for scaffolding your first theme

::: code-group

```bash [pnpm]
$ pnpm create slidev-theme
```

```bash [npm]
$ npm init slidev-theme@latest
```

```bash [yarn]
$ yarn create slidev-theme
```

```bash [bun]
$ bun create slidev-theme
```

```bash [deno]
$ deno init --npm slidev-theme
```

:::

Then you can modify and play with it. You can also refer to the [official themes](../resources/theme-gallery#official-themes) as examples.

## Capability

A theme can contribute to the following points:

- Global styles
- Provide default configurations
- Provide custom layouts or override the existing ones
- Provide custom components
- Configure tools like UnoCSS, Shiki, etc.

However, the following points are **not** recommended to be done in a theme, and may be better implemented as an [addon](./write-addon):

- New code snippets
- New code runners
- Other things that can be used separately

Basically, the way to provide global styles, layouts, components and configure tools is the same as doing these in a slides project. For example, to configure Shiki, you can create a `./setup/shiki.ts` as described in [Configure Highlighter](../custom/config-highlighter). You can refer to the [customization guide](/custom/) for more information.

To provide default Slidev configurations, you can add a `slidev.defaults` field in the `package.json` file, which will be merged with the user's configurations:

```json [package.json]
{
  "slidev": {
    "defaults": {
      "transition": "slide-left",
      "aspectRatio": "4/3"
    }
  }
}
```

### Require Slidev Version

If the theme is relying on a specific feature of Slidev that is newly introduced, you can set the minimal Slidev version required to have your theme working properly:

```json
{
  "engines": {
    "slidev": ">=0.48.0"
  }
}
```

An error message will be shown when the an incompatible version is used.

### Theme Metadata

By default, Slidev assumes themes support both light mode and dark mode. If you only want your theme to be presented in a specific color schema, you need to specify it explicitly in the `package.json`:

```json [package.json]
{
  "slidev": {
    "colorSchema": "light" // or "dark" or "both"
  }
}
```

## Previewing

You can preview your theme when developing by using a demo slide deck. To do so, create a `./slides.md` file with the following headmatter:

```md [slides.md]
---
theme: ./  # Use the theme in the current directory
---
```

Then you can start the demo slides as usual.

## Publishing

When publishing the theme, non-JS files like `.vue` and `.ts` files can be published directly without compiling. Slidev will automatically compile them when using the theme.

Themes should follow the following conventions:

- Package name should start with `slidev-theme-`. For example, `slidev-theme-name` or `@scope/slidev-theme-name`
- Add `"slidev-theme"` and `"slidev"` in the `keywords` field of your `package.json`

Theme can be used locally without publishing to NPM. If your theme is only for personal use, you can simply use it as a local theme, or publish it as a private scoped package. However, it is recommended to publish it to the NPM registry if you want to share it with others.
