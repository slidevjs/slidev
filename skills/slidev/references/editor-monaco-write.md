---
name: monaco-write
description: Edit code and save changes back to the file
---

# Writable Monaco Editor

Edit code and save changes back to the file.

## Usage

```md
<<< ./some-file.ts {monaco-write}
```

## Behavior

- Links Monaco editor to actual file on filesystem
- Changes are saved directly to the file
- Useful for live coding demonstrations

## Warning

Back up files before using - changes are saved directly.
