# 开发日志 DEVLOG

逐步记录每一次改动、原因和结论，方便后续复盘。最新在下。

---

## 起点：旧版「灵感骰子 Idea Dice」MVP

- 单文件 `index.html`（~67KB），原生 JS + CSS，模拟手机外框。
- 已有一套**能跑通的智谱 Agent 引擎**：`glm-4.5`、OpenAI 兼容 tool-use 循环（`runAgent`/`callLLMWithTools`/`executeTool`），工具 `add_fragment / roll_dice / present_idea / analyze_fragments / search_cases`（含 `/web_search`），API Key 存 localStorage。
- 这套引擎是后续复用的基础。

## 步骤 1 · 拉取并实现新设计稿

- 从 Claude Design handoff 拉取「灵感搜集器 App.html」bundle（gzip → 解包），读 README + 两段 chat 转录 + 6 个组件。
- 设计为 React 18 + Babel-standalone 原型，4 Tab：灵感罐 / 对话 Agent / 社区 / 我的；暖黄光晕 + 衬线视觉。
- 先把设计稿 1:1 落成可运行文件，旧版备份到 `.index.dice-backup.html`。

## 步骤 2 · 接入真实 Agent（P1+P2）

- **决策**：用户确认以新设计为准、按设计实现功能；复用旧引擎。模型选 **glm-4.6**（多步 function-calling 最稳）。
- 新增三层：
  - `store`：全局状态 + localStorage（灵感罐素材、收藏、API Key），20 条种子素材。
  - `agent`：智谱引擎，`synthesize()` = 抽 2–3 条素材 + 约束维度 → glm-4.6 碰撞出新灵感（返回 lead/accent/blurb/sources）。
  - `KeyModal`：缺 Key 自动弹窗；Key 存 localStorage。
- **首页摇一摇接真实合成**：动画跑完 + API 返回后才揭晓结果；结果页显示真实标题/来源，可收藏进罐；含报错兜底页。
- 用无头 Chrome 验证挂载无报错。

## 步骤 3 · 拆成多文件结构

- **决策**：用户要求按设计稿原结构拆分，不要单文件。
- 拆成 `components/*.jsx` + `store.js` / `agent.js`，`index.html` 收敛为按依赖顺序 `<script src>` 的加载壳。
- **踩坑**：每个 `type="text/babel"` 脚本作用域独立 → 跨文件依赖统一从 `window` 取（修了 `agent.js` 里裸用 `Store` 的问题）。
- 用本地 HTTP 服务 + 无头 Chrome 验证：346KB DOM、首页真实渲染、零 JS 报错。
- 提交并 push 到 `main`。

## 步骤 4 · 迁移到 Vite 工程（当前）

- **决策**：用户指出以前的 Vibe Coding 产品都是 Vite 工程（所以"一开始就有 .env"），且后期要部署 Vercel + 接 Supabase。确认迁移。
- **为什么之前用不了 `.env`**：Babel-standalone 是浏览器内运行时编译、无构建步骤，没人去读 `.env`。Vite 有构建步骤，`import.meta.env.VITE_*` 才能注入。
- 改动：
  - 新增 `package.json` / `vite.config.js`；`index.html` 改为 Vite 入口（`/src/main.jsx`）。
  - `window.X` 全局模式 → ES module `import/export`：`theme.js` / `store.js` / `lib/agent.js` / `components/*.jsx` / `App.jsx` / `main.jsx`。
  - 关键帧/全局样式整合进 `src/index.css`（不再运行时注入）。
  - `agent.js` 的 Key 解析：`import.meta.env.VITE_ZHIPU_KEY` 优先，其次弹窗 localStorage。
  - `.env.example` + `.gitignore`（忽略 `.env` / `node_modules` / `dist`）；删除旧 `components/` 与 `config.local.js` 方案。
- **安全说明**：`VITE_` 变量会进前端 bundle，最终用户可见；真正藏 Key 留待接 Supabase 时用后端代理（Edge Function / serverless）。
- `npm run build` 通过（41 模块）；无头 Chrome 验证渲染正常、无报错。

## 步骤 5 · 去掉手机外框，改响应式

- **决策**：用户要做 Web + 移动端都能看的响应式，手机外框（固定 360×760 圆角框 + 模拟状态栏）会限制布局。
- 改动：
  - 移除 `.phone-wrap` 固定外框与模拟 `9:41` 状态栏（`AppShell` 去掉 `GStatus`，改为顶部安全区留白 `env(safe-area-inset-top)`）。
  - 新增响应式外壳：`.app-outer` + `.app-frame`（移动端全屏 100dvh / 桌面端居中列，max-width 480px）。
- 无头 Chrome 验证：`phone-wrap` 与 `9:41` 已移除，首页正常渲染、无报错。

## 步骤 6 · 文案修改 + 桌面端全屏铺满

- **文案**：所有 "vibe coder" → "builder"（侧边栏副标题「给 builder 的灵感引擎」、我的页身份标签「builder · 灵感 Lv.4」、`store.js` 注释）。
- **移除**侧边栏底部的版本信息「v0.1 · 智谱 BigModel」，连同 `flex: 1` 占位 spacer 一起删掉，导航更干净。
- **桌面端布局全屏铺满**（用户反馈两边留大片空白）：
  - `.app-shell` 删除 `max-width: 1200px` 和 `box-shadow`，宽度跟随浏览器。
  - `.app-content` 删除 `max-width: 720px; margin: 0 auto`，跟随父级 `.app-main` 的 `flex: 1` 撑满右侧剩余宽度。
  - `.app-outer` 不再 `justify-content: center`、背景改成与 app-shell 同色（避免空隙）。
  - 侧边栏保留 `flex: 0 0 240px` 固定宽度不变。
  - 卡片 / 对话气泡仍可以用各自的 `maxWidth` 居中，但内容区背景全宽铺满。
- `npm run build` 验证通过（42 模块，无新增报错）。

## 步骤 7 · 我的页菜单点击 + 首页合成动画文案轮播

### 我的页（`AppMe.jsx`）菜单交互
- 「**收藏的灵感**」点击 → 行内展开 / 收起 store 中的真实收藏列表。每条卡片：`lead + accent` 衬线标题、`blurb` 描述、收藏时间、来源素材。空态显示「还没有收藏的灵感，去首页摇一摇吧 ✨」。右侧数字读 `store.saved.length`。
- 「**通用设置**」点击 → 行内展开 / 收起设置面板，含「智谱 API Key」密码输入框，读 `store.apiKey`、保存写回 `store + localStorage`，保存后弹 toast。
- 「**我发起 / 做过的项目**」「**灵感口味偏好**」点击 → toast「功能开发中，敬请期待 ✨」。
- 「**我的灵感罐**」卡片点击行为改为展开 / 收起所有素材列表（之前是直接打开 UploadModal）。每条素材显示文字内容。展开头部留了一个「+ 添加」入口仍可触发 UploadModal，保留原有上传通道。右侧「`{fragCount}` 份素材」继续读真实 store。
- 行右侧箭头加 `transform: rotate(90deg)` 过渡，展开 / 收起有方向反馈。
- 顺手补了组件内置 `Toast`（`absolute` 定位在 me 页底部 80px，2.4 秒自动消失）。

### 首页合成动画文案轮播（`JarHome.jsx` 的 `SynthSequence`）
- 文案改成三句循环：「收集素材 ✦」「寻找隐藏的关联点 ✦」「正在合成新灵感 ✦」。
- 每 2 秒切一次，淡出 260ms → 切换 → 淡入 260ms，CSS `opacity transition` 实现。
- `setInterval` 持续轮播，组件随 `stage` 从 `'synth'` 切到 `'result'` 卸载时 `clearInterval` 自动停止 → 合成完成自然结束。
- 不影响原 `phase`（`gather → think → condense`）粒子动画时序。

`npm run build` 通过（42 模块）。

---

## 待办（后续步骤）

- **P3** 对话页接真实多步 tool-use 循环（`propose_directions` / `expand_plan` / `search_cases` / `add_fragment`）。
- **P4** 收藏 / 我的页全部读真实 store；灵感罐素材增删管理。
- **P5** 社区（本地版）+「让 Agent 展开它 / 接力」跨页流转。
- 部署 Vercel；接 Supabase（鉴权/数据库 + 藏 Key 的后端代理）；评估桌面端宽屏下的多列布局。
