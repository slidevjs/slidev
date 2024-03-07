# Customizations

Slidev is fully customizable, from styling to tooling configurations. It allows you to configure the tools underneath ([Vite](/custom/config-vite), [UnoCSS](/custom/config-unocss), [Monaco](/custom/config-monaco), etc.)

## Frontmatter Configures

You can configure Slidev in the frontmatter of your first slide, the following shows the default value for each option.

```yaml
---
# theme id or package name
# Learn more: https://sli.dev/themes/use.html
theme: default
# title of your slide, will auto infer from the first header if not specified
title: Slidev
# titleTemplate for the webpage, `%s` will be replaced by the page's title
titleTemplate: '%s - Slidev'
# information for your slides, can be a markdown string.
info: false
# author field for exported PDF
author: Your Name Here
# keywords field for exported PDF, comma-delimited.
keywords: keyword1,keyword2

# enable presenter mode, can be boolean, 'dev' or 'build'
presenter: true
# enabled pdf downloading in SPA build, can also be a custom url
download: false
# filename of the export file
exportFilename: slidev-exported
# export options
# use export CLI options in camelCase format
# Learn more: https://sli.dev/guide/exporting.html
export:
  format: pdf
  timeout: 30000
  dark: false
  withClicks: false
  withToc: false
# syntax highlighter, can be 'prism', 'shiki'
highlighter: shiki
# show line numbers in code blocks
lineNumbers: false
# enable monaco editor, can be boolean, 'dev' or 'build'
monaco: dev
# download remote assets in local using vite-plugin-remote-assets, can be boolean, 'dev' or 'build'
remoteAssets: false
# controls whether texts in slides are selectable
selectable: true
# enable slide recording, can be boolean, 'dev' or 'build'
record: dev

# force color schema for the slides, can be 'auto', 'light', or 'dark'
colorSchema: auto
# router mode for vue-router, can be "history" or "hash"
routerMode: history
# aspect ratio for the slides
aspectRatio: 16/9
# real width of the canvas, unit in px
canvasWidth: 980
# used for theme customization, will inject root styles as `--slidev-theme-x` for attribute `x`
themeConfig:
  primary: '#5d8392'

# favicon, can be a local file path or URL
favicon: 'https://cdn.jsdelivr.net/gh/slidevjs/slidev/assets/favicon.png'
# URL of PlantUML server used to render diagrams
plantUmlServer: 'https://www.plantuml.com/plantuml'
# fonts will be auto imported from Google fonts
# Learn more: https://sli.dev/custom/fonts
fonts:
  sans: Roboto
  serif: Roboto Slab
  mono: Fira Code

# default frontmatter applies to all slides
defaults:
  layout: default
  # ...

# drawing options
# Learn more: https://sli.dev/guide/drawing.html
drawings:
  enabled: true
  persist: false
  presenterOnly: false
  syncAll: true

# HTML tag attributes
htmlAttrs:
  dir: ltr
  lang: en
---
```

Check out the [type definitions](https://github.com/slidevjs/slidev/blob/main/packages/types/src/config.ts) for more options.

## Per slide configuration

In addition, every slide accepts the following configuration in the Frontmatter block:

- `clicks` (`number`): Custom clicks count (learn more [here](/guide/animations.html#custom-total-clicks-count)).
- `disabled` (`boolean`): Completely disable and hide the slide.
- `hide` (`boolean`): The same as `disabled`.
- `hideInToc` (`boolean`): Hide the slide for the `<Toc>` components (learn more [here](/builtin/components.html#toc)).
- `layout` (`string`): Defines the layout component applied to the slide (learn more [here](/guide/syntax.html#front-matter-layouts) and [here](/builtin/layouts.html)).
- `level` (`number`): Override the title level for the `<Title>` and `<Toc>` components (only if `title` has also been declared, learn more [here](/builtin/components.html#titles)).
- `preload` (`boolean`, default `true`): Preload the next slide (learn more [here](/guide/animations.html#motion)).
- `routeAlias` (`string`): Create a route alias that can be used in the URL or with the `<Link>` component (learn more [here](/builtin/components.html#link)).
- `src` (`string`): Includes a markdown file (learn more [here](/guide/syntax.html#multiple-entries)).
- `title` (`string`): Override the title for the `<Title>` and `<Toc>` components (learn more [here](/builtin/components.html#titles)).
- `transition` (`string | TransitionProps`): Defines the transition between the slide and the next one (learn more [here](/guide/animations.html#slide-transitions)).
- `zoom` (`number`): Custom zoom scale. Useful for slides with a lot of content.

## Directory Structure

Slidev uses directory structure conventions to minimalize the configuration surface and make extensions in functionality flexible and intuitive.

Refer to the [Directory Structure](/custom/directory-structure) section.

## Config Tools

- [Highlighters](/custom/highlighters)
- [Configure Vue](/custom/config-vue)
- [Configure Vite](/custom/config-vite)
- [Configure UnoCSS](/custom/config-unocss)
- [Configure Monaco](/custom/config-monaco)
- [Configure KaTeX](/custom/config-katex)
- [Configure Mermaid](/custom/config-mermaid)
