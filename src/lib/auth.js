// auth.js — 登录 / 注册鉴权层。
// 沿用项目「Supabase 可选」的一贯模式：
//   - 配了 Supabase（.env 有 URL+anon key）→ 用 Supabase Auth（邮箱 + 密码）。
//   - 没配 → 回退本地 mock：账号存 localStorage，密码只存简单哈希（仅供本地演示，非加密强度）。
// 组件统一调 Auth.signIn / signUp / signOut；登录态写进 store 的 user 字段，App 据此做入口门禁。
import { supabase, hasSupabase } from './supabase.js';
import { Store } from '../store.js';

// —— 本地 mock：账号表存 localStorage（与 store 同命名空间） ——
const NS = 'inspo:';
const loadUsers = () => { try { return JSON.parse(localStorage.getItem(NS + 'users') || '[]'); } catch { return []; } };
const saveUsers = (list) => { try { localStorage.setItem(NS + 'users', JSON.stringify(list)); } catch {} };
// 非加密强度的轻量哈希，只为避免密码在 localStorage 里明文躺着（本地 mock 用）
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };

// 把 Supabase user / mock user 统一成 { email, name }
const nameFromEmail = (email) => (email || '').split('@')[0] || '匿名';
const toUser = (su) => su ? { email: su.email || '', name: (su.user_metadata && su.user_metadata.name) || nameFromEmail(su.email) } : null;

// 校验：邮箱格式 + 密码长度，不过就抛错（错误文案直接显示给用户）
function validate(email, password) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('邮箱格式不太对');
  if ((password || '').length < 6) throw new Error('密码至少 6 位');
}

export const Auth = {
  // 启动初始化：Supabase 模式拉一次 session 并订阅变化；mock 模式立即就绪。
  // 模块底部自动调一次（StrictMode 下也只随模块加载跑一次，不会重复订阅）。
  async init() {
    if (!hasSupabase) { Store.set({ authReady: true }); return; }
    try {
      const { data } = await supabase.auth.getSession();
      Store.set({ user: toUser(data.session && data.session.user), authReady: true });
      supabase.auth.onAuthStateChange((_e, session) => {
        Store.set({ user: toUser(session && session.user) });
      });
    } catch (e) {
      console.warn('[auth] 初始化失败：', e && e.message);
      Store.set({ authReady: true });
    }
  },

  // 注册：成功后若已拿到 session 则直接登录；Supabase 开了邮箱确认会无 session → 返回 needConfirm。
  async signUp(email, password, name) {
    email = (email || '').trim();
    name = (name || '').trim() || nameFromEmail(email);
    validate(email, password);
    if (hasSupabase) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw new Error(error.message);
      if (!data.session) return { needConfirm: true }; // 需邮箱确认
      Store.set({ user: toUser(data.user) });
      return { user: toUser(data.user) };
    }
    // mock
    const users = loadUsers();
    if (users.some((u) => u.email === email)) throw new Error('该邮箱已注册，去登录吧');
    users.push({ email, name, pw: hash(password) });
    saveUsers(users);
    const user = { email, name };
    Store.set({ user });
    return { user };
  },

  async signIn(email, password) {
    email = (email || '').trim();
    validate(email, password);
    if (hasSupabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message === 'Invalid login credentials' ? '邮箱或密码不对' : error.message);
      Store.set({ user: toUser(data.user) });
      return { user: toUser(data.user) };
    }
    // mock
    const user = loadUsers().find((u) => u.email === email);
    if (!user) throw new Error('邮箱还没注册');
    if (user.pw !== hash(password)) throw new Error('密码不对');
    const u = { email: user.email, name: user.name };
    Store.set({ user: u });
    return { user: u };
  },

  async signOut() {
    if (hasSupabase) { try { await supabase.auth.signOut(); } catch {} }
    Store.set({ user: null });
  },
};

// 模块加载即初始化（App 一 import 就跑）
Auth.init();
