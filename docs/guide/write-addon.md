# Writing Addons

> Please read <LinkInline link="guide/theme-addon" /> and <LinkInline link="guide/write-theme" /> first.

Each slides project can only have one theme, but can have multiple addons.

## Capability

Theoretically, all the capabilities of a theme can be done in an addon. However, an addon is more like a plugin that extends the functionalities of Slidev.

It's recommended to implement one or more of the following points in an addon:

- Provide custom components
- Provide _new_ layouts
- Provide new code snippets
- Provide new code runners
- Configure tools like UnoCSS, Vite, etc.

However, the following points are **not** recommended to be done in an addon, and may be better [implemented as a theme](./write-theme):

- Wildcard global styles
- Overriding existing layouts
- Overriding configurations
- Other things that may be incompatible with the theme and other addons

An addon can also specify its required Slidev version in the same way as themes.

## Previewing

The same as themes, you can preview your addon via a `./slides.md` like this:

```md
---
addons:
  - ./
---
```

## Publishing

When publishing the addon, non-JS files like `.vue` and `.ts` files can be published directly without compiling. Slidev will automatically compile them when using the addon.

Addons should follow the following conventions:

- Package name should start with `slidev-addon-`. For example, `slidev-addon-name` or `@scope/slidev-addon-name`
- Add `"slidev-addon"` and `"slidev"` in the `keywords` field of your `package.json`

Theme can be used locally without publishing to NPM. If your addon is only for personal use, you can simply use it as a local addon, or publish it as a private scoped package. However, it is recommended to publish it to the NPM registry if you want to share it with others.
