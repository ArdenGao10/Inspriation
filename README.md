# 灵感搜集器 · Inspiration Collector

一个面向 **vibe coder** 的灵感 Agent App：把你平时攒下的零散灵感（"灵感罐素材"），通过 AI **碰撞合成**出新的产品点子，并能继续和 Agent 对话，把一句话聊成可落地方案。

暖黄「光晕 / 太阳粒子」视觉语言，editorial 衬线标题。**响应式**，Web 端与移动端都能用。

---

## 技术栈

| 层 | 选型 |
|---|---|
| 构建 | **Vite 5** + `@vitejs/plugin-react`（无 Babel-standalone，标准工程化） |
| 前端 | **React 18**（ESM 模块，内联样式 + 全局 CSS 关键帧） |
| 状态 | 极简外部 store（`useSyncExternalStore`）+ localStorage 持久化 |
| LLM | **智谱 BigModel**（默认 `glm-4.6`），OpenAI 兼容的 `/chat/completions` |
| 联网（规划） | 智谱 `/web_search` |
| 部署（规划） | Vercel；后端/数据库用 Supabase（藏 Key 的代理放 Edge Function） |

## 目录结构

```
index.html              Vite 入口（仅 #root + module 脚本 + 字体）
vite.config.js
.env.example            环境变量模板（复制为 .env 使用）
src/
  main.jsx              ReactDOM 挂载
  App.jsx               根组件：4 Tab 切换 + 响应式外壳 + Key 弹窗
  index.css             全局样式 + 所有动画关键帧
  theme.js              设计系统配色/字体常量 G
  store.js              全局状态 + localStorage（素材/收藏/Key）
  lib/
    agent.js            智谱 agent 引擎：getKey / ensureKey / complete / synthesize
  components/
    glow.jsx            设计系统基础件：GlowField/GIcon/GAvatar/GStatus/Eyebrow
    AppShell.jsx        响应式外壳 + 底部 Tab 导航
    KeyModal.jsx        API Key 弹窗
    JarHome.jsx         首页灵感罐：玻璃罐 + 摇一摇 → 合成动画 → 揭晓
    AppAgent.jsx        对话页（P3 接真实多步对话）
    AppCommunity.jsx    社区页（本地种子数据）
    AppMe.jsx           我的页（收藏数/素材数读真实 store）
```

## 本地运行

```bash
npm install
cp .env.example .env      # 填入 VITE_ZHIPU_KEY（去 https://open.bigmodel.cn/usercenter/apikeys 申请）
npm run dev               # http://localhost:5173
```

不填 `.env` 也能跑：首次触发合成时会弹窗让你输入 Key（存浏览器 localStorage）。

```bash
npm run build   # 产出 dist/，可直接部署 Vercel
npm run preview # 本地预览构建产物
```


## 功能进度

- [x] **P1** 基础设施：store + localStorage、智谱 agent 引擎、API Key 弹窗
- [x] **P2** 首页灵感罐「摇一摇」接通真实合成（抽 2–3 条素材 + 约束维度 → glm-4.6 碰撞）
- [x] 响应式外壳（去掉模拟手机外框/状态栏，Web + 移动端自适应）
- [ ] **P3** 对话页接真实多步 tool-use 循环
- [ ] **P4** 收藏 / 我的页全部读真实 store；灵感罐素材增删
- [ ] **P5** 社区（本地版）+「让 Agent 展开它 / 接力」跨页流转
- [ ] 部署 Vercel + 接入 Supabase（含藏 Key 的后端代理）

详细的逐步改动记录见 [DEVLOG.md](DEVLOG.md)。
