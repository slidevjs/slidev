---
theme: none
title: Standalone HTML fixture
monaco: false
favicon: /image.svg
pwa: true
download: true
fonts:
  sans: Fixture
  local: [Fixture]
  provider: none
  webfonts: []
export:
  html:
    maxBytes: 32000000
    images:
      maxWidth: 64
---

# Standalone HTML

<img src="/image.svg" width="80" height="80">
<img id="processed-image" src="/photo.png" width="64" height="32">
<img srcset="/image.svg 1x, /image.svg 2x" width="40" height="40">
<div class="offline-crop"></div>
<div class="offline-inline-crop" style="background-image:url('/image.svg');width:80px;height:40px"></div>
<div class="offline-motion">Local animation</div>

<style>
@font-face {
  font-family: Fixture;
  src: url('/fixture-font.woff2') format('woff2');
}
.offline-crop {
  width: 80px;
  height: 40px;
  background: url('/image.svg') center / cover;
}
.offline-motion {
  animation: offline-motion 3s linear;
}
@keyframes offline-motion {
  from { transform: translateX(0); }
  to { transform: translateX(20px); }
}
</style>

<p v-click>First reveal</p>
<p v-click>Second reveal</p>

<!--
HTML_EXPORT_PRIVATE_NOTE
-->

---

# Embedded media

<audio controls src="/tone.wav"></audio>

---

# Local interaction

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<button id="offline-counter" @click="count++">Count: {{ count }}</button>

```mermaid
flowchart LR
  Start --> Finish
```
