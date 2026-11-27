---
depends:
  - features/monaco-editor
  - features/import-snippet
relates:
  - features/import-snippet
  - Custom Code Runners: /custom/config-code-runners
since: v0.49.5
tags: [codeblock, editor]
description: |
  A monaco editor that allows you to write code directly in the slides and save the changes back to the file.
---

# Writable Monaco Editor

You can also use the [Import Code Snippets](#import-code-snippets) syntax combined with the `{monaco-write}` directive, to link your Monaco Editor with a file on your filesystem. This will allow you to edit the code directly in the editor and save the changes back to the file.

```md
<<< ./some-file.ts {monaco-write}
```

When using this, be sure to back up your files beforehand, as the changes will be saved directly to the file.
