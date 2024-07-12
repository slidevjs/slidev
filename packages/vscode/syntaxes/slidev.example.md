---
foo: a
bar: 1
---

# Title

**Hello** World

[](./a)

```ts {a}
console.log('Hello World')
```

---
src: ../../../demo/starter/slides.md
s: 1
---

a: 23

---

# Import Snippets

<<< @/snippets/snippet.js {2,3|5}
<<< @/snippets/snippet.js {2,3|5}{lines:true}
<<< @/snippets/snippet.js ts {monaco-run}{lines: true}

---

# Vue Component

<div title="1" />
<Comp :x="1" />

---

layout: center
text: 1

---

# Code block

```ts {1,2|3}
const a = 1
```

```ts twoslash {1,2|3}
const a = 1
```

```ts {moanco-run}{showOutputAt: '+1'}
const a = 1
```
