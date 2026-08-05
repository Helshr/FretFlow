# FretFlow — 吉他训练

纯前端吉他和弦练习应用，基于 **Next.js（App Router）+ TypeScript + Tailwind CSS + next-intl**。可部署到 Vercel，后续可平滑加入后端（账号 / 练习数据）。

## 功能

- **和弦切换训练器**（`/trainer`）— 5 分钟和弦切换练习，Open Chords 与 CAGED 两种模式，Web Audio 合成鼓机（BPM 40–180 同步），支持 Major / Minor / m7 / Maj7 / 属七 / 强力和弦，全指板移调
- **全量和弦图**（`/chords`）— CAGED 全性质 × 12 根音指形总表
- 中英双语（zh-CN / en）

## 开发

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

## 数据

- `data/caged.json` — CAGED 形状模板（相对品位 + 根弦 + 横按信息）
- `data/open_chords.json` — 开放和弦库
- `messages/` — 多语言文案
