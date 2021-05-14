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
# information for your slides, can be a markdown string
info: |
  ## Slidev

  My first [Slidev](http://sli.dev/) presentations!
---
```

Check out the [type definitions](https://github.com/slidevjs/slidev/blob/main/packages/types/src/types.ts#L16) for more options.

## Directory Structure

Slidev uses directory structure conventions to minimalize the configuration surface and make extensions in functionality flexible and intuitive.

Refer to the [Directory Structure](/custom/directory-structure) section.

## `vite.config.ts`

Refer to the [Configure Vite](/custom/config-vite) section.

## `windicss.config.ts`

Refer to the [Configure Windi CSS](/custom/config-windicss) section.
