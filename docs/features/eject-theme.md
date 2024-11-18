---
depends:
  - guide/theme-addon
tags: [theme, cli]
description: |
  Eject the installed theme from your project to customize it.
---

# Eject Theme

If you want to get full control of the current theme, you can **eject** it to your local file system and modify it as you want. By running the following command

```bash
$ slidev theme eject
```

It will eject the theme you are using currently into `./theme`, and change your frontmatter to

```yaml
---
theme: ./theme
---
```

This could also be helpful if you want to make a theme based on an existing one. If you do, remember to mention the original theme and the author :)

For more options of the `theme` command, please refer to the [Theme Command](../builtin/cli#theme) section.
