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

# Page 3

```html
<div>{{$slidev.nav.currentPage}}</div>
```

Current Page: {{$slidev.nav.currentPage}}

---

# Page 3

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

<div>
Hi
</div>

---

# Page 5

$$
\begin{aligned}
\frac{D \boldsymbol{v}}{D t}=&-\frac{1}{\rho} \operatorname{grad} p+\frac{\mu}{\rho} \Delta \boldsymbol{v}+\frac{\lambda+\mu}{\rho} \operatorname{grad} \Theta+\frac{\Theta}{\rho} \operatorname{grad}(\lambda+\mu) \\
&+\frac{1}{\rho} \operatorname{grad}(\boldsymbol{v} \cdot \operatorname{grad} \mu)+\frac{1}{\rho} \operatorname{rot}(\boldsymbol{v} \times \operatorname{grad} \mu)-\frac{1}{\rho} \boldsymbol{v} \Delta \mu+\boldsymbol{g}
\end{aligned}
$$
