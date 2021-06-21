# Customizations

Slidev is fully customizable, from styling to tooling configurations. It allows you to configure the tools underneath ([Vite](/custom/config-vite), [Windi CSS](/custom/config-windicss), [Monaco](/custom/config-monaco), etc.)

## Frontmatter Configures

You can configure Slidev in the frontmatter of your first slide, the following shows the default value for each option.

```yaml
---
# theme id or package name
theme: 'default'
# title of your slide, will auto infer from the first header if not specified
title: ''
# titleTemplate for the webpage, `%s` will be replaced by the page's title
titleTemplate: '%s - Slidev'

# enabled pdf downloading in SPA build, can also be a custom url
download: true
# syntax highlighter, can be 'prism' or 'shiki'
highlighter: 'prism'
# enable monaco editor, default to dev only
monaco: 'dev'

# force color schema for the slides, could be 'auto', 'light', or 'dark'
colorSchema: 'auto'
# router mode for vue-router, could be "history" or "hash"
routerMode: 'history'
# aspect ratio for the slides
aspectRatio: '16/9'
# real width of the canvas, unit in px
canvasWidth: 980

# fonts will be auto imported from Google fonts
# Learn more: https://sli.dev/custom/fonts
fonts:
  sans: 'Roboto'
  serif: 'Roboto Slab'
  mono: 'Fira Code'

# default frontmatter applies to all slides
defaults:
  layout: 'default'
  # ...

# information for your slides, can be a markdown string
info: |
  ## Slidev
  My first [Slidev](http://sli.dev/) presentations!
---
```

Check out the [type definitions](https://github.com/slidevjs/slidev/blob/main/packages/types/src/types.ts#L29) for more options.

## Directory Structure

Slidev uses directory structure conventions to minimalize the configuration surface and make extensions in functionality flexible and intuitive.

Refer to the [Directory Structure](/custom/directory-structure) section.

## Config Tools

- [Highlighters](/custom/highlighters)
- [Configure Vue](/custom/config-vue)
- [Configure Vite](/custom/config-vite)
- [Configure Windi CSS](/custom/config-windicss)
- [Configure Monaco](/custom/config-monaco)
- [Configure KaTeX](/custom/config-katex)
- [Configure Mermaid](/custom/config-mermaid)
