// store.js — 全局状态 + localStorage 持久化
// 极简外部 store（subscribe/get/set）+ React useSyncExternalStore 绑定。
import { useSyncExternalStore } from 'react';

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

const NS = 'inspo:';
const load = (k, d) => { try { const v = localStorage.getItem(NS + k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch {} };

let state = {
  apiKey: load('apiKey', ''),     // 用户在弹窗里填的 Key（agent 会优先用 .env 的 VITE_ZHIPU_KEY）
  fragments: load('fragments', SEED_FRAGMENTS).map((t, i) => typeof t === 'string' ? { id: 'seed' + i, text: t } : t),
  saved: load('saved', []),
  needKey: false,                 // 控制 API Key 弹窗
  showUpload: false,              // 控制素材上传弹窗
  pendingIdea: null,              // 从首页「让 Agent 展开它」带过去的灵感；对话页消费后清空
};

const subs = new Set();
const emit = () => subs.forEach((fn) => fn());
const PERSIST = { apiKey: 1, fragments: 1, saved: 1 };

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
  // 批量加入素材，返回实际新增条数（用于"输入多少加多少计数"）
  addFragments(list) {
    const items = (list || []).map((t) => String(t).trim()).filter(Boolean)
      .map((t, i) => ({ id: 'f' + Date.now() + '-' + i, text: t }));
    if (!items.length) return 0;
    set({ fragments: [...state.fragments, ...items] });
    return items.length;
  },
};

// React 绑定：组件用 useStore(selector) 订阅 store 的某一部分
export function useStore(selector) {
  return useSyncExternalStore(Store.subscribe, () => selector(Store.get()));
}
