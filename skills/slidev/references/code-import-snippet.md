---
name: import-snippet
description: Import code from external files into slides with optional region selection
---

# Import Code Snippets

Import code from external files into slides.

## Basic Syntax

```md
<<< @/snippets/snippet.js
```

`@` = package root directory. Recommended: place snippets in `@/snippets/`.

## Import Region

Use VS Code region syntax:

```md
<<< @/snippets/snippet.js#region-name
```

## Specify Language

```md
<<< @/snippets/snippet.js ts
```

## With Features

Combine with line highlighting, Monaco editor:

```md
<<< @/snippets/snippet.js {2,3|5}{lines:true}
<<< @/snippets/snippet.js ts {monaco}{height:200px}
```

## Placeholder

Use `{*}` for line highlighting placeholder:

```md
<<< @/snippets/snippet.js {*}{lines:true}
```

## Monaco Write

Link editor to file for live editing:

```md
<<< ./some-file.ts {monaco-write}
```
