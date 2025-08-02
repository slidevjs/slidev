# 🎬 SlidevVideo Demo

> A demo for multi-step controlled playback using `pause=[1, 2, 3, 'end']`  
> 使用 `pause=[1, 2, 3, 'end']` 控制多段播放的展示

<br>
<br>
<br>

### 🌐 Choose Language | 選擇語言

<Link to="2">English</Link>
<br>
<Link to="6">中文</Link>

---

# SlidevVideo 1.0 Test: Pause with Decimal Durations

This slide demonstrates the new `pause` feature in `SlidevVideo`:

- ✅ Supports multiple controlled playback segments
- ✅ Accepts decimal values for pause durations (e.g., `3.5` seconds)
- ✅ `'end'` is optional — without it, the last segment will stop naturally

---

## Playback Test Example

<SlidevVideo :pause="[3.5, 2.5, 3]" controls>
  <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
</SlidevVideo>

---

### ⏱️ Expected Playback Flow

1. First click: plays 3.5 seconds, then auto-pauses
2. Second click: plays 2.5 seconds, then auto-pauses
3. Third click: plays 3 seconds, then auto-pauses
4. Fourth click: continues playing until the video ends

---

### Notes

- `'end'` is optional — if omitted, the last segment just ends playback naturally
- To force a final uninterrupted play-to-end segment, append `'end'` manually:
  ```html
  <SlidevVideo :pause="[3.5, 2.5, 3, 'end']"></SlidevVideo>
  ```

---

# 測試 SlidevVideo 1.0：Pause 支援小數點時間

這頁展示了 `SlidevVideo` 新增的 `pause` 支援：

- ✅ 多段播放控制：每點一次播放指定秒數
- ✅ 支援小數點秒數（例如 `3.5` 秒）
- ✅ 可選擇是否加入 `'end'`，若未加則播放到最後自動停止

---

## 播放測試範例

<SlidevVideo :pause="[3.5, 2.5, 3]" controls>
  <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
</SlidevVideo>

---

### ⏱️ 播放節奏預期

1. 點第一下：播放 3.5 秒後自動暫停
2. 點第二下：播放 2.5 秒後自動暫停
3. 點第三下：播放 3 秒後自動暫停
4. 第四下：會繼續播放到結尾（或結束整段）

---

### 備註

- 可以不必加 `'end'`，預設最後一段播放完就不會卡住
- 若要強制到最後自動播放到結尾，可明確加 `'end'`：
  ```html
  <SlidevVideo :pause="[3.5, 2.5, 3, 'end']"></SlidevVideo>
  ```
