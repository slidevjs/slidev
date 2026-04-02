---
name: headmatter
description: Deck-wide configuration options in the first frontmatter block
---

# Headmatter Configuration

Deck-wide configuration options in the first frontmatter block.

## Theme & Appearance

```yaml
---
theme: default              # Theme package or path
colorSchema: auto           # 'auto' | 'light' | 'dark'
favicon: /favicon.ico       # Favicon URL
aspectRatio: 16/9           # Slide aspect ratio
canvasWidth: 980            # Canvas width in px
---
```

## Fonts

```yaml
---
fonts:
  sans: Roboto
  serif: Roboto Slab
  mono: Fira Code
  provider: google          # 'google' | 'none'
---
```

## Code & Highlighting

```yaml
---
highlighter: shiki          # Code highlighter
lineNumbers: false          # Show line numbers
monaco: true                # Enable Monaco editor ('true' | 'dev' | 'build')
twoslash: true              # Enable TwoSlash
monacoTypesSource: local    # 'local' | 'cdn' | 'none'
---
```

## Features

```yaml
---
drawings:
  enabled: true             # Enable drawing mode
  persist: false            # Save drawings
  presenterOnly: false      # Only presenter can draw
  syncAll: true             # Sync across instances
record: dev                 # Enable recording
selectable: true            # Text selection
contextMenu: true           # Right-click menu
wakeLock: true              # Prevent screen sleep
---
```

## Export & Build

```yaml
---
download: false             # PDF download button
exportFilename: slides      # Export filename
export:
  format: pdf
  timeout: 30000
  withClicks: false
  withToc: false
---
```

## Info & SEO

```yaml
---
title: My Presentation
titleTemplate: '%s - Slidev'
author: Your Name
keywords: slidev, presentation
info: |
  ## About
  Presentation description
---
```

## SEO Meta Tags

```yaml
---
seoMeta:
  ogTitle: Presentation Title
  ogDescription: Description
  ogImage: https://example.com/og.png
  ogUrl: https://example.com
  twitterCard: summary_large_image
  twitterTitle: Title
  twitterDescription: Description
  twitterImage: https://example.com/twitter.png
---
```

## Addons & Themes

```yaml
---
theme: seriph
addons:
  - excalidraw
  - '@slidev/plugin-notes'
---
```

## Theme Configuration

```yaml
---
themeConfig:
  primary: '#5d8392'
  # Theme-specific options
---
```

## Defaults

Set default frontmatter for all slides:

```yaml
---
defaults:
  layout: default
  transition: fade
---
```

## HTML Attributes

```yaml
---
htmlAttrs:
  dir: ltr
  lang: en
---
```

## Presenter & Browser

```yaml
---
presenter: true             # 'true' | 'dev' | 'build'
browserExporter: dev        # 'true' | 'dev' | 'build'
routerMode: history         # 'history' | 'hash'
---
```

## Remote Assets

```yaml
---
remoteAssets: false         # Download remote assets locally
plantUmlServer: https://www.plantuml.com/plantuml
---
```

## Full Template

```yaml
---
theme: default
title: Presentation Title
author: Your Name
highlighter: shiki
lineNumbers: true
transition: slide-left
aspectRatio: 16/9
canvasWidth: 980
fonts:
  sans: Roboto
  mono: Fira Code
drawings:
  enabled: true
  persist: true
download: true
---
```
