# 12311

111

---
foo: bar
dragPos:
  foo: 565,125,165,86,-60
  bar: 439,408,292,46,30
---

# v-drag

<v-drag bg-yellow pos="foo">
<div text-center>
Component + frontmatter position
</div>
</v-drag>

<v-drag bg-blue pos="368,124,344,46,-60">
<div>
Component + inline position
</div>
</v-drag>

<v-drag bg-red pos="530,256,86,_,-60">
Auto height example
</v-drag>

<div v-drag="[612,307,146,NaN,-59]" bg-green>
Directives + inline position
</div>

<div v-drag="'bar'" bg-purple>
Directives + frontmatter position
</div>
