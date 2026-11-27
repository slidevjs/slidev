---
name: eject-theme
description: Extract theme to local filesystem for customization
---

# Eject Theme

Extract installed theme to local filesystem for customization.

## Command

```bash
slidev theme eject
```

## Result

- Theme files copied to `./theme/`
- Frontmatter updated to `theme: ./theme`

## Use Case

- Full control over theme
- Create new theme based on existing one
- Customize without modifying node_modules

If creating a derivative theme, credit the original theme and author.
