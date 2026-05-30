// agent.js — 智谱 BigModel agent 引擎 (P1)
// 移植自旧版「灵感骰子」的 agent 内核，适配新设计。
// 暴露 window.Agent：complete()（底层补全）/ synthesize()（灵感罐合成）/ ensureKey() 等。
// 对话页的多步 tool-use 循环（propose_directions / expand_plan / search_cases）将在 P3 接入。

const { Store } = window;   // 每个 babel script 作用域独立，跨文件依赖统一从 window 取

const Agent = (() => {
  const API_BASE = 'https://open.bigmodel.cn/api/paas/v4';
  const MODEL = 'glm-4.6';   // 做成 Agent 用最强的多步 function-calling 模型；可切 glm-4.5 / glm-4-air

  // 灵感合成时叠加的「约束维度」，制造意想不到的碰撞
  const CONSTRAINTS = {
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

  // 确保有 Key：没有则弹窗，返回 false
  function ensureKey() {
    if (Store.get().apiKey) return true;
    Store.set({ needKey: true });
    return false;
  }

  async function complete(messages, { json = false, tools, temperature = 0.85, maxTokens = 1200 } = {}) {
    const key = Store.get().apiKey;
    if (!key) throw new Error('NO_KEY');
    const payload = { model: MODEL, temperature, max_tokens: maxTokens, messages };
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
  async function synthesize() {
    const frags = Store.get().fragments;
    if (frags.length < 2) throw new Error('灵感罐里素材太少了，先去攒一些吧');
    const picked = pickRandom(frags, Math.random() < 0.5 ? 2 : 3);
    const dims = Object.keys(CONSTRAINTS);
    const dim = dims[Math.floor(Math.random() * dims.length)];
    const val = CONSTRAINTS[dim][Math.floor(Math.random() * CONSTRAINTS[dim].length)];

    const sys = '你是「灵感搜集器」的灵感合成引擎。把用户灵感罐里的几条零散素材，加上一个约束维度，碰撞成一个新颖、有钩子、可落地的产品灵感。'
      + '只输出 JSON：{"lead":"标题前半句(铺垫/对象，可空)","accent":"标题核心词，<10字，最出彩的部分","blurb":"一句话说明它解决什么(<28字)"}。要意想不到，不要套话。';
    const user = `灵感罐素材：\n${picked.map((f, i) => `${i + 1}. ${f.text}`).join('\n')}\n\n约束维度：${dim} = ${val}\n\n把它们碰撞成一个产品灵感。`;
    const data = await complete([{ role: 'system', content: sys }, { role: 'user', content: user }], { json: true, temperature: 0.95 });
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

  return { API_BASE, MODEL, CONSTRAINTS, ensureKey, complete, parseJSON, synthesize, pickRandom };
})();
window.Agent = Agent;
