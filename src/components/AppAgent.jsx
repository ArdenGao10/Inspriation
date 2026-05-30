// AppAgent.jsx — Agent 对话页。
// 两种形态：
//   1) 默认（store.pendingIdea 为空且无历史消息）→ 渲染设计稿静态对话样本。
//   2) 首页「让 Agent 展开它」过来时（store.pendingIdea 非空）→ 自动发出一条用户消息
//      「帮我展开这个灵感：{title}」并调用智谱 API 展开，回复完成后 clearPendingIdea。
import React from 'react';
import { G } from '../theme.js';
import { GIcon, GlowField } from './glow.jsx';
import { Store, useStore } from '../store.js';
import { Agent } from '../lib/agent.js';

function GlowDot({ size = 24 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px`, display: 'grid', placeItems: 'center' }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: size * 1.5, height: size * 1.5, transform: 'translate(-50%,-50%)',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,224,130,0.6), rgba(255,224,130,0) 70%)', filter: 'blur(3px)', animation: 'gGlow 4s ease-in-out infinite' }} />
      <GIcon name="spark" size={size * 0.82} color={G.gold} sw={1.5} />
    </div>
  );
}

function UserBubble({ children }) {
  return (
    <div style={{ alignSelf: 'flex-end', maxWidth: '80%', padding: '14px 18px', borderRadius: '16px 4px 16px 16px',
      background: 'rgba(212,148,58,0.08)',
      fontSize: 14.5, lineHeight: 1.55, color: G.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {children}
    </div>
  );
}

function AgentBubble({ children, maxW = '80%' }) {
  return (
    <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: maxW }}>
      <div style={{ marginTop: 6 }}><GlowDot size={24} /></div>
      <div style={{ flex: 1, padding: '16px 20px', borderRadius: '4px 16px 16px 16px', background: '#FFFCF7',
        border: '1px solid #E8DFD0', fontSize: 14.5, lineHeight: 1.6, color: G.ink,
        boxShadow: '0 2px 10px rgba(120,90,30,0.04)', wordBreak: 'break-word' }}>
        {children}
      </div>
    </div>
  );
}

// 三个金色圆点跳动 —— Agent 正在思考时显示
function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', padding: '4px 2px' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: 7, background: G.gold,
          animation: `typingDot 1.1s ease-in-out ${i * 0.16}s infinite` }} />
      ))}
    </span>
  );
}

// —— 富文本渲染：**加粗**、列表、方向卡片 ——
// 行内：把 **xxx** 渲染成 <strong>，其余原样保留。
function renderInline(text) {
  if (!text || !text.includes('**')) return text;
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return parts.map((p, i) => (
    p.startsWith('**') && p.endsWith('**') && p.length > 4
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : <React.Fragment key={i}>{p}</React.Fragment>
  ));
}

// 把 Agent 回复拆成「段落 / 列表 / 方向卡片」三类块。
// - 行首匹配「方向X：xxx」→ 收进卡片组
// - 行首匹配「* / - / • / ·」→ 收进列表
// - 其余非空行 → 拼成段落（空行分段）
function parseAgentBlocks(text) {
  const lines = String(text || '').split('\n');
  const blocks = [];
  let curList = null;
  let curCards = null;
  let curPara = [];
  const flushPara = () => {
    if (curPara.length) {
      const t = curPara.join('\n').trim();
      if (t) blocks.push({ type: 'para', text: t });
      curPara = [];
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    const dir = line.match(/^\s*方向\s*([A-Za-z0-9一二三四五六])\s*[：:、.\-]\s*(.+)$/);
    if (dir) {
      flushPara(); curList = null;
      if (!curCards) { curCards = { type: 'cards', items: [] }; blocks.push(curCards); }
      curCards.items.push({ key: dir[1], label: '方向' + dir[1], desc: dir[2].trim() });
      continue;
    }
    const li = line.match(/^\s*[*\-•·]\s+(.+)$/);
    if (li) {
      flushPara(); curCards = null;
      if (!curList) { curList = { type: 'list', items: [] }; blocks.push(curList); }
      curList.items.push(li[1]);
      continue;
    }
    if (!line.trim()) { flushPara(); curList = null; curCards = null; continue; }
    curList = null; curCards = null;
    curPara.push(line);
  }
  flushPara();
  return blocks;
}

// 可点击的方向卡片：左侧金色序号圈 · 中间描述 · 右侧箭头。
// 选中后该卡金色加粗描边，其余变灰；全组锁定不再可点（防重复发送）。
function DirectionCards({ items, picked, onPick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '8px 0' }}>
      {items.map((c, j) => {
        const on = picked === c.label;
        const dim = picked && !on;
        return (
          <div key={j} className={`gdir-card${picked ? ' gdir-locked' : ''}`}
            onClick={() => { if (!picked) onPick && onPick(c); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#FFFCF7', borderRadius: 12, padding: '12px 16px',
              border: `${on ? 2 : 1}px solid ${on ? G.gold : '#E8DFD0'}`,
              cursor: picked ? 'default' : 'pointer',
              opacity: dim ? 0.5 : 1,
              transition: 'border-color .15s ease, background .15s ease, opacity .25s ease',
            }}>
            <span style={{ width: 26, height: 26, flex: '0 0 26px', borderRadius: '50%', display: 'grid', placeItems: 'center',
              background: on ? G.gold : '#FBEFD6', color: on ? '#fff' : G.gold,
              fontFamily: G.serif, fontWeight: 600, fontSize: 13.5, lineHeight: 1 }}>{c.key}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: G.ink, lineHeight: 1.4 }}>{c.label}</div>
              {c.desc && <div style={{ fontSize: 12.5, color: G.inkSoft, lineHeight: 1.45, marginTop: 2 }}>{c.desc}</div>}
            </div>
            <GIcon name="arrow" size={16} color={on ? G.gold : G.inkFaint} sw={1.7} />
          </div>
        );
      })}
    </div>
  );
}

// 渲染一条 agent 气泡：say 文字（段落 / 列表）+ 由 options 驱动的可点选项卡。
// 选项不再靠正则从文字里抠，而是模型结构化返回的 options 字段，所以一定能渲染出来。
function AgentContent({ text, options, picked, onPick }) {
  const blocks = React.useMemo(() => parseAgentBlocks(text), [text]);
  const cards = React.useMemo(() => (
    Array.isArray(options) && options.length
      ? options.map((o, i) => ({ key: String.fromCharCode(65 + i), label: o.label, desc: o.desc }))
      : null
  ), [options]);
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === 'para') {
          return <div key={i} style={{ marginTop: i ? 8 : 0, whiteSpace: 'pre-wrap' }}>{renderInline(b.text)}</div>;
        }
        if (b.type === 'list') {
          return (
            <ul key={i} style={{ margin: '6px 0 0', paddingLeft: 22, listStyle: 'disc' }}>
              {b.items.map((it, j) => (
                <li key={j} style={{ marginBottom: 4, lineHeight: 1.55 }}>{renderInline(it)}</li>
              ))}
            </ul>
          );
        }
        // 文字里若混进了「方向X」行（模型偶发不守约定），忽略它——选项统一走 options 卡片，避免重复
        return null;
      })}
      {cards && <DirectionCards items={cards} picked={picked} onPick={onPick} />}
    </>
  );
}

const ideaTitle = (idea) => `${idea.lead ? idea.lead + ' ' : ''}${idea.accent || ''}`.trim() || '一个新灵感';

// 把首页带过来的 idea 拼成第一条用户消息（同时是 UI 气泡 + API content）
function buildInitialUserMessage(idea) {
  const title = ideaTitle(idea);
  const blurb = (idea.blurb || '').trim();
  return blurb
    ? `帮我展开这个灵感：${title}\n（${blurb}）`
    : `帮我展开这个灵感：${title}`;
}

// 共创式对话的 system prompt。要求严格 JSON 输出 → 前端确定性渲染「说的话 + 可点选项卡」。
const SYS_PROMPT = `你是「灵感 Agent」，一个有经验的产品搭子。和用户一步步把一个 idea 聊成能落地的方案。

【原则】
- 共创伙伴，不是方案生成器。每轮只推进一小步，简短（say 不超过 150 字）。
- 口语化中文，像朋友聊天。不要 markdown、不要加粗。
- 多数时候给用户 2-3 个「可点的选项」，等他选了再继续；不要一次倒完整方案。

【对话节奏】
- 开场 / 拿到 idea：一句话说你的理解（带点趣味），然后给 2-3 个可深入的方向当 options。
- 用户选了某个方向：2-3 句说清核心玩法 + 1 句目标用户，再给 options，比如「拆解 MVP」「找类似产品」「换个方向」。
- 拆 MVP：say 里列 3-5 步行动（每步单独一行，行首用「· 」），可再给 options「给技术栈」「画原型」「收藏进罐」。

【输出格式 · 必须严格遵守】
只输出一个 JSON 对象，不要任何额外文字、不要代码围栏、不要 markdown：
{"say":"要对用户说的话","options":[{"label":"选项短标题(不超过12字)","desc":"一句话说明(不超过20字)"}]}
- options 是给用户点击的选项，0-3 个；当前不需要让用户选择时给 []（空数组）。
- say 里不要重复 options 的内容，也不要写「方向A」「1.」这种编号——选项由 options 字段单独给。`;

// 无灵感进来时的开场白（也用于「新对话」重置）
const GREETING = '你今天有什么想聊的灵感吗？可以聊一聊。';

export function AppAgent() {
  const pendingIdea = useStore((s) => s.pendingIdea);
  // 消息历史改存到全局 store（持久化到 localStorage）→ 切 Tab / 刷新页面都不丢
  const messages = useStore((s) => s.chat);
  const [loading, setLoading] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const scrollerRef = React.useRef(null);
  // 已处理过的 idea 引用 —— StrictMode 双触发兜底
  const handledIdeaRef = React.useRef(null);

  // 写消息：直接落到 store（同步更新 state + 写 localStorage）。读最新值用 Store.get().chat。
  const writeMessages = (next) => Store.setChat(next);

  // 把当前对话历史转成智谱 API 的 messages 数组（system + user/assistant 轮替）。
  // agent 消息回传纯文字（say），不回传 options 的 JSON —— 省 token、模型也更清楚。
  const buildApiHistory = (msgs) => [
    { role: 'system', content: SYS_PROMPT },
    ...msgs.map((m) => ({
      role: m.role === 'agent' ? 'assistant' : 'user',
      content: m.role === 'agent' ? (m.say ?? m.text ?? '') : m.text,
    })),
  ];

  // 把模型返回的 content 解析成结构化 agent 消息 { say, options }。
  // 解析失败（模型没按 JSON 输出）就整段当纯文字兜底，绝不让交互崩掉。
  const parseAgentReply = (content) => {
    const parsed = Agent.parseJSON(content);
    if (parsed && typeof parsed === 'object' && (parsed.say != null || Array.isArray(parsed.options))) {
      const options = Array.isArray(parsed.options)
        ? parsed.options.filter((o) => o && o.label).slice(0, 3).map((o) => ({ label: String(o.label).trim(), desc: String(o.desc || '').trim() }))
        : [];
      return { role: 'agent', say: String(parsed.say || '').trim() || '(没拿到回复)', options };
    }
    return { role: 'agent', say: (content || '').trim() || '(没拿到回复)' };
  };

  // 发一条用户消息 → 追加用户气泡 → 带完整历史调智谱（快模型）→ 解析成结构化 agent 气泡
  const sendUser = async (text) => {
    const t = (text || '').trim();
    if (!t || loading) return;
    if (!Agent.ensureKey()) return;
    const nextAfterUser = [...Store.get().chat, { role: 'user', text: t }];
    writeMessages(nextAfterUser);
    setLoading(true);
    try {
      const data = await Agent.complete(buildApiHistory(nextAfterUser), { model: Agent.CHAT_MODEL, temperature: 0.8, maxTokens: 600 });
      const content = (data.choices?.[0]?.message?.content || '').trim();
      writeMessages([...Store.get().chat, parseAgentReply(content)]);
    } catch (err) {
      const msg = err && err.message === 'NO_KEY' ? '请先连接智谱 API Key' : (err && err.message) || '展开失败';
      writeMessages([...Store.get().chat, { role: 'agent', say: '抱歉，出错了：' + msg }]);
    } finally {
      setLoading(false);
    }
  };

  // 选项卡点击 → 给当前 agent 气泡打 picked 标记 + 自动发一条用户消息
  const handlePickDirection = (msgIndex, choice) => {
    const updated = Store.get().chat.map((mm, ii) => ii === msgIndex ? { ...mm, picked: choice.label } : mm);
    writeMessages(updated);
    sendUser(choice.desc ? `我选「${choice.label}」：${choice.desc}` : `我选「${choice.label}」`);
  };

  const submitDraft = () => {
    const t = draft.trim();
    if (!t || loading) return;
    setDraft('');
    sendUser(t);
  };

  // 清空对话 → 重置成只有开场白的初始态
  const clearChat = () => {
    if (loading) return;
    writeMessages([{ role: 'agent', say: GREETING }]);
    setDraft('');
  };

  // 没有从首页带来灵感、且 store 里也没有历史时，Agent 先抛一句开场白。
  // store.chat 已有内容（刷新恢复 / 已经聊过）时不再插入，避免覆盖历史。
  React.useEffect(() => {
    if (pendingIdea) return;
    if (Store.get().chat.length > 0) return;
    writeMessages([{ role: 'agent', say: GREETING }]);
  }, [pendingIdea]);

  // 监听 store.pendingIdea：来自首页的灵感 → 自动产生第一轮对话
  React.useEffect(() => {
    if (!pendingIdea) return;
    if (handledIdeaRef.current === pendingIdea) return; // 同一个 idea 不会被处理两次
    if (!Agent.ensureKey()) return;
    handledIdeaRef.current = pendingIdea;
    const idea = pendingIdea;
    Store.clearPendingIdea();
    sendUser(buildInitialUserMessage(idea));
  }, [pendingIdea]);

  // 新消息进来时滚到底
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const canSend = draft.trim().length > 0 && !loading;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* 头部：光晕收束在这一格内，正中对齐 Agent 那颗闪烁星星，避免光点飘到下方卡片旁边 */}
      <div style={{ position: 'relative', overflow: 'hidden', zIndex: 2, padding: '14px 22px 14px' }}>
        <GlowField x="50%" y="30%" r={170} intensity={0.5} motes={6} spread={0.7} />
        {messages.length > 1 && (
          <span className="gpress" onClick={clearChat} title="清空，开始新对话"
            style={{ position: 'absolute', right: 16, top: 16, zIndex: 2, cursor: loading ? 'default' : 'pointer',
              fontSize: 11.5, color: G.inkFaint, opacity: loading ? 0.4 : 1 }}>新对话</span>
        )}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <GlowDot size={30} />
          <div style={{ fontFamily: G.serif, fontSize: 18, color: G.ink, letterSpacing: 0.4 }}>灵感 Agent</div>
          <div style={{ fontSize: 11.5, color: G.inkFaint, letterSpacing: 0.4 }}>把一句话,聊成一个方案</div>
        </div>
      </div>
      <div ref={scrollerRef} className="glow-scroll" style={{ position: 'relative', zIndex: 2, flex: 1, minHeight: 0, overflowY: 'auto',
        padding: '4px 20px 12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((m, i) => (
          m.role === 'user'
            ? <UserBubble key={i}>{m.text}</UserBubble>
            : <AgentBubble key={i}>
                <AgentContent text={m.say ?? m.text} options={m.options} picked={m.picked}
                  onPick={(c) => handlePickDirection(i, c)} />
              </AgentBubble>
        ))}
        {loading && <AgentBubble><TypingDots /></AgentBubble>}
      </div>
      <div style={{ position: 'relative', zIndex: 3, padding: '8px 20px 14px',
        background: 'linear-gradient(to top, rgba(253,251,244,0.97) 60%, rgba(253,251,244,0))' }}>
        <form onSubmit={(e) => { e.preventDefault(); submitDraft(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, borderRadius: 999, padding: '0 8px 0 18px',
          background: '#fff', border: `1px solid ${G.hair}`, boxShadow: '0 3px 14px rgba(120,90,30,0.06)' }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} disabled={loading}
            placeholder={loading ? 'Agent 思考中…' : '继续聊聊你的想法…'}
            style={{ flex: 1, height: 44, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, color: G.ink, fontFamily: 'inherit' }} />
          <button type="submit" disabled={!canSend} className="gpress"
            style={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center',
              cursor: canSend ? 'pointer' : 'default', background: G.bg, border: 'none',
              boxShadow: 'inset 0 0 0 1px rgba(217,165,42,0.4)',
              opacity: canSend ? 1 : 0.45, padding: 0 }}>
            <GIcon name="up" size={16} color={G.gold} sw={1.9} />
          </button>
        </form>
      </div>
    </div>
  );
}
