# Configure Fonts

While you can use HTML and CSS to customize the fonts and style for your slides as you want, Slidev also provides a convenient way to use them effortlessly.

In your frontmatter, configure as the following:

```yaml
---
fonts:
  # basically the text
  sans: Robot
  # use with `font-serif` css class from UnoCSS
  serif: Robot Slab
  # for code blocks, inline code, etc.
  mono: Fira Code
---
```

And that's all.

Fonts will be **imported automatically from a provider via CDN, by default it is [Google Fonts](https://fonts.google.com/)**. That means you can use any fonts available on Google Fonts directly.

## Local Fonts

By default, Slidev assumes all the fonts specified via `fonts` configurations come from Google Fonts. If you want to use local fonts, specify the `fonts.local` to opt-out the auto-importing.

```yaml
---
fonts:
  # like font-family in css, you can use `,` to separate multiple fonts for fallback
  sans: 'Helvetica Neue,Robot'
  # mark 'Helvetica Neue' as local font
  local: Helvetica Neue
---
```

## Weights & Italic

By default, Slidev imports three weights `200`,`400`,`600` for each font. You can configure them by:

```yaml
---
fonts:
  sans: Robot
  # default
  weights: '200,400,600'
  # import italic fonts, default `false`
  italic: false
---
```

This configuration applies to all web fonts. For more fine-grained controls of each font's weights, you will need to manually import them with [HTML](/custom/directory-structure.html#index-html) and CSS.

## Fallback Fonts

For most of the scenarios, you only need to specify the "special font" and Slidev will append the fallback fonts for you, for example:

```yaml
---
fonts:
  sans: Robot
  serif: Robot Slab
  mono: Fira Code
---
```

will result in

<!-- eslint-skip -->

```css
.font-sans {
  font-family: "Robot",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";
}
.font-serif {
  font-family: "Robot Slab",ui-serif,Georgia,Cambria,"Times New Roman",Times,serif;
}
.font-mono {
  font-family: "Fira Code",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
}
```

If you want to disable the fallback fonts, configure as the following:

```yaml
---
fonts:
  mono: 'Fira Code, monospace'
  fallbacks: false
---
```

## Providers

- Options: `google` | `coollabs` | `none`
- Default: `google`

Currently, only [Google Fonts](https://fonts.google.com/) and [coolLabs](https://fonts.coollabs.io/) supported, we are planning to add more providers in the future. Specify to `none` will disable the auto-importing feature entirely and treat all the fonts locally.

```yaml
---
fonts:
  provider: none
---
```
