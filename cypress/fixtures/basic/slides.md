# Page 1

Hello World

---

# Page 2

```html
<style>
p {
  color: red;
}
</style>
```

`<p>` should have a green border, but no red text

<style>
p {
  border: 1px solid green;
}
</style>

---
src: sub/page1.md
---

This will be ignored

---
src: sub/page2.md
background: https://sli.dev/demo-cover.png
---

---

# Page 5

```html
<div>{{$slidev.nav.currentPage}}</div>
```

Current Page: {{$slidev.nav.currentPage}}

---

# Page 6

<v-clicks>

- A
- B
- C

</v-clicks>

<v-clicks>

1. C
2. B
3. A

</v-clicks>

---

# Page 7

$$
\begin{aligned}
\frac{D \boldsymbol{v}}{D t}=&-\frac{1}{\rho} \operatorname{grad} p+\frac{\mu}{\rho} \Delta \boldsymbol{v}+\frac{\lambda+\mu}{\rho} \operatorname{grad} \Theta+\frac{\Theta}{\rho} \operatorname{grad}(\lambda+\mu) \\
&+\frac{1}{\rho} \operatorname{grad}(\boldsymbol{v} \cdot \operatorname{grad} \mu)+\frac{1}{\rho} \operatorname{rot}(\boldsymbol{v} \times \operatorname{grad} \mu)-\frac{1}{\rho} \boldsymbol{v} \Delta \mu+\boldsymbol{g}
\end{aligned}
$$

---
layout: two-cols
---

::right::

# Right

<b>Right</b>

:: default ::

# Left

Left

---

# Page 9

<div class="cy-content">
  <div v-click="3">A</div>
  <div v-click="2">B</div>
  <div v-click="1">C</div>
  <div v-click.hide="4">D</div>
  <v-click hide><div>E</div></v-click>
</div>

---

# Page 10

<div class="cy-content-hide">
  <div v-click-hide>A</div>
  <div v-click-hide>B</div>
  <div v-click>C</div>
  <div v-click-hide>D</div>
</div>

---

# Page 11

<div class="cy-depth">
<v-clicks depth="3">

- A
  - B
    - C
    - D
  - E
  - F
    - G
    - H
- I

</v-clicks>

<v-clicks>

- J
- K
- L

</v-clicks>
</div>

---

# Page 12

<v-clicks>
  <ul><li>A</li><li>B</li></ul>
</v-clicks>

<wrap-in-clicks>
  <ul><li>A</li><li>B</li></ul>
</wrap-in-clicks>

<wrap-in-clicks>

- A
- B

</wrap-in-clicks>

---

# Page 13

<div class="cy-wrapdecorate">
<wrap-in-clicks-decorate>
  <li>E</li>
  <li>F</li>
</wrap-in-clicks-decorate>

(the next is kept for a future patch but not animating the nesting)

<wrap-in-component-in-clicks>
  <li>step i</li>
  <li>step j</li>
</wrap-in-component-in-clicks>
</div>
