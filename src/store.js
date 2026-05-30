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

// 对话历史结构升级：旧版是纯文字 {text}，新版是结构化 {say, options}。
// 版本不符就清掉旧 chat —— 避免开发期残留的纯文字旧对话盖住新的可点选项交互。
// 注意：bump 这个数字 + 整页硬刷新，才能强制清掉浏览器里的旧对话。
const CHAT_VERSION = 3;
if (load('chatVer', 0) !== CHAT_VERSION) { save('chat', []); save('chatVer', CHAT_VERSION); }

let state = {
  apiKey: load('apiKey', ''),     // 用户在弹窗里填的 Key（agent 会优先用 .env 的 VITE_ZHIPU_KEY）
  fragments: load('fragments', SEED_FRAGMENTS).map((t, i) => typeof t === 'string' ? { id: 'seed' + i, text: t } : t),
  saved: load('saved', []),
  chat: load('chat', []),         // 对话页消息历史 [{role:'user'|'agent', text, picked?}]，持久化 → 刷新不丢
  posts: load('posts', SEED_POSTS), // 社区帖子，持久化
  prefs: load('prefs', []),       // 灵感口味偏好标签，持久化
  needKey: false,                 // 控制 API Key 弹窗
  showUpload: false,              // 控制素材上传弹窗
  pendingIdea: null,              // 从首页「让 Agent 展开它」带过去的灵感；对话页消费后清空
};

const subs = new Set();
const emit = () => subs.forEach((fn) => fn());
const PERSIST = { apiKey: 1, fragments: 1, saved: 1, chat: 1, posts: 1, prefs: 1 };

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
  addSaved(idea) { set({ saved: [{ id: 'i' + Date.now(), ...idea, ts: Date.now() }, ...state.saved] }); },
  removeSaved(id) { set({ saved: state.saved.filter((s) => s.id !== id) }); },
  addFragment(text) { const t = (text || '').trim(); if (!t) return 0; set({ fragments: [...state.fragments, { id: 'f' + Date.now(), text: t }] }); return 1; },
  setPendingIdea(idea) { set({ pendingIdea: idea || null }); },
  clearPendingIdea() { if (state.pendingIdea) set({ pendingIdea: null }); },
  setChat(messages) { set({ chat: messages || [] }); },
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
  addFragments(list) {
    const items = (list || []).map((t) => String(t).trim()).filter(Boolean)
      .map((t, i) => ({ id: 'f' + Date.now() + '-' + i, text: t }));
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
