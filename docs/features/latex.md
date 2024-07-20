---
relates:
  - Demo: /demo/starter/11
  - KaTeX: https://katex.org/
tags: [codeblock, syntax]
description: |
  Slidev comes with LaTeX support out-of-box, powered by KaTeX.
---

# LaTeX

Slidev comes with LaTeX support out-of-box, powered by [KaTeX](https://katex.org/).

## Inline

Surround your LaTeX with a single `$` on each side for inline rendering.

```md
$\sqrt{3x-1}+(1+x)^2$
```

## Block

Use two (`$$`) for block rendering. This mode uses bigger symbols and centers
the result.

```latex
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

```latex
$$ {1|3|all}
\begin{aligned}
\nabla \cdot \vec{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \vec{B} &= 0 \\
\nabla \times \vec{E} &= -\frac{\partial\vec{B}}{\partial t} \\
\nabla \times \vec{B} &= \mu_0\vec{J} + \mu_0\varepsilon_0\frac{\partial\vec{E}}{\partial t}
\end{aligned}
$$
```

The `at` and `finally` options of [code blocks](#line-highlighting) are also available for LaTeX blocks.

## Chemical equations

To enable the rendering of chemical equations, the [mhchem](https://github.com/KaTeX/KaTeX/tree/main/contrib/mhchem)
KaTeX extension needs to be loaded.

Create `vite.config.ts` with the following content:

```ts
import 'katex/contrib/mhchem'

export default {}
```

Now chemical equations can be rendered properly.

```latex
$$
\displaystyle{\ce{B(OH)3 + H2O <--> B(OH)4^- + H+}}
$$
```

Learn more: [Syntax](https://mhchem.github.io/MathJax-mhchem)

---

<TheTweet id="1392246507793915904" />
