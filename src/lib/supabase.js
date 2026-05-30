// supabase.js — Supabase 客户端。
// 读 .env 的 VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY；没配则 supabase=null，
// store 会自动回退到 localStorage（本地开发不配也能跑）。
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabase = !!(url && anon);
export const supabase = hasSupabase ? createClient(url, anon) : null;
