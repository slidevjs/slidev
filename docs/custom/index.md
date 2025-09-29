# Customizations

Slidev is fully customizable, from styling to tooling configurations. It allows you to configure the tools underneath ([Vite](/custom/config-vite), [UnoCSS](/custom/config-unocss), [Monaco](/custom/config-monaco), etc.)

## Slides Deck Configs {#headmatter}

You can configure the whole slides project in the frontmatter of your **first** slide (i.e. headmatter). The following shows the default value for each option:

```yaml
---
# theme id, package name, or local path
# Learn more: https://sli.dev/guide/theme-addon.html#use-theme
theme: default
# addons, can be a list of package names or local paths
# Learn more: https://sli.dev/guide/theme-addon.html#use-addon
addons: []
# title of your slide, will inferred from the first header if not specified
title: Slidev
# titleTemplate for the webpage, `%s` will be replaced by the slides deck's title
titleTemplate: '%s - Slidev'
# information for your slides, can be a Markdown string
info: false
# author field for exported PDF or PPTX
author: Your Name Here
# keywords field for exported PDF, comma-delimited
keywords: keyword1,keyword2

# enable presenter mode, can be boolean, 'dev' or 'build'
presenter: true
# enable browser exporter, can be boolean, 'dev' or 'build'
browserExporter: dev
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
# enable twoslash, can be boolean, 'dev' or 'build'
twoslash: true
# show line numbers in code blocks
lineNumbers: false
# enable monaco editor, can be boolean, 'dev' or 'build'
monaco: true
# Where to load monaco types from, can be 'cdn', 'local' or 'none'
monacoTypesSource: local
# explicitly specify extra local packages to import the types for
monacoTypesAdditionalPackages: []
# explicitly specify extra local modules as dependencies of monaco runnable
monacoRunAdditionalDeps: []
# download remote assets in local using vite-plugin-remote-assets, can be boolean, 'dev' or 'build'
remoteAssets: false
# controls whether texts in slides are selectable
selectable: true
# enable slide recording, can be boolean, 'dev' or 'build'
record: dev
# enable Slidev's context menu, can be boolean, 'dev' or 'build'
contextMenu: true
# enable wake lock, can be boolean, 'dev' or 'build'
wakeLock: true
# take snapshot for each slide in the overview
overviewSnapshots: false

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
# Learn more: https://sli.dev/features/plantuml.html
plantUmlServer: https://www.plantuml.com/plantuml
# fonts will be auto-imported from Google fonts
# Learn more: https://sli.dev/custom/config-fonts.html
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

# SEO meta tags
seoMeta:
  ogTitle: Slidev Starter Template
  ogDescription: Presentation slides for developers
  ogImage: https://cover.sli.dev
  ogUrl: https://example.com
  twitterCard: summary_large_image
  twitterTitle: Slidev Starter Template
  twitterDescription: Presentation slides for developers
  twitterImage: https://cover.sli.dev
  twitterSite: username
  twitterUrl: https://example.com
---
```

Check out the [type definitions](https://github.com/slidevjs/slidev/blob/main/packages/types/src/config.ts) for more details.

## Per-slide Configs {#frontmatter}

Also every slide accepts the following configuration in its frontmatter block. The following shows the default value for each option:

```yaml
---
# custom clicks count
# Learn more: https://sli.dev/guide/animations#total
clicks: 0
# custom start clicks count
clicksStart: 0
# completely disable and hide the slide
disabled: false
# the same as `disabled`
hide: false
# hide the slide for the <Toc> components
hideInToc: false
# defines the layout component applied to the slide
layout: <"cover" if the slide is the first slide, otherwise "default">
# override the title level for the <TitleRenderer> and <Toc> components
# only if `title` has also been declared
level: 1
# mount this slide before entering
preload: true
# create a route alias that can be used in the URL or with the <Link> component
routeAlias: undefined # or string
# includes a markdown file
# Learn more: https://sli.dev/guide/syntax.html#importing-slides
src: undefined # or string
# override the title for the <TitleRenderer> and <Toc> components
# only if `title` has also been declared
title: undefined # or string
# defines the transition between the slide and the next one
# Learn more: https://sli.dev/guide/animations.html#slide-transitions
transition: undefined # or BuiltinSlideTransition | string | TransitionGroupProps | null
# custom zoom scale
# useful for slides with a lot of content
zoom: 1
# used as positions of draggable elements
# Learn more: https://sli.dev/features/draggable.html
dragPos: {} # type: Record<string, string>
---
```

Check out the [type definition](https://github.com/slidevjs/slidev/blob/main/packages/types/src/frontmatter.ts#L260) for more details.

## Directory Structure

Slidev uses directory structure conventions to minimalize the configuration surface and make extensions in functionality flexible and intuitive.

Refer to the [Directory Structure](/custom/directory-structure) section.

## Config Tools

<script setup>
import VPLink from 'vitepress/dist/client/theme-default/components/VPLink.vue'
import customizations from '../.vitepress/customizations'
</script>

<li v-for="c of customizations.slice(2)" :key="c.text">
  <VPLink :href="c.link">
    {{ c.text }}
  </VPLink>
</li>
