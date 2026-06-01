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

## 步骤 8 · 首页 idea → 对话页跨页流转

把灵感罐合成出来的 idea 通过全局 store 带到对话页，自动展开成一轮真实的 Agent 对话。

### Store 层（`store.js`）
- 删掉之前留着没用的 `seedToAgent` 占位，正式新增 `pendingIdea` 字段（默认 `null`），不进 `PERSIST` —— 只是一次性跨页传递、不需要落盘。
- 新增 `Store.setPendingIdea(idea)` / `Store.clearPendingIdea()` 两个方法，对话页消费完调用 `clearPendingIdea()` 复位。

### 首页（`JarHome.jsx`）
- 结果页「让 Agent 展开它 →」按钮原本只调用父级 `onExpand` 切 Tab，现在多一步：先 `Store.setPendingIdea(result)` 把刚合成的 idea 写进 store。
- 包了一个本地 `handoffToAgent(idea)`：`setPendingIdea(idea)` → `onExpand()`，保持 PageResult 组件干净，路由 / store 都在 JarHome 这一层处理。

### 对话页（`AppAgent.jsx`）
- 用 `useStore((s) => s.pendingIdea)` 订阅。`useEffect` 监听 `pendingIdea`：
  - `null` → 啥也不做，保留设计稿那套静态样例对话。
  - 非空 → **同步抓取并立即 `clearPendingIdea()`**（避免 StrictMode 双触发、避免后续重渲染重复发起），再追加一条用户气泡「帮我展开这个灵感:{title}」、调用 `Agent.complete()` 拉智谱回复。
- 没 Key 时走 `Agent.ensureKey()` 弹 KeyModal，灵感原地保留（不清空），用户填完 Key 切回来会重新触发。
- API 失败兜底：Agent 气泡显示「抱歉,展开这个灵感时出错了:{err.message}」。
- Prompt 模板严格按需求文档拼装（确认核心价值 → 给 2-3 个方向 → 等用户选）；`title = lead + accent`，`description = blurb`。
- 真实消息存在本地 `messages` 数组里渲染；同时引入 `TypingDots` 加载态气泡（复用 `f2Twinkle` 关键帧）。加了 `scrollerRef`，新消息进来自动滚到底。
- 默认形态判断改成 `hasConversation = messages.length > 0 || loading` —— 一旦真实对话开始，原静态样本就让位给真实流。
- 把设计稿那段静态对话抽成内部 `<StaticDemo />` 组件，逻辑更清晰，不动它的视觉。

### 验证
- `npm run build` 通过（42 模块,无新增报错）。
- 三步分别提交 push：`store` → `JarHome` → `AppAgent`,每步独立可回滚。

## 步骤 9 · 对话页修复重复发送 bug

从首页「让 Agent 展开它」过来时，同一条灵感被发了两次给智谱 —— 用户气泡也重复了一条。

### 根因
- `useStore((s) => s.pendingIdea)` 订阅 store，组件 render 时 `pendingIdea` 闭包就被捕获了。
- React.StrictMode 在 dev 下会让 `useEffect` 跑 **setup → cleanup → setup** 两轮，两次 setup 里捕获的都是同一个 `pendingIdea` 对象。
- 之前的代码虽然在 effect 里同步 `Store.clearPendingIdea()`，但那只清掉了 store 状态，不影响第二次 setup 里闭包变量的值 —— 所以第二次 setup 照样把 `idea` 当成有效输入，发出第二条用户消息 + 第二次 API 调用。

### 改动（`AppAgent.jsx`）
- 新增 `handledIdeaRef = useRef(null)`：用 ref 记录"已经处理过的 idea 对象引用"。
- effect 进来先比 `handledIdeaRef.current === pendingIdea`，命中直接 `return` —— StrictMode 第二次跑会被这一行挡掉。
- 处理顺序：**先打标记 (`handledIdeaRef.current = pendingIdea`) → 再 `Store.clearPendingIdea()` → 最后才 `setMessages` / `Agent.complete`**。这样任何重入路径都会先撞到 ref 检查。
- ref 而不是 state：刻意不触发重渲染，且 StrictMode 双触发之间 ref 是同一份。

### 验证
- `npm run build` 通过（42 模块）。
- 实测从首页摇 → 让 Agent 展开它 → 对话页只追加一条用户气泡 + 一次智谱调用。

## 步骤 10 · 对话页 UI 打磨

之前 Agent 回复一坨纯文本墙，加粗 / 列表 / 方向选择都没渲染。这一步给气泡换皮 + 加富文本渲染。

### 气泡样式重做（`AppAgent.jsx`）
- **AgentBubble**：白底 `#FFFCF7`、`1px solid #E8DFD0` 边框、`border-radius: 4px 16px 16px 16px`（左上角 4px 贴近头像）、`padding: 16px 20px`、`max-width: 80%`、`align-self: flex-start`。
- **UserBubble**：浅金底 `rgba(212,148,58,0.08)`、`border-radius: 16px 4px 16px 16px`（右上角 4px）、`padding: 14px 18px`、右对齐。
- 消息之间间距从 18px 收到 16px。

### 富文本渲染
- 新增 `renderInline(text)`：把 `**xxx**` 渲染成 `<strong>`，其余按原文。
- 新增 `parseAgentBlocks(text)`：扫描每一行，区分三类块：
  - **段落** —— 空行分段，连续非空行拼成一段
  - **列表** —— 行首 `* / - / • / ·`，拼成 `<ul>`
  - **方向卡片** —— 行首 `方向X：xxx`（支持 A-Z / 0-9 / 一-六），收进 `cards` 块
- 新增 `<AgentContent>` 组件按 blocks 渲染：段落用 `<div>`、列表用带缩进的 `<ul>`、方向块用 `<DirectionCards>`。

### 方向卡片
- 每张：白底、`1px solid #D9A52A` 金边、圆角 12px、padding 14px、hover 背景 `rgba(212,148,58,0.05)`（CSS 类 `.gdir-card:hover`）。
- 点击 → 把 `m.picked` 写到当前 Agent 消息上，命中的卡片边框加粗到 2px、其余淡化到 0.55 透明度。
- 当前 Step 只有视觉高亮逻辑，「自动发送给 Agent」的联动留到 Step 3 接上对话历史时一起做。

### 打字动画
- `index.css` 新增 `@keyframes typingDot`：`translateY(0 → -5px → 0)` + `opacity (.35 → 1 → .35)`，1.1s 一轮。
- `TypingDots` 三个 7×7 金色圆点，依次延迟 0 / 0.16s / 0.32s，循环跳动。

### 验证
- `npm run build` 通过（42 模块、CSS 3.56 KB、JS 195 KB）。
- 设计稿静态样本 `<StaticDemo>` 没改，沿用旧的内嵌选项卡 UI；只有真实对话的气泡走新的 `<AgentContent>` 管线。

## 步骤 11 · Agent 从"给方案"改成"一起想"

之前一次性倾倒整段方案，用户被动看；这一步改成引导式共创对话。

### 新 system prompt（`AppAgent.jsx` 顶部常量 `SYS_PROMPT`）
- 定位：「共创伙伴，不是方案生成器」。
- 节奏约束：首轮 ≤ 150 字 / 展开轮 ≤ 200 字；每轮只推进一小步、给 2-3 个选择、等用户选完再继续。
- 风格约束：口语化中文、像朋友聊天、不要 markdown、不要加粗。
- **三阶段对话节奏写进 prompt**：首轮「一句话理解 + 2-3 个方向 + 问挑哪个」→ 用户选方向后「核心玩法 2-3 句 + 目标用户 1 句 + 问 MVP / 类似产品」→ 后续按用户选择推进（拆 MVP 给 3-5 步行动 / 搜类似产品给对比 / 别的就正常聊）。
- **格式约定**：方向选项必须严格 `方向A：xxx` / `方向B：xxx` / `方向C：xxx` 各占一行，前端 `parseAgentBlocks` 就靠这个识别成可点击卡片。

### 对话历史 + API 调用重做
- 删掉旧的 `buildExpandPrompt`（一次性的"给方案"提示），改成 `buildInitialUserMessage(idea)` 只把 idea 拼成第一条用户消息。
- 新增 `messagesRef`：同步镜像 messages 数组，`sendUser` / `handlePickDirection` 可以在 setState 之外读到最新值（异步链路里不用等下一帧）。
- 新增 `buildApiHistory(msgs)`：每次都把 `[{role:'system', content:SYS_PROMPT}, ...messages 映射]` 完整传给智谱 —— Agent 有完整上下文，知道现在该走哪一阶段。
- 新增 `sendUser(text)` 统一入口：追加用户气泡 → setLoading → `Agent.complete(history)` → 追加 agent 气泡 / 错误兜底 → 关 loading。`temperature: 0.85`、`max_tokens: 700`（够 200 字回复）。
- 首页跨页流转改为 `sendUser(buildInitialUserMessage(idea))`，复用同一条管线，不再走单独的 promise 分支。

### 方向卡片接上自动发送
- `handlePickDirection(msgIndex, choice)`：先在当前 agent 消息上打 `picked = '方向A'` 标记（让那张卡视觉高亮、其余淡化），紧接着 `sendUser('我选方向A：{描述}')` 把选择作为用户消息发出去。
- Agent 收到带"我选方向X：xxx"的历史 → 命中 prompt 的"用户选方向后"分支，进入第二轮展开。

### 输入框可用了
- 之前的 `<span>` 占位换成真 `<input value/onChange>`：
  - 整个 pill 包成 `<form>`，回车提交 = 点发送按钮；
  - placeholder：闲时 `继续聊聊你的想法…` / loading 时 `Agent 思考中…`；
  - 发送按钮在 `draft 为空 || loading` 时 disabled + 透明度 0.45，避免空消息或并发请求。
- `submitDraft()` 取 trim 后的 draft，清空 draft 再 `sendUser` —— UI 立刻清空，不等 API。

### 验证
- `npm run build` 通过（42 模块，JS 196 KB / gzip 63.6 KB，CSS 不变）。
- 首页摇 → 让 Agent 展开它 → 对话页自动发首条 → Agent 回简短理解 + 3 个方向 → 点卡片自动发"我选方向X" → 进入第二轮展开。
- 输入框打字 + 回车 / 点发送均可发消息；loading 时按钮禁用。

---

## 步骤 12 · 对话页去样本化 + 方向卡可交互 + 头部光晕对齐

> 目标：把对话页从"展示设计稿示例"变成真实产品对话框；方向选项从纯文本变成可点击卡片；修掉点击闪蓝、对齐头部光晕。

### 方向选项 → 可点击卡片（`DirectionCards`）
- 复用既有 `parseAgentBlocks`（识别 `方向A：xxx` 行）拿到 `{ key, label, desc }`，渲染成卡片：白底 `#FFFCF7`、`1px #E8DFD0` 描边、圆角 12、`padding 12px 16px`、`margin 8px 0`。
- 布局：左侧金色序号圈（A/B/C，`#FBEFD6` 底 + 金字）· 中间描述 · 右侧 `→` 箭头。
- hover（CSS `.gdir-card:not(.gdir-locked):hover`）：描边转金 `#D4943A`、底色 `rgba(212,148,58,0.05)`。
- 选中：该卡 2px 金边 + 序号圈填金白字、箭头转金；其余卡 `opacity 0.5` 变灰。
- 全组加 `gdir-locked` 类后不再响应 hover、`cursor:default`、`onClick` 早返回 —— 选过就锁定，防重复发送。点击仍走 `handlePickDirection` → 自动发"我选方向X：{描述}"。

### 去掉示例对话 + 开场白
- 删除 `StaticDemo`（会议录音示例那一整段）和 `hasConversation` 分支 —— 真实产品不再展示假对话。
- 新增 `greetedRef` + effect：没有从首页带来 `pendingIdea` 时，Agent 先抛一句开场白「你今天有什么想聊的灵感吗？可以聊一聊。」（作为第一条 agent 气泡，也进 API 历史）。有 `pendingIdea` 则跳过、走原自动展开管线。

### 交互：修掉点击闪蓝
- `index.css`：全局 `*{-webkit-tap-highlight-color:transparent}`；`.gpress/.gdir-card/button/[role=button]` 加 `user-select:none`；`button:focus{outline:none}`。消除桌面点击时的蓝色文字选中遮罩 + 移动端点按高亮。

### UI 对齐：头部光晕收束并对齐星星
- 之前 `GlowField` 是 `position:absolute inset:0` 铺满整页，光点会飘到下方对话卡片旁边。
- 改成把 `GlowField`（`r=170 / motes=6 / spread=0.7`）放进一个 `position:relative; overflow:hidden` 的头部格子里 —— 光点被裁切在头部、不再溢出到卡片旁。
- 头部内容居中：新增一颗 `GlowDot`（size 30，自带闪烁 `gGlow` 光晕）当"灵感 Agent 的星星"，光晕中心 `y=30%` 正对这颗星 → 光晕 / 光点 / 星星三者对齐到 Agent 身份位。

### 验证
- `npm run build` 通过（42 模块，JS 194 KB / gzip 62.9 KB，CSS 3.78 KB）。
- 开场白即时渲染（不需 Key）；方向卡 hover / 选中 / 锁定态正常；点击不再闪蓝；头部光晕居中对齐星星。

---

## 步骤 13 · 首页合成光晕跟随文案循环

> 目标：摇晃罐子进入合成态后，三句「收集素材中 / 寻找隐藏的关联点 / 正在合成新灵感」不再只是文字轮播；对应的光晕阶段也要同步循环。

### `SynthSequence` 状态合并
- `JarHome.jsx` 里把原先独立的 `phase` 和 `cap` 合并为单一 `step`。
- 新增 `steps = [{ phase, caption }]`：`gather` 对应「收集素材中」、`think` 对应「寻找隐藏的关联点」、`condense` 对应「正在合成新灵感」。
- 每 2 秒淡出后推进 `step`：`gather → think → condense → gather...`，文字和光晕从同一个状态派生，避免文字在轮转但视觉停在最后一帧。
- 保留原来的最短合成等待逻辑：动画跑到最短时长后，如果 API 已返回就揭晓结果；如果还在 `pending`，文案和光晕继续循环等待。

---

## 路线图（2026-05-31 重排 · 按用户确认的顺序逐个实现）

> 起因：用户反馈来回切 Tab 状态丢失（灵感页合成中途切走会重置、对话切走回到初始态）。根因在 `App.jsx` 用 if/else 只挂载当前 Tab，切换即卸载 → 组件本地 state 全丢。借此重排了整体路线图。

- **T1 · 跨页状态保留**（✅ 已完成）：四个 Tab 全部常驻挂载，用 CSS `display` 切换可见性，保留各页本地 state、滚动位置、在途请求。
- **T2 · 对话持久化到 store**（✅ 已完成）：把 `AppAgent.messages` 提到 store + localStorage，刷新页面 / 关闭重开也不丢对话。
- **T3 · 社区接 store + 可交互**：feed 读真实数据（用户晒的成品 / 接力贴），点赞 / 评论数本地态，发帖 + 接力跨页流转打通。
- **T4 · 「我的」页补全**：项目列表、灵感口味偏好做成真实可用（去掉 toast 占位 + 写死的 6/23 统计）。
- **T5 · Agent 真实 tool-loop**：`propose_directions` / `expand_plan` / `search_cases` / `add_fragment` 多步工具循环。
- **T6 · 后端 / 部署**：Supabase（auth + 数据库 + 藏 Key 的 Edge Function 代理）+ Vercel 部署；DB 接入前先有鉴权。

### T1 实现记录
- `App.jsx` 从「if/else 选一个 screen」改为「四个 Tab 全部渲染，外包一层 `TabPane` 用 `display:block/none` 切换」。
- `TabPane`：`position:absolute; inset:0`，铺满 `.app-content`；非激活时 `display:none`（DOM 保留、state 不卸载）。
- 效果：灵感页合成中途切到对话页再切回，结果还在；对话聊到一半切走再回来，消息历史 + 滚动位置都在。
- 取舍：隐藏的 Tab 仍挂载（GlowField 动画仍在跑），4 个轻量页可接受；后续若有性能问题再按需暂停隐藏页动画。

### T2 实现记录
- 起因：T1 只解决「同一次会话内切 Tab」不丢；刷新 / 关闭重开页面仍会丢对话（messages 是 `AppAgent` 的本地 state）。这一步把对话历史提到全局 store 并落 localStorage。
- `store.js`：新增 `chat` 字段（默认 `load('chat', [])`），加入 `PERSIST` → 每次变更自动写 localStorage；新增 `Store.setChat(messages)`。
- `AppAgent.jsx`：
  - 删掉本地 `useState(messages)` 和它的镜像 `messagesRef`，改成 `const messages = useStore((s) => s.chat)`。
  - `writeMessages(next)` 直接 = `Store.setChat(next)`；`sendUser` / `handlePickDirection` 里读最新值统一改用 `Store.get().chat`（store 是同步更新的，比镜像 ref 更可靠）。
  - 开场白逻辑改写：去掉 `greetedRef`，改成「`pendingIdea` 为空且 `Store.get().chat.length === 0` 才插入 `GREETING`」—— 刷新后 store 已有历史就不会覆盖；StrictMode 双触发时第二次也会因 `length>0` 早返回。
  - 新增「新对话」入口（头部右上角，仅 `messages.length > 1` 时显示）：`clearChat()` 把对话重置成只剩一条 `GREETING`，loading 中禁用。
- 效果：对话聊到一半刷新页面 / 关掉浏览器重开，历史和方向卡选中态都还在；需要重来点「新对话」即可。
- `npm run build` 通过（42 模块，JS 194.7 KB / gzip 63.0 KB）。

---

## 步骤 14 · Agent 对话改「结构化选项」+ 换快模型提速

> 回应用户反馈：之前删掉示例后，对话退化成纯文字、方向卡几乎不出现——因为它靠正则从模型的自由文本里抠「方向A：」，而模型经常不照这个格式写，正则一匹配失败就只剩纯文字。这一步把交互从「文本约定」改成「结构化输出」，并给对话换上快模型。

### 根因
- 旧设计让 system prompt 求模型严格输出「方向A：xxx」文本行，前端用 `parseAgentBlocks` 正则解析成卡片。
- 模型（尤其口语化回复时）不稳定守这个格式 → 正则抠不到 → 选项卡不渲染，只剩一坨文字。**靠文本约定做交互本质不可靠**。

### 改成结构化输出（`AppAgent.jsx`）
- 新 system prompt 要求每轮只输出一个 JSON：`{"say":"要说的话","options":[{"label","desc"}]}`，options 0–3 个、不需要选择时给 `[]`。
- agent 消息结构从 `{text}` 升级为 `{say, options, picked}`；渲染 / 历史回传 / 持久化都兼容旧的 `{text}`（`m.say ?? m.text` 兜底）。
- 新增 `parseAgentReply(content)`：用 `Agent.parseJSON` 解析（能吃下模型给 JSON 套的代码围栏）；解析失败就整段当纯文字兜底，绝不让交互崩。
- `AgentContent` 的选项卡不再从文字正则抠，改由结构化 `options` 字段驱动 → **一定能渲染**；文字里偶发的「方向X」行直接忽略，避免重复。
- 选项卡显示「短标题 + 一句话说明」两层；点击发送「我选「{label}」：{desc}」并锁定整组（防重复发送，沿用 `gdir-locked`）。
- `buildApiHistory` 回传 agent 的纯文字 `say`（不回传 options 的 JSON），省 token、模型也更清楚。

### 换快模型提速（`agent.js`）
- 新增 `CHAT_MODEL`（默认 `glm-4-flash`，可用 `VITE_ZHIPU_CHAT_MODEL` 覆盖成 glm-4.5-air 等）；`complete()` 支持 `model` 覆盖。
- 对话轮用 `CHAT_MODEL`，首页摇一摇合成仍用 `glm-4.6` 保质量。

### 验证
- `npm run build` 通过；真实调一次 glm-4-flash：status 200、**3.66s**（比 glm-4.6 的十几秒明显快）、返回合法 `{say, options×3}`（带代码围栏，`Agent.parseJSON` 能解析）。本地确认解析路径 OK。

### 还没做（边界说清楚）
- 这是「结构化对话 + 可点选项」，但仍是单轮 chat completion，**还不是真正的多步 tool-loop**（模型自主调 `search_cases` / `add_fragment` 等）—— 那是 **T5**。
- 「找类似产品」目前只是模型凭记忆说，没接联网搜索（`web_search` 工具）—— 也在 T5。
- 读真实业务数据库来生成更好灵感 —— 是 **T6**（Supabase + 鉴权 + 后端 Key 代理）。

---

## 步骤 15 · 底部导航图标按参考图换新

- 参考用户给的导航栏图：灵感 = 罐子、对话 = 星星（保持不变）、社区 = 双人、我的 = 单人。
- `glow.jsx` 的 `GIcon`：新增 `jar`（广口瓶带盖 + 一条液面弧线，呼应「灵感罐」）；`comm` 从原来偏挤的三人组改成更干净的并排双人；`user`（单人）/`spark`（星星）保持。
- `AppShell.jsx`：灵感 Tab 图标 `home` → `jar`（侧边栏 + 底部栏共用 `APP_TABS`，桌面 / 移动端一起生效）。
- 配色沿用现有体系：选中态暖黄 `gold`、未选中暖灰 `inkFaint`（按用户要求统一暖黄，不取参考图的橘色）。

## 步骤 16 · 对话强制 JSON 模式，根治「还是纯文字」

> 用户反馈：可点选项一直没真正生效，还是纯文字。实测定位到根因——**不是代码没改，是快模型吐坏 JSON**。

### 实测诊断
- 直接调 glm-4-flash（不开 JSON 模式）跑 3 轮：轮1 把 JSON 写成中文引号 `”，“` → 非法；轮2/3 啰嗦超长被 `max_tokens=600` 截断 → JSON 不完整。三轮全部解析失败 → 全程走纯文字兜底（还是带花括号的难看原文）。这就是「纯文字」的真相。
- 改用 `response_format:{type:'json_object'}`（强制 JSON 模式）+ `max_tokens:1200` 重测：glm-4-flash 三轮全部合法、options 齐全（3/3/5）、稳定 6–7s；glm-4.5-air 也行但偶发一轮 26s。→ 选 flash + JSON 模式。

### 改动
- `AppAgent.jsx` 对话调用加 `json:true`（→ 智谱 `response_format`）、`maxTokens:1200`、`temperature:0.7`；`SYS_PROMPT` 含小写 `json` 字样（JSON 模式的要求）。
- 删掉 `parseAgentBlocks` 里脆弱的「方向X：」正则识别 —— 选项彻底由结构化 `options` 字段驱动，文字只渲染段落 / 列表，不再丢内容。
- ⚠️ **注意**：对话历史持久化在 localStorage，旧的纯文字对话不会自动变成选项卡；点头部「新对话」或从首页重新「让 Agent 展开它」开一段新对话才能看到选项卡。

### 验证
- `npm run build` 通过；真实多轮调用确认 flash + JSON 模式稳定返回 `{say, options}`、选项卡必现。

## 步骤 17 · 旧对话自动清 + 开场白自带选项

> 用户更新后仍看到纯文字 —— 极可能是 localStorage 里残留的旧纯文字对话（无 options）盖住了新逻辑。

- `store.js`：加 `CHAT_VERSION`，加载时版本不符就清空旧 `chat`，用户一刷新就是干净的新结构化对话，不用手动清缓存。
- `AppAgent.jsx`：开场白从纯文字升级为带 `options` 的消息（`greetingMsg()`：「帮我想个新点子」「我有个想法想聊聊」），一进对话页就有可点选项，直观体现「可选模式」；`clearChat`、开场 effect 都用它。

## 步骤 18 · 首页摇一摇合成提速（glm-4.6 → flash），找到「生成灵感很慢」真凶

> 用户反馈摇一摇生成灵感很慢。实测对比同一条合成请求：

| 模型 | 耗时 |
|---|---|
| glm-4.6（原来） | **86.2 秒** |
| glm-4-flash（改后） | **3.2 秒** |

- 真凶就是合成在用 `glm-4.6`（带推理 + JSON 模式，这次跑了 86 秒）。`agent.js` 的 `synthesize()` 给 `complete()` 加 `model: CHAT_MODEL` → 走 glm-4-flash + 强制 JSON，快约 27 倍。
- 质量取舍：flash 合成的「梗」略逊于 glm-4.6，但 86s→3s 完全值得；想找回质量可设 `VITE_ZHIPU_MODEL` 走强模型（但会慢）。

## 步骤 19 · 对话「后面又变文字」根治：换稳模型 glm-4.5-flash + 正则兜底

> 开场白带选项 OK，但真实多轮回复又退化成纯文字。实测定位到：快模型在多轮里破防。

- 实测 4 轮真实流（开场白点选 → 给灵感 → 拆 MVP → 给技术栈）：
  - `glm-4-flash` **1/4**：轮2 起直接吐纯文字带「1. 2. 3.」，连 `response_format` 都没约束住 → 这就是「后面又变文字」的真因。
  - `glm-4.5-air` 3/4：偶发返回空 content。
  - `glm-4.5-flash` **4/4 全稳**（代价：慢且波动 7-22s）。
- 模型分工：`SYNTH_MODEL=glm-4-flash`（合成，快）、`CHAT_MODEL=glm-4.5-flash`（对话，稳）；均可用 env 覆盖。
- 兜底（`AppAgent.jsx` 新增 `salvageOptions`）：`parseAgentReply` 在 JSON 解析失败时，从纯文字的「1./·」列表里抠出可点选项 → 即使模型再破防，也不退化成纯文字。双保险。
- 已知代价：glm-4.5-flash 慢且波动（7-22s）。用户当前**优先「功能稳定」而非速度**；速度优化（streaming 等）留到选项稳定确认后再做。
- `npm run build` 通过；未 push（按约定等用户确认）。

## 步骤 20 · 升级为真·工具调用 Agent（read_jar / save_idea + 选项抽取）

> 用户点醒：别执着「卡片必现」，要的是**真 Agent** + 让它**自己判断**给卡片还是文字。于是从「结构化对话」升级到「工具调用 Agent」。

### 为什么没用 reply_to_user 工具
- 先试「把回复也做成 `reply_to_user` 工具」——实测 GLM 不爱用，读完 `read_jar` 就直接吐自然文字，options 还是空。
- 改成顺着模型脾气：**工具只管「行动」**，回复用模型擅长的自然文字，选项再单独抽取。

### 架构（`agent.js` 新增 `runAgent` + `extractOptions`）
- `AGENT_TOOLS`：`read_jar`（读灵感罐真实素材）、`save_idea`（存收藏）。`complete` 已支持 `tools`（tool_choice auto）。
- `runAgent`：工具调用循环（≤4 步）—— 模型自主调 read_jar/save_idea、拿到结果继续，最后输出自然文字回复结束。
- `extractOptions`：把回复文字喂给快模型（glm-4-flash + JSON）抽「有没有让用户选的方向」→ 有就给选项卡、没有就纯文字。**模型自己决定列不列方向 = 自己判断卡片 vs 文字**。
- `AppAgent.sendUser` 改调 `Agent.runAgent`；`salvageOptions` 作本地正则兜底；删掉旧的 `parseAgentReply`。
- 模型分工：对话 `CHAT_MODEL=glm-4.5-flash`（tool calling 稳）、抽取/合成 `SYNTH_MODEL=glm-4-flash`（快）。

### 实测（端到端 3 轮）
- 每轮都自主调 `read_jar` 读真实素材、每轮都抽到 3 个选项卡 ✅。这才是真 Agent：有工具、会行动、自主决策；卡片 vs 文字由它自己定。

### 已知问题：慢
- 三轮 15s / 10s / **38s**。glm-4.5-flash 慢 + 工具循环多次调用叠加。**功能对了但速度糟**，下一步专门优化（streaming / 调模型 / 减少调用次数）。
- `npm run build` 通过。

> 协作约定更新（2026-05-31）：用户恢复**实时 push**，之前「确认后再 push」的约定解除。

## 步骤 21 · 首页灵感罐精修：瓶盖材质统一成玻璃

> 用户觉得灵感罐 UI「有点奇怪」，选了「保留拟物罐、只精修」。

- 诊断：瓶身已被精修成**玻璃通透质感**（青色环境反光 + backdropFilter + 柔高光），但**瓶盖三段（knob / stopper / rim）还停留在暖黄塑料硬高光**——瓶身玻璃、瓶盖塑料，材质割裂，这是「奇怪」的主因。
- 精修：把瓶盖三段统一到瓶身的质感——柔化白色硬高光（0.8→0.6 一档），混入瓶身那种青色环境反光（`rgba(160,180,175)`），加一圈通透描边。整只罐子现在是一致的温润磨砂玻璃。
- 不动比例 / 结构（瓶身是设计师调过的），只统一材质，低风险。
- `npm run build` 通过。后续若仍觉奇怪可再调比例 / 构图。

> 插曲：用户给了一张「木塞玻璃罐」参考图，让我用 CSS+SVG 噪声重画了一版软木塞版本（feTurbulence 木纹 + 透明玻璃瓶 + 底部萤火光晕）；用户看后决定不改了，`git checkout` 恢复到本步的玻璃精修版，继续后续进度。

## 步骤 22 · 社区页接 store + 可交互（T3）

> 把社区页从静态假数据改成读真实 store，并接上点赞 / 发帖 / 接力。

- `store.js`：新增 `posts`（持久化）+ `SEED_POSTS` 种子（原静态 3 条转成种子）；`Store.addPost`（新帖置顶）、`Store.toggleLike`（点赞切换 + 数字±1）。
- `AppCommunity.jsx` 重写：读 `useStore(posts)`；点赞按钮切换（liked 变金 + 数字变）；时间显示改「刚刚 / X分钟 / X小时 / X天前」。
- 发帖：右下角 + → `ComposeModal`（标题 + 类型「晒成品 / 接力灵感」）→ `addPost` 置顶。
- 接力：接力贴的「接力 →」→ `App.relayToAgent`：`setPendingIdea(帖子标题)` + 切到对话页，Agent 自动展开。复用首页那套 `pendingIdea` 跨页机制。
- 「最新」tab 按 `ts` 倒序；推荐 / 关注暂用默认顺序（新帖置顶）。
- `npm run build` 通过。

## 步骤 23 · 「我的」页补全（T4）

> 去掉占位，把统计 / 项目 / 口味偏好都做成真实可用。

- **统计**：写死的「6 项目 / 23 连续」→ 真实的「收藏 / 素材 / 发布」（发布 = 我在社区发过的帖子数）。
- **等级 + 灵感能量条**：真实驱动 —— `energy = 收藏数 + 发布数`，每 5 点升一级；进度条宽度、「再 X 个灵感升 Lv.N」、名字下「灵感 Lv.{level}」全部算出来，不再写死。
- **「我发起 / 做过的项目」**：toast 占位 → 行内展开真实列表（社区里 `name==='我'` 的帖子），空态引导去社区发帖。
- **「灵感口味偏好」**：toast 占位 → 展开多选标签（8 个方向：效率工具 / AI 应用 / …），写回 `store.prefs`（持久化），右侧显示已选数量。
- `store.js` 新增 `prefs`（持久化）+ `togglePref`。
- `npm run build` 通过。至此 T3 / T4 前端交互完成，下一步可接数据库（T6，需用户配 Supabase）。

## 步骤 24 · Vercel Serverless 代理藏 key（准备上线）

> 上线前最大的坑：`VITE_ZHIPU_KEY` 会被打进前端 bundle，部署到公开 URL 等于把智谱 key 白送。用 Vercel 自带的 serverless 函数代理解决，不必等 Supabase。

- 新增 `api/chat.js`（Vercel serverless function）：把 key 藏在服务端环境变量 `ZHIPU_KEY`（无 `VITE_` 前缀 → 不进 bundle），透传请求体给智谱。
- `agent.js` 的 `complete()`：**有前端 key**（本地 `.env` / 用户在设置里填的）→ 直连智谱；**无前端 key**（线上）→ 改调 `/api/chat` 代理。
- `ensureKey()` 放行（不再强制弹窗）——有 key 直连、没 key 走代理都能用。
- 本地开发不变：`.env` 的 `VITE_ZHIPU_KEY` 直连（vite dev 不跑 serverless）。
- `.env.example` 补充 Vercel 部署说明（前端别配 key，服务端配 `ZHIPU_KEY`）。
- 协作澄清：GitHub repo 归属与 Supabase / Vercel 无关 —— 谁都能用自己账号建 Supabase 项目 / import repo 到 Vercel，一人建后邀请队友共用。

### Vercel 部署步骤（给团队）
1. 在 vercel.com 用 GitHub 登录 → New Project → import 这个 repo（Vite 框架零配置，自动 build 出 dist + 把 `api/` 识别成 serverless 函数）。
2. 项目 Settings → Environment Variables 加 `ZHIPU_KEY=<智谱key>`（**不要**加 `VITE_ZHIPU_KEY`）。
3. Deploy。之后每次 push 自动重新部署。
- `npm run build` 通过。

## 步骤 25 · 接入 Supabase：社区帖子云端共享（T6 第一步）

> 用户建好 Supabase 项目并给了 Project URL + anon key。先把「社区帖子」上云（多人共享才有意义、且不需要登录），个人数据等做了登录再上。

- 装 `@supabase/supabase-js`；新建 `src/lib/supabase.js`：读 `.env` 的 `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`，没配则 `supabase=null` → store 自动回退 localStorage（本地不配也能跑）。
- `store.js` 的 posts 接云端：
  - 启动 `loadPostsFromCloud()`：从云端拉 posts（云端为准）；云端空则用本地 `SEED_POSTS` 播种一次；表不存在 / 出错 → `console.warn` + 保持本地，不崩。
  - `addPost`：本地置顶 + `insert` 云端；`toggleLike`：本地切 + `update` 云端 likes。
  - `liked`（我赞没赞）是个人态，没 auth 先存本地 `likedIds`，不上云。
- 个人数据（收藏 / 素材 / 对话 / 偏好）仍 localStorage，等做登录（auth）再上云。
- ⚠️ 需用户在 Supabase **SQL Editor 建 posts 表 + 开放 RLS**（已给 SQL）；`.env`（gitignore）配 URL+anon key，队友 / Vercel 各自配同样两个值才连同一个库。
- 安全提醒：当前 RLS policy 是开发期宽松（anon 可读写）。上线前要收紧（配合登录）。
- `npm run build` 通过（bundle 因 supabase-js 增大到 ~415KB，后续可按需优化）。

## 步骤 26 · 对话气泡宽度对齐 + 头部柔光改径向

> 用户反馈：Agent 回复气泡和用户气泡宽度不一致，看着别扭。

- `AppAgent.jsx`：`AgentBubble` 默认 `maxW` `80%` → `82%`，和 `UserBubble` 的 `maxWidth: 82%` 对齐，两侧对话框最大宽度一致。
  - 注：Agent 气泡左侧有发光圆点（24px）+ 间距（10px）占约 34px，纯文字框仍比用户气泡略窄；如需文字框完全等宽可改 `calc(82% + 34px)`，本步先按容器等宽处理。
- 头部柔光：`GlowField`（`overflow:hidden` 裁成条）→ 改成径向渐变 `radial-gradient` + `blur(16px)` + `glowBreathe` 呼吸动画，自然发散到透明、不再被裁成硬边条；顺手去掉 `import { GlowField }`。
- 已实时 push 到 `main`（`c852701`）。

> ⚠️ 远端仓库已迁移：`Irene-bloom/Inspriation` → `ArdenGao10/Inspriation.git`（push 仍经旧地址转发成功，建议适时 `git remote set-url` 更新）。

---

> 协作约定（2026-05-31 最新）：用户恢复**实时 push** —— 改完即提交并推到 `main`（步骤 20 / 26 确认）。此前「确认后再 push」的约定已解除。

---

## 步骤 27 · 交付物：对话一键「生成 MVP 项目卡」（补「交付能力」短板）

> 起因：对照黑客松评分标准，「交付能力」最弱——产品聊完只停在对话/收藏，用户没拿到能动手的东西。这一步把对话沉淀成可带走的交付物，让叙事闭环（灵感 → 聊 → 交付）。

### `agent.js`
- 新增 `buildMVPCard(messages)`：把当前会话的 UI 消息拼成对话记录，喂给 `CHAT_MODEL`（守 JSON 稳）+ 强制 JSON，产出结构化项目卡 `{name, tagline, problem, audience, features[], mvp[], stack[]}`，对没聊透的部分合理补全。
- 新增 `cardToMarkdown(card)`：序列化成 Markdown（标题 / 定位 / 痛点 / 用户 / 核心功能 / MVP 步骤 / 技术栈），供复制 / 下载。
- 两者挂到 `Agent` 导出。

### `AppAgent.jsx`
- 新增 `MVPCardModal` + `CardSection` / `CardList`：暖黄衬线风弹窗展示项目卡；底部三动作 **复制 Markdown / 下载 .md / 存入收藏**（收藏走 `Store.addSaved` → 直接进「我的 → 收藏」，交付物与已有收藏闭环）。
- 输入框上方新增「✦ 生成 MVP 卡片」入口，仅当会话里有用户消息时出现；生成中显示「整理中…」。
- 新增轻提示 toast（复制 / 下载 / 收藏 / 报错反馈，2.4s 自动消失）。

### 验证
- `npm run build` 通过（84 模块，JS 428.71 KB / gzip 125.26 KB，CSS 3.90 KB）。复用既有 `gFade` / `histIn` 关键帧，无新增 CSS。

## 步骤 28 · MVP 卡片入口改造：聊满 3 轮才出现 + 挪进 Agent 气泡

> 用户反馈：① 入口想做成「用户自己选」，聊够了再出现；② 原来放在输入框上方太挤，想挪进 Agent 的对话气泡里。

- 新增内联组件 `CardCTA`（`AppAgent.jsx`）：带一句引导文案「聊得差不多了？可以把它沉淀成一份能动手的方案 👇」+ 全宽「生成 MVP 卡片」按钮，金边淡金底，挂在气泡末尾、与正文用虚线分隔。
- 出现条件：`userTurns >= 3`（用户消息满 3 轮）且非 loading 时，**只挂在最后一条 Agent 气泡**末尾（`i === lastAgentIdx`），随对话推进自然下移、不重复。
- 删掉原输入框上方那条居中按钮，输入区回归清爽。
- `npm run build` 通过。

## 步骤 29 · 登录/注册 + 入口门禁：做了又 revert（时间不够）

> 加了一版登录/注册页 + 入口门禁（`lib/auth.js` + `AuthScreen.jsx`，Supabase 可选/本地回退，提交 `5eef8a2`）。实测注册时 Supabase 返回 **"Invalid API key"** —— 即 `.env` 配了 Supabase 但 `VITE_SUPABASE_ANON_KEY`（或 URL）失效/不对，走 Supabase Auth 被拒。
> 临近 deadline 没时间排查 key，用户决定先停用。`git revert 5eef8a2`（→ `f10b6b2`）整体回退，应用恢复无需登录的可用状态。
> 代码保留在历史里（`5eef8a2`），以后捡回时：先核对 `.env` 的 `VITE_SUPABASE_ANON_KEY` 是否为当前 Supabase 项目的有效 anon key，再 `git revert f10b6b2` 即可复活整套登录。

## 步骤 30 · MVP 卡片入口门槛 3 轮 → 2 轮

> 用户反馈聊了 3 轮入口还没出现（轮次数法不一致），且更希望早点能用。

- `AppAgent.jsx`：`showCardCTA` 的门槛 `userTurns >= 3` → `>= 2`；并加 `lastAgentIdx >= 0` 兜底（确保有 Agent 气泡可挂）。入口位置不变，仍挂在最后一条 Agent 气泡末尾。
- `npm run build` 通过（84 模块）。

## 步骤 31 · 复活登录/注册（`git revert f10b6b2`）

> 用户要求重新加上注册/登录。步骤 29 的代码本身没问题（被 revert 只因当时 anon key 失效），直接 `git revert --no-commit f10b6b2` 整套复活：`lib/auth.js` + `components/AuthScreen.jsx` + `App.jsx` 入口门禁 + `AppMe.jsx` 真实 user/退出登录 + `store.js` 的 `user`/`authReady` 字段全部回来，仅 `DEVLOG.md` 有冲突（已手动并好）。

- 鉴权仍沿用「Supabase 可选 / 本地 mock 回退」：`.env` 配了 `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` → 走 Supabase Auth；没配 → 本地 localStorage mock，开发期照样能跑。
- ⚠️ 上线前务必在 Supabase 控制台核对 anon key 与项目 URL 一致（步骤 29 翻车点）。Supabase 默认开启「邮箱确认」，注册后需点确认邮件才有 session；演示想免确认直登，到 Auth → Providers/Email 关掉 "Confirm email"。
- 部署到 Vercel 时把 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 配进项目 Environment Variables（前端用，带 `VITE_` 前缀没问题，anon key 本就是公开可用的）。
