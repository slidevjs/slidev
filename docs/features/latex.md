---
relates:
  - Demo: /demo/starter/11
  - KaTeX: https://katex.org/
  - Typst: https://typst.app/
tags: [codeblock, syntax]
description: |
  Slidev comes with LaTeX support out-of-box, powered by KaTeX. Math can also
  be written in Typst syntax and rendered to MathML by the official Typst compiler.
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

## Typst Math

<Badge type="warning" text="Experimental" />

Instead of LaTeX, you can write your math in [Typst](https://typst.app/) syntax. Set `mathRenderer` to `typst` in your [headmatter](../custom/#headmatter):

```md
---
mathRenderer: typst
---
```

All `$...$` and `$$...$$` expressions will then be parsed as Typst math and rendered to native [MathML](https://developer.mozilla.org/en-US/docs/Web/MathML) by the official Typst compiler. MathML is rendered directly by the browser, so the output is text-selectable, accessible to screen readers, and ships no extra client-side runtime.

::: info
Typst math rendering requires the [`@myriaddreamin/typst-ts-node-compiler`](https://www.npmjs.com/package/@myriaddreamin/typst-ts-node-compiler) package, which embeds the official Typst compiler (~48MB executable for MacOS as of Typst v0.15). Install it as a dev dependency:

```bash
npm i -D @myriaddreamin/typst-ts-node-compiler
```

:::

### Math Font

Typst math is rendered as browser-native MathML, so the final font is chosen by the browser unless you override it. Configure the deck-level `fonts.math` option in your headmatter to set the CSS `font-family` used by Typst MathML. This applies to all Typst math output in the slide deck; slide-level overrides are not supported.

```md
---
mathRenderer: typst
fonts:
  math: STIX Two Math
---
```

When webfont loading is enabled, `fonts.math` is included in the generated webfont request like `fonts.sans`, `fonts.serif`, and `fonts.mono`. Make sure your font provider serves the chosen font, or list it under `fonts.local` / load it with custom CSS. For best results, choose a font with MathML/OpenType math support, such as `STIX Two Math`, `Latin Modern Math`, `Libertinus Math`, or `Noto Sans Math`.

### Inline

Surround your Typst math with a single `$` on each side:

```md
$bold(v) in RR^n$ and $norm(bold(v)) = sqrt(sum_(i=1)^n v_i^2)$
```

### Block

Use two (`$$`) for block (display) rendering:

```
$$
nabla dot bold(E) = rho / epsilon_0
$$
```

### Line Highlighting

Line highlighting works the same as with KaTeX — add line numbers within brackets `{}`. Each `\` starts a new highlightable line:

```
$$ {1|2|3|4|all}
nabla dot bold(E)   &= rho / epsilon_0 \
nabla dot bold(B)   &= 0 \
nabla times bold(E) &= - (partial bold(B)) / (partial t) \
nabla times bold(B) &= mu_0 bold(J) + mu_0 epsilon_0 (partial bold(E)) / (partial t)
$$
```

The `at` and `finally` options are also available, just like for LaTeX blocks.

### Syntax differences from LaTeX

Typst math uses a cleaner, function-call-based syntax. A few common differences:

|             | LaTeX                                  | Typst                 |
| ----------- | -------------------------------------- | --------------------- |
| Fraction    | `\frac{a}{b}`                          | `frac(a, b)` or `a/b` |
| Square root | `\sqrt{x}`                             | `sqrt(x)`             |
| Subscript   | `x_{n+1}`                              | `x_(n+1)`             |
| Superscript | `x^{2}`                                | `x^2`                 |
| Infinity    | `\infty`                               | `infinity`            |
| Bold        | `\mathbf{x}`                           | `bold(x)`             |
| Blackboard  | `\mathbb{R}`                           | `RR` or `bb(R)`       |
| Matrix      | `\begin{pmatrix}1&0\\0&1\end{pmatrix}` | `mat(1, 0; 0, 1)`     |
| Vector      | `\begin{pmatrix}a\\b\end{pmatrix}`     | `vec(a, b)`           |
| Cases       | `\begin{cases}…\end{cases}`            | `cases(…)`            |
| Text        | `\text{hello}`                         | `"hello"`             |

Learn more: [Typst Math reference](https://typst.app/docs/reference/math/)

---

<TheTweet id="1392246507793915904" />
