// agent.js — 智谱 BigModel agent 引擎
// Key 优先级：.env 的 VITE_ZHIPU_KEY（本地开发）> 弹窗填入的 localStorage。
// ⚠️ VITE_ 变量会打进前端 bundle，生产环境藏 Key 需走后端代理（见 .env.example）。
import { Store } from '../store.js';

const API_BASE = 'https://open.bigmodel.cn/api/paas/v4';
// 模型分工（实测得出）：
// - SYNTH_MODEL 合成：单次只吐一个小 JSON，glm-4-flash 又快又够用（摇一摇 ~3s）。
// - CHAT_MODEL 对话：多轮长上下文里必须可靠守 JSON。实测 glm-4-flash 会「破防」退化成纯文字（4 轮只 1 轮合格），
//   glm-4.5-flash 多轮 4/4 稳定（代价是慢些 7-22s），故对话用它。
const MODEL = import.meta.env.VITE_ZHIPU_MODEL || 'glm-4.6';
const SYNTH_MODEL = import.meta.env.VITE_ZHIPU_SYNTH_MODEL || 'glm-4-flash';
const CHAT_MODEL = import.meta.env.VITE_ZHIPU_CHAT_MODEL || 'glm-4.5-flash';

// 灵感合成时叠加的「约束维度」，制造意想不到的碰撞
export const CONSTRAINTS = {
  形态: ['做成一句话就能用的小工具', '做成手机 App', '做成浏览器插件', '做成命令行小脚本'],
  人群: ['给独居老人', '给学生党', '给远程工作者', '给宠物主人'],
  约束: ['只能用语音交互', '必须离线可用', '一天只用一次', '零配置开箱即用'],
  情绪: ['让人会心一笑', '让人感到被照顾', '帮人减少焦虑', '制造一点小惊喜'],
};

const pickRandom = (arr, n) => {
  const a = arr.slice(), r = [];
  while (r.length < n && a.length) r.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
  return r;
};

// 解析 Key：环境变量优先，其次用户在弹窗填入的
export function getKey() {
  return import.meta.env.VITE_ZHIPU_KEY || Store.get().apiKey || '';
}

// 确保有 Key：没有则弹窗，返回 false
export function ensureKey() {
  if (getKey()) return true;
  Store.set({ needKey: true });
  return false;
}

async function complete(messages, { json = false, tools, temperature = 0.85, maxTokens = 1200, model = MODEL } = {}) {
  const key = getKey();
  if (!key) throw new Error('NO_KEY');
  const payload = { model, temperature, max_tokens: maxTokens, messages };
  if (json) payload.response_format = { type: 'json_object' };
  if (tools) { payload.tools = tools; payload.tool_choice = 'auto'; }
  const res = await fetch(API_BASE + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    if (res.status === 401) throw new Error('API Key 无效或已过期，请在「我的 → 通用设置」重新填写');
    throw new Error('智谱 API 错误 ' + res.status + '：' + txt.slice(0, 160));
  }
  return res.json();
}

function parseJSON(raw) {
  if (!raw) return null;
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const cand = fence ? fence[1] : (raw.match(/\{[\s\S]*\}/) || [raw])[0];
  try { return JSON.parse(cand.trim()); } catch { return null; }
}

// 灵感罐「摇一摇」：随机抽 2-3 条素材 + 1 个约束 → 碰撞出一条新灵感
export async function synthesize() {
  const frags = Store.get().fragments;
  if (frags.length < 2) throw new Error('灵感罐里素材太少了，先去攒一些吧');
  const picked = pickRandom(frags, Math.random() < 0.5 ? 2 : 3);
  const dims = Object.keys(CONSTRAINTS);
  const dim = dims[Math.floor(Math.random() * dims.length)];
  const val = CONSTRAINTS[dim][Math.floor(Math.random() * CONSTRAINTS[dim].length)];

  const sys = '你是「灵感搜集器」的灵感合成引擎。把用户灵感罐里的几条零散素材，加上一个约束维度，碰撞成一个新颖、有钩子、可落地的产品灵感。'
    + '只输出 JSON：{"lead":"标题前半句(铺垫/对象，可空)","accent":"标题核心词，<10字，最出彩的部分","blurb":"一句话说明它解决什么(<28字)"}。要意想不到，不要套话。';
  const user = `灵感罐素材：\n${picked.map((f, i) => `${i + 1}. ${f.text}`).join('\n')}\n\n约束维度：${dim} = ${val}\n\n把它们碰撞成一个产品灵感。`;
  // 合成用快模型 SYNTH_MODEL（glm-4-flash）+ 强制 JSON：摇一摇 ~3s；输出只是一个小 JSON，flash 够用
  const data = await complete([{ role: 'system', content: sys }, { role: 'user', content: user }], { json: true, temperature: 0.95, model: SYNTH_MODEL });
  const obj = parseJSON(data.choices?.[0]?.message?.content) || {};
  const shorten = (t) => t.length > 8 ? t.slice(0, 8) : t;
  return {
    lead: obj.lead || '',
    accent: obj.accent || obj.title || '一个新灵感',
    blurb: obj.blurb || '',
    sources: picked.map((f) => shorten(f.text)),
    constraint: `${dim}·${val}`,
  };
}

// —— 真·Agent：工具调用循环 ——————————————————————————
// 给模型「行动工具」：读灵感罐真实素材 / 存收藏；模型自主决定何时调。
// 回复用模型自然输出的文字；可点选项由 extractOptions 单独抽取
//（模型自己决定要不要列方向 → 卡片有无，自然实现「它自己判断给卡片还是文字」）。
const AGENT_TOOLS = [
  { type: 'function', function: {
    name: 'read_jar',
    description: '读取用户灵感罐里的真实素材碎片。开场、想基于用户真实素材聊、或帮他碰撞新灵感时，先调它看看。',
    parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: {
    name: 'save_idea',
    description: '把一个灵感存进用户的收藏。当用户明确表示想收藏 / 保存某个想法时调用。',
    parameters: { type: 'object', properties: { title: { type: 'string', description: '灵感标题' }, blurb: { type: 'string', description: '一句话说明' } }, required: ['title'] } } },
];

// 从「助手对用户说的话」里抽取可点选项（快模型单次 JSON 抽取，任务简单很稳）。
// 没在让用户做选择时返回空数组 → 自然实现「它自己判断给卡片还是文字」。
async function extractOptions(replyText) {
  if (!replyText || replyText.length < 8) return [];
  try {
    const sys = '你是抽取器。下面是产品助手对用户说的话。如果其中在让用户从几个方向/方案里挑选，把这些选项抽出来；如果只是普通解释、追问、或没让用户选，就返回空数组。只输出 json：{"options":[{"label":"≤12字短标题","desc":"≤20字说明"}]}，最多 3 个。';
    const data = await complete([{ role: 'system', content: sys }, { role: 'user', content: replyText }],
      { model: SYNTH_MODEL, json: true, temperature: 0.2, maxTokens: 400 });
    const parsed = parseJSON(data.choices?.[0]?.message?.content);
    const opts = parsed && Array.isArray(parsed.options) ? parsed.options : [];
    return opts.filter((o) => o && o.label).slice(0, 3).map((o) => ({ label: String(o.label).trim().slice(0, 16), desc: String(o.desc || '').trim().slice(0, 28) }));
  } catch { return []; }
}

// 跑一轮 Agent：工具调用循环（读罐子/存收藏）→ 自然文字回复 → 抽取选项。返回 { say, options, usedJar }。
async function runAgent(messages, { model = CHAT_MODEL, maxSteps = 4 } = {}) {
  const msgs = messages.slice();
  let finalText = '';
  let usedJar = false;
  for (let step = 0; step < maxSteps; step++) {
    const data = await complete(msgs, { model, tools: AGENT_TOOLS, temperature: 0.7, maxTokens: 1200 });
    const m = data.choices?.[0]?.message;
    if (!m) break;
    const calls = m.tool_calls || [];
    if (!calls.length) { finalText = (m.content || '').trim(); break; }
    msgs.push(m);
    for (const call of calls) {
      const name = call.function?.name;
      let args = {}; try { args = JSON.parse(call.function?.arguments || '{}'); } catch {}
      let result = 'ok';
      if (name === 'read_jar') {
        usedJar = true;
        const frags = Store.get().fragments.map((f) => f.text);
        result = JSON.stringify(pickRandom(frags, Math.min(14, frags.length)));
      } else if (name === 'save_idea') {
        Store.addSaved({ lead: '', accent: args.title || '新灵感', blurb: args.blurb || '', sources: [] });
        result = '已存进收藏';
      }
      msgs.push({ role: 'tool', tool_call_id: call.id, content: result });
    }
  }
  if (!finalText) finalText = '（我想得有点久，要不你再说一句？）';
  const options = await extractOptions(finalText);
  return { say: finalText, options, usedJar };
}

export const Agent = { API_BASE, MODEL, SYNTH_MODEL, CHAT_MODEL, CONSTRAINTS, getKey, ensureKey, complete, parseJSON, synthesize, runAgent, pickRandom };
