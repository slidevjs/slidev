---
export:
  withClicks: false
---

# Default

<v-clicks>

- Hello
- Hi
- Hey

</v-clicks>

---
exportClicks: false
---

# Final state only

<v-clicks>

- Hello
- Hi
- Hey

</v-clicks>

---
exportClicks: true
---

# Every click step

<v-clicks>

- Hello
- Hi
- Hey

</v-clicks>

---
clicks: 5
exportClicks: [0, 2, 5]
---

# Listed steps

---
clicksStart: 1
exportClicks: '0,2-3,99'
---

# Range string

<v-clicks>

- Hello
- Hi
- Hey

</v-clicks>

---
exportClicks: [0, last]
---

# First and last

<v-clicks>

- Hello
- Hi
- Hey

</v-clicks>

---
exportClicks: '2-'
---

# Open range

<v-clicks>

- Hello
- Hi
- Hey

</v-clicks>

---
exportClicks: []
---

# Skipped
