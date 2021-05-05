# Customizations

Slidev is fully customizable, from styling to tooling configurations. It allows you to configure the underneath tools like [Vite](/custom/config-vite), [Windi CSS](/custom/config-windicss), [Monaco](/custom/config-monaco), and so on.

## Frontmatter Configures

You can configure Slidev in the frontmatter of your first slide, the following show the default value of them.

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
---
```

Check out the [type definition](https://github.com/slidevjs/slidev/blob/main/packages/types/src/types.ts#L16) for more options.

## Directory Structure

Slidev uses some directory stricture conventions to minimalize the configure surface and make the functionality extensions flexible and intuitive.

Refer to the [Directory Structure](/custom/directory-structure) section.

## `vite.config.ts`

Refer to the [Configure Vite](/custom/config-vite) section.

## `windicss.config.ts`

Refer to the [Configure Windi CSS](/custom/config-windicss) section.
