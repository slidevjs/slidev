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
