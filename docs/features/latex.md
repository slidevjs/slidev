---
layout: feature
relates:
  - Demo: /demo/starter/11
  - KaTeX: https://katex.org/
---

# LaTeX

Slidev comes with LaTeX support out-of-box, powered by [KaTeX](https://katex.org/).

### Inline

Surround your LaTeX with a single `$` on each side for inline rendering.

```md
$\sqrt{3x-1}+(1+x)^2$
```

### Block

Use two (`$$`) for block rendering. This mode uses bigger symbols and centers
the result.

```latex
$$
\begin{array}{c}

\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &
= \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\

\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\

\nabla \cdot \vec{\mathbf{B}} & = 0

\end{array}
$$
```

---

<TheTweet id="1392246507793915904" />
