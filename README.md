# 灵感搜集器 · Inspiration Collector

一个面向 **vibe coder** 的灵感 Agent App：把你平时攒下的零散灵感（"灵感罐素材"），通过 AI **碰撞合成**出新的产品点子；再继续和 Agent 对话，把一句话聊成可落地的 **MVP 项目卡**带走。

暖黄「光晕 / 太阳粒子」视觉语言，editorial 衬线标题。**响应式**，Web 端与移动端都能用。

完整叙事闭环：**攒灵感 → 摇一摇合成 → 和 Agent 聊透 → 生成 MVP 卡片交付 → 收藏 / 发到社区接力**。

---

## 技术栈

| 层 | 选型 |
|---|---|
| 构建 | **Vite 5** + `@vitejs/plugin-react`（标准工程化） |
| 前端 | **React 18**（ESM 模块，内联样式 + 全局 CSS 关键帧） |
| 状态 | 极简外部 store（`useSyncExternalStore`）+ localStorage 持久化 |
| LLM | **智谱 BigModel**（OpenAI 兼容 `/chat/completions`）；合成默认 `glm-4-flash`，对话默认 `glm-4.5-flash` |
| 鉴权 | **Supabase Auth**（邮箱 + 密码）；未配置时回退本地 mock |
| 数据 | 社区帖子上云 **Supabase**（多人共享）；个人数据（收藏 / 素材 / 偏好）暂存 localStorage |
| 部署 | **Vercel**：静态前端 + `api/chat.js` serverless 代理藏智谱 Key |

## 目录结构

```
index.html              Vite 入口（#root + module 脚本 + 字体）
vite.config.js          多入口：main / demo-phone / pitch
.env.example            环境变量模板（复制为 .env 使用）
api/
  chat.js               Vercel serverless 代理：服务端带 ZHIPU_KEY 转发智谱（藏 key）
src/
  main.jsx              ReactDOM 挂载
  App.jsx               根组件：登录门禁 + 4 Tab 切换 + 响应式外壳 + 跨页流转
  index.css             全局样式 + 所有动画关键帧
  theme.js              设计系统配色 / 字体常量
  store.js              全局状态 + localStorage / Supabase（素材 / 收藏 / 帖子 / 偏好 / user）
  lib/
    agent.js            智谱 agent 引擎：complete / synthesize / buildMVPCard / cardToMarkdown
    auth.js             鉴权层：signIn / signUp / signOut（Supabase 或本地 mock）
    supabase.js         Supabase 客户端（未配置则为 null → store 回退本地）
  components/
    glow.jsx            设计系统基础件：GlowField / GIcon / GAvatar / GStatus / Eyebrow
    AppShell.jsx        响应式外壳 + 底部 Tab 导航
    AuthScreen.jsx      登录 / 注册页（入口门禁）
    KeyModal.jsx        API Key 弹窗
    JarHome.jsx         首页灵感罐：玻璃罐 + 摇一摇 → 合成动画 → 揭晓
    UploadModal.jsx     添加素材弹窗（文本 / 链接 / 图片）
    FragmentView.jsx    素材列表行（含两下确认删除）
    CalendarModal.jsx   灵感日历：按天聚合的热力图
    AppAgent.jsx        对话页 + 「生成 MVP 卡片」交付物
    AppCommunity.jsx    社区页（Supabase 帖子 + 点赞 / 发帖 / 接力）
    AppMe.jsx           我的页（收藏 / 素材 / 等级 / 偏好 / 退出登录）
```

## 本地运行

```bash
npm install
cp .env.example .env      # 填入 VITE_ZHIPU_KEY（去 https://open.bigmodel.cn/usercenter/apikeys 申请）
npm run dev               # http://localhost:5173
```

`.env` 全空也能跑：

- 没填 `VITE_ZHIPU_KEY` → 首次合成时弹窗让你输入 Key（存浏览器 localStorage）。
- 没填 Supabase → 鉴权走本地 mock、社区帖子走 localStorage 种子，本地照样能体验全流程。

```bash
npm run build   # 产出 dist/，可直接部署 Vercel
npm run preview # 本地预览构建产物
```

### 环境变量一览

| 变量 | 用途 | 说明 |
|---|---|---|
| `VITE_ZHIPU_KEY` | 智谱 Key（本地直连） | ⚠️ `VITE_` 前缀会进前端 bundle，**仅本地开发用**；线上别配 |
| `VITE_ZHIPU_SYNTH_MODEL` / `VITE_ZHIPU_CHAT_MODEL` | 覆盖合成 / 对话模型 | 可选 |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Supabase 项目地址 + anon key | 鉴权与社区上云；不配则全本地回退 |

## 部署到 Vercel

1. vercel.com 用 GitHub 登录 → **New Project** → import 本 repo（Vite 零配置，自动 build `dist/` 并把 `api/` 识别成 serverless 函数）。
2. 项目 **Settings → Environment Variables**：
   - `ZHIPU_KEY=<智谱key>` —— **服务端变量，无 `VITE_` 前缀，不进 bundle**。前端检测到没有 `VITE_ZHIPU_KEY` 时会自动改调 `/api/chat` 代理，由服务端带 key 请求智谱。
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`（anon key 本就公开可用，带 `VITE_` 没问题）。
3. **Deploy**，之后每次 push 自动重新部署。

> Supabase 需在 SQL Editor 建 `posts` 表并配 RLS（开发期宽松、上线前收紧）。默认开启「邮箱确认」——注册后需点确认邮件才有 session；想演示免确认直登，到 **Auth → Providers/Email** 关掉 *Confirm email*。

## 功能进度

- [x] **P1** 基础设施：store + localStorage、智谱 agent 引擎、API Key 弹窗
- [x] **P2** 首页灵感罐「摇一摇」真实合成（抽 2–3 条素材 + 约束维度 → 碰撞）
- [x] 响应式外壳（Web + 移动端自适应，无模拟手机框）
- [x] **P3** 对话页接真实多步对话 + 「生成 MVP 卡片」交付物（复制 / 下载 .md / 存收藏）
- [x] **P4** 收藏 / 我的页读真实 store；素材增删 + 富素材（文本 / 链接 / 图片）+ 灵感日历热力图
- [x] **P5** 社区（Supabase 上云）+ 点赞 / 发帖 + 「接力」跨页流转到 Agent
- [x] 登录 / 注册（Supabase Auth，本地 mock 回退）+ 入口门禁
- [x] Vercel serverless 代理藏智谱 Key
- [ ] 个人数据（收藏 / 素材 / 偏好）随登录上云
- [ ] 上线前收紧 Supabase RLS

详细的逐步改动记录见 [DEVLOG.md](DEVLOG.md)。
