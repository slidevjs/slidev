---
relates:
  - Typst: https://typst.app/
tags: [codeblock, syntax]
description: |
  Slidev supports Typst as an alternative to KaTeX for formula rendering.
---

# Typst

Slidev supports [Typst](https://typst.app/) as an alternative to KaTeX for formula rendering.

## Setup

To use Typst as your formula renderer, add the following to your frontmatter:

```yaml
---
formulaRenderer: typst
---
```

## Inline

Surround your Typst formula with a single `$` on each side for inline rendering.

```md
$\sqrt{3x-1}+(1+x)^2$
```

## Block

Use two (`$$`) for block rendering. This mode uses bigger symbols and centers
the result.

```typst
$$
\begin{aligned}
\nabla \cdot \vec{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \vec{B} &= 0 \\
\nabla \times \vec{E} &= -\frac{\partial\vec{B}}{\partial t} \\
\nabla \times \vec{B} &= \mu_0\vec{J} + \mu_0\varepsilon_0\frac{\partial\vec{E}}{\partial t}
\end{aligned}
$$
```

## Line Highlighting

To highlight specific lines, simply add line numbers within bracket `{}`. Line numbers start counting from 1 by default.

```typst
$$ {1|3|all}
\begin{aligned}
\nabla \cdot \vec{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \vec{B} &= 0 \\
\nabla \times \vec{E} &= -\frac{\partial\vec{B}}{\partial t} \\
\nabla \times \vec{B} &= \mu_0\vec{J} + \mu_0\varepsilon_0\frac{\partial\vec{E}}{\partial t}
\end{aligned}
$$
```

The `at` and `finally` options of [code blocks](/features/line-highlighting) are also available for Typst blocks.

## Why Typst?

Typst is a modern typesetting system designed as an alternative to LaTeX. It offers:

- More concise syntax than LaTeX
- Better package manager support
- Powerful math formula typesetting
- Ability to use third-party packages for tasks like plotting and drawing vector graphics

This makes Typst particularly useful for those who are already documenting with Typst and want a consistent experience in their presentations.

## Implementation

Slidev's Typst support is powered by [Typst.ts](https://github.com/Myriad-Dreamin/typst.ts), which brings Typst to the JavaScript world, making it easy to render Typst source code to SVG or HTML in both server-side and client-side environments.