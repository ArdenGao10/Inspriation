// store.js — 全局状态 + localStorage 持久化
// 极简外部 store（subscribe/get/set）+ React useSyncExternalStore 绑定。
import { useSyncExternalStore } from 'react';
import { supabase, hasSupabase } from './lib/supabase.js';

// 灵感罐种子素材（builder 日常碎片）。首次进入写入 localStorage，之后以本地为准。
export const SEED_FRAGMENTS = [
  '周会复盘总忘记记要点', '想给独居老人做一句话方言天气播报', '代码截图美化器，分享到社区好看',
  '通勤听播客记不住重点', '宠物喂食容易忘，想要打卡墙', '深夜冒出的灵感第二天就忘了',
  '日历里的空隙没被利用起来', '会议录音能不能自动变待办清单', '收藏夹吃灰，存了再也不看',
  '健身打卡总坚持不下来', '读论文做笔记很麻烦', '给爸妈解释科技产品好难',
  '想要的表情包总是找不到', '番茄钟总被消息打断', 'commit message 每次都不知道怎么写',
  '想把灵感按心情分类', '周末想做点小项目但没头绪', '喜欢的句子摘抄散落在各处',
  '本地小店的菜单想拍照存档', '想给室友做个共享待办',
];

// 社区种子帖子。kind: '晒成品' | '接力灵感'。首次写入 localStorage，之后以本地为准。
export const SEED_POSTS = [
  { id: 'seedp1', name: '林深', kind: '晒成品', title: '上周从灵感罐摇出来的「代码截图美化器」，开源了', media: true, likes: 248, liked: false, comments: 32, ts: Date.now() - 2 * 3600e3 },
  { id: 'seedp2', name: '阿木', kind: '接力灵感', title: '想给独居老人做一句话方言天气播报，谁来接力？', media: false, likes: 156, liked: false, comments: 41, ts: Date.now() - 5 * 3600e3 },
  { id: 'seedp3', name: 'Yuki', kind: '晒成品', title: '宠物喂食打卡墙，室友们都在用，附上 Demo', media: true, likes: 320, liked: false, comments: 18, ts: Date.now() - 24 * 3600e3 },
];

const NS = 'inspo:';
const load = (k, d) => { try { const v = localStorage.getItem(NS + k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch {} };

// —— 多会话 ——
// 对话从「单条 chat」升级成「多会话 conversations」：每次「让 Agent 展开它」/「新对话」
// 都开一个独立会话，左上角历史入口可切换/删除。会话结构 { id, title, messages, updatedAt }。
const EMPTY_MSGS = [];
let convSeq = 0;
const convTitle = (messages) => {
  const u = (messages || []).find((m) => m.role === 'user');
  if (u && u.text) return u.text.trim().slice(0, 18);
  const a = (messages || []).find((m) => m.role === 'agent');
  const t = a && (a.say || a.text);
  return t ? String(t).trim().slice(0, 18) : '新对话';
};
const makeConv = (messages = []) => ({ id: 'c' + Date.now() + '-' + (convSeq++), title: convTitle(messages), messages, updatedAt: Date.now() });
export const selectChat = (s) => { const c = s.conversations.find((x) => x.id === s.activeConvId); return c ? c.messages : EMPTY_MSGS; };

// 迁移：旧版单条 chat（结构化 {say, options}）若有内容，并成一个会话；之后只认 conversations。
const CONV_VERSION = 1;
if (load('convVer', 0) !== CONV_VERSION) {
  const old = load('chat', []);
  const init = (Array.isArray(old) && old.length) ? [makeConv(old)] : [];
  save('conversations', init);
  save('activeConvId', init[0] ? init[0].id : '');
  save('convVer', CONV_VERSION);
}

// —— 素材类型 ——
// 素材从纯文本升级成「带类型 + 时间戳」：kind ∈ text | link | image。
//   - text  ：{ text }
//   - link  ：{ text, url }（url 为链接地址，text 默认同 url）
//   - image ：{ text, url }（url 为图片 dataURL，text 为「图片：文件名」等说明）
// ts（毫秒）用于「灵感日历」按天聚合统计。agent 仍只读 f.text，保持兼容。
const URL_RE = /^https?:\/\/\S+$/i;
export const detectKind = (t) => (URL_RE.test((t || '').trim()) ? 'link' : 'text');
// 规整一条素材：补 ts / kind / url，兼容旧的 {id,text} 与纯字符串
function normFrag(f, i, baseTs) {
  if (typeof f === 'string') f = { text: f };
  f = f || {};
  const text = f.text || '';
  let ts = f.ts;
  if (!ts) {
    // 旧的 f<毫秒> id 能反解出时间；否则按序在过去铺开（给日历一点初始热度，约 0.37 天/条）
    const m = /^f(\d{10,})/.exec(f.id || '');
    ts = m ? Number(m[1]) : Math.round(baseTs - i * 0.37 * 86400e3);
  }
  const kind = f.kind || detectKind(text);
  const out = { id: f.id || ('f' + baseTs + '-' + i), text, ts, kind };
  if (f.url) out.url = f.url;
  return out;
}

// 迁移：把灵感罐素材统一成带 ts/kind 的结构，并持久化一次（之后时间戳稳定，不随刷新漂移）。
const FRAG_VERSION = 2;
if (load('fragVer', 0) < FRAG_VERSION) {
  const raw = load('fragments', SEED_FRAGMENTS);
  const base = Date.now();
  save('fragments', (raw || []).map((f, i) => normFrag(f, i, base)));
  save('fragVer', FRAG_VERSION);
}

let state = {
  user: load('user', null),       // 登录用户 { email, name }；未登录为 null。鉴权逻辑在 lib/auth.js
  authReady: !hasSupabase,        // 鉴权是否就绪：mock 模式立即就绪；Supabase 模式等 getSession 回来
  apiKey: load('apiKey', ''),     // 用户在弹窗里填的 Key（agent 会优先用 .env 的 VITE_ZHIPU_KEY）
  fragments: load('fragments', SEED_FRAGMENTS).map((f, i) => normFrag(f, i, Date.now())), // {id,text,ts,kind,url?}

  saved: load('saved', []),
  conversations: load('conversations', []), // 多会话 [{id,title,messages,updatedAt}]，持久化
  activeConvId: load('activeConvId', ''),    // 当前激活会话 id
  posts: load('posts', SEED_POSTS), // 社区帖子，持久化
  prefs: load('prefs', []),       // 灵感口味偏好标签，持久化
  needKey: false,                 // 控制 API Key 弹窗
  showUpload: false,              // 控制素材上传弹窗
  showCalendar: false,            // 控制灵感日历全屏页
  pendingIdea: null,              // 从首页「让 Agent 展开它」带过去的灵感；对话页消费后清空
};

const subs = new Set();
const emit = () => subs.forEach((fn) => fn());
const PERSIST = { user: 1, apiKey: 1, fragments: 1, saved: 1, conversations: 1, activeConvId: 1, posts: 1, prefs: 1 };

// 我赞过的帖子 id（本地个人态，不上云）；写云端时去掉本地专用的 liked 字段
let likedIds = load('likedIds', []);
const cloudPost = (p) => { const { liked, ...rest } = p; return rest; };

function set(patch) {
  state = { ...state, ...patch };
  for (const k in patch) if (PERSIST[k]) save(k, state[k]);
  emit();
}

export const Store = {
  get: () => state,
  subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); },
  set,
  addSaved(idea) { const it = { id: 'i' + Date.now(), ...idea, ts: Date.now() }; set({ saved: [it, ...state.saved] }); return it; },
  removeSaved(id) { set({ saved: state.saved.filter((s) => s.id !== id) }); },
  // 入参可为字符串（文本素材）或对象 { text, kind?, url? }（链接 / 图片素材）
  addFragment(input) {
    const f = typeof input === 'string' ? { text: input } : (input || {});
    const text = (f.text || '').trim();
    if (!text && !f.url) return null;
    const it = { id: 'f' + Date.now(), text, ts: Date.now(), kind: f.kind || detectKind(text) };
    if (f.url) it.url = f.url;
    set({ fragments: [...state.fragments, it] });
    return it.id;
  },
  removeFragment(id) { set({ fragments: state.fragments.filter((f) => f.id !== id) }); },
  setPendingIdea(idea) { set({ pendingIdea: idea || null }); },
  clearPendingIdea() { if (state.pendingIdea) set({ pendingIdea: null }); },
  // —— 多会话读写 ——
  getChat: () => { const c = state.conversations.find((x) => x.id === state.activeConvId); return c ? c.messages : EMPTY_MSGS; },
  // 写当前激活会话的消息；没有激活会话则顺手开一个。标题随首条消息自动生成。
  setChat(messages) {
    const msgs = messages || [];
    const conv = state.conversations.find((c) => c.id === state.activeConvId);
    if (!conv) { const it = makeConv(msgs); set({ conversations: [it, ...state.conversations], activeConvId: it.id }); return; }
    set({ conversations: state.conversations.map((c) => c.id === conv.id
      ? { ...c, messages: msgs, title: convTitle(msgs), updatedAt: Date.now() } : c) });
  },
  // 按会话 id 读写（不依赖「当前激活」）——回复要写回它发起时所属的会话，哪怕中途切了会话
  getConvMessages: (id) => { const c = state.conversations.find((x) => x.id === id); return c ? c.messages : EMPTY_MSGS; },
  setConvMessages(id, messages) {
    const msgs = messages || [];
    set({ conversations: state.conversations.map((c) => c.id === id
      ? { ...c, messages: msgs, title: convTitle(msgs), updatedAt: Date.now() } : c) });
  },
  newConversation(messages) { const it = makeConv(messages || []); set({ conversations: [it, ...state.conversations], activeConvId: it.id }); return it.id; },
  switchConversation(id) { if (state.conversations.some((c) => c.id === id)) set({ activeConvId: id }); },
  deleteConversation(id) {
    const rest = state.conversations.filter((c) => c.id !== id);
    const active = state.activeConvId === id ? (rest[0] ? rest[0].id : '') : state.activeConvId;
    set({ conversations: rest, activeConvId: active });
  },
  // 社区：发帖（新帖置顶）、点赞切换。配了 Supabase 就同步云端（失败不影响本地）。
  addPost(post) {
    const p = { id: 'p' + Date.now(), name: '我', kind: '晒成品', media: false, likes: 0, liked: false, comments: 0, ts: Date.now(), ...post };
    set({ posts: [p, ...state.posts] });
    if (hasSupabase) supabase.from('posts').insert(cloudPost(p)).then(({ error }) => { if (error) console.warn('[supabase] 发帖同步失败：', error.message); });
    return p;
  },
  toggleLike(id) {
    const wasLiked = likedIds.includes(id);
    likedIds = wasLiked ? likedIds.filter((x) => x !== id) : [...likedIds, id];
    save('likedIds', likedIds);
    let newLikes = 0;
    set({ posts: state.posts.map((p) => {
      if (p.id !== id) return p;
      newLikes = Math.max(0, p.likes + (wasLiked ? -1 : 1));
      return { ...p, liked: !wasLiked, likes: newLikes };
    }) });
    if (hasSupabase) supabase.from('posts').update({ likes: newLikes }).eq('id', id).then(({ error }) => { if (error) console.warn('[supabase] 点赞同步失败：', error.message); });
  },
  // 从云端拉社区帖子（覆盖本地缓存）。云端空则用本地种子播种一次。表不存在/出错则保持本地。
  async loadPostsFromCloud() {
    if (!hasSupabase) return;
    try {
      let { data, error } = await supabase.from('posts').select('*').order('ts', { ascending: false });
      if (error) { console.warn('[supabase] 读取 posts 失败（表是否已建？）：', error.message); return; }
      if (data && data.length === 0) {
        await supabase.from('posts').upsert(SEED_POSTS.map(cloudPost), { onConflict: 'id', ignoreDuplicates: true });
        ({ data } = await supabase.from('posts').select('*').order('ts', { ascending: false }));
      }
      if (data) set({ posts: data.map((p) => ({ ...p, liked: likedIds.includes(p.id) })) });
    } catch (e) { console.warn('[supabase] loadPostsFromCloud 异常：', e && e.message); }
  },
  togglePref(tag) {
    const has = state.prefs.includes(tag);
    set({ prefs: has ? state.prefs.filter((t) => t !== tag) : [...state.prefs, tag] });
  },
  // 批量加入素材，返回实际新增条数（用于"输入多少加多少计数"）
  // list 每项可为字符串或 { text, kind?, url? }
  addFragments(list) {
    const now = Date.now();
    const items = (list || []).map((f, i) => {
      if (typeof f === 'string') f = { text: f };
      f = f || {};
      const text = (f.text || '').trim();
      if (!text && !f.url) return null;
      const it = { id: 'f' + now + '-' + i, text, ts: now + i, kind: f.kind || detectKind(text) };
      if (f.url) it.url = f.url;
      return it;
    }).filter(Boolean);
    if (!items.length) return 0;
    set({ fragments: [...state.fragments, ...items] });
    return items.length;
  },
};

// 启动：配了 Supabase 就从云端拉社区帖子（覆盖本地缓存）；没配则继续用 localStorage
if (hasSupabase) Store.loadPostsFromCloud();

// React 绑定：组件用 useStore(selector) 订阅 store 的某一部分
export function useStore(selector) {
  return useSyncExternalStore(Store.subscribe, () => selector(Store.get()));
}
