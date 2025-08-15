# 🎬 SlidevVideo Playback Demo

A simple demo showcasing **multi-step controlled video playback** using `pause` prop.

透過 `pause` 參數控制影片分段播放，支援數值與 `'end'`，可用於教學投影片互動控制。

---

## 🚀 How to Run

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3030](http://localhost:3030)

---

## 🌐 Slide Demos | 投影片展示

- 👉 [Home Page](/dev.md)

---

## 💡 Example

```vue
<SlidevVideo :pause="[3.5, 2.5, 3]" controls>
  <source src="https://www.w3schools.com/html/mov_bbb.mp4" />
</SlidevVideo>
```

Will play **3.5s**, then pause, then **2.5s**, then pause, then **3s**, then pause, then end.

---

## 🧩 Credit

Based on [`Slidev`](https://github.com/slidevjs/slidev), with custom `SlidevVideo` component.
