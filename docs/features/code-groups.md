---
depends:
  - guide/syntax#code-block
tags: [codeblock]
description: |
  Group multiple code blocks and automatically match icon by the title name.
---

# Code Groups

> [!NOTE]
> This feature requires [MDC Syntax](/features/mdc#mdc-syntax). Enable `mdc: true` to use it.

You can group multiple code blocks like this:

````md
::code-group

```sh [npm]
npm i slidev
```

```sh [yarn]
yarn add slidev
```

```sh [pnpm]
pnpm add slidev
```

::
````

## Title Icon Matching

`code groups` and `code block` also supports the automatically icon matching by the title name:

![code-groups-demo](/assets/code-groups-demo.png)
