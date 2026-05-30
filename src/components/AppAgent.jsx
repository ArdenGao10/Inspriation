// AppAgent.jsx — Agent 对话页。
// 两种形态：
//   1) 默认（store.pendingIdea 为空且无历史消息）→ 渲染设计稿静态对话样本。
//   2) 首页「让 Agent 展开它」过来时（store.pendingIdea 非空）→ 自动发出一条用户消息
//      「帮我展开这个灵感：{title}」并调用智谱 API 展开，回复完成后 clearPendingIdea。
import React from 'react';
import { G } from '../theme.js';
import { GIcon, GlowField } from './glow.jsx';
import { Store, useStore, selectChat } from '../store.js';
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
    <div style={{ alignSelf: 'flex-end', maxWidth: '82%', padding: '11px 15px', borderRadius: '16px 4px 16px 16px',
      background: 'rgba(212,148,58,0.08)',
      fontSize: 14.5, lineHeight: 1.5, color: G.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {children}
    </div>
  );
}

function AgentBubble({ children, maxW = '80%' }) {
  return (
    <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: maxW }}>
      <div style={{ marginTop: 6 }}><GlowDot size={24} /></div>
      <div style={{ flex: 1, padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: '#FFFCF7',
        border: '1px solid #E8DFD0', fontSize: 14.5, lineHeight: 1.55, color: G.ink,
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

// 把 Agent 的 say 文字拆成「段落 / 列表」两类块（选项不在这里 —— 走结构化 options 字段）。
// - 行首匹配「* / - / • / ·」→ 收进列表
// - 其余非空行 → 拼成段落（空行分段）
function parseAgentBlocks(text) {
  const lines = String(text || '').split('\n');
  const blocks = [];
  let curList = null;
  let curPara = [];
  const flushPara = () => {
    if (curPara.length) {
      const t = curPara.join('\n').trim();
      if (t) blocks.push({ type: 'para', text: t });
      curPara = [];
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '').replace(/^\s*#{1,6}\s+/, ''); // 去掉模型偶发的 ## markdown 标题前缀
    const li = line.match(/^\s*[*\-•·]\s+(.+)$/);
    if (li) {
      flushPara();
      if (!curList) { curList = { type: 'list', items: [] }; blocks.push(curList); }
      curList.items.push(li[1]);
      continue;
    }
    if (!line.trim()) { flushPara(); curList = null; continue; }
    curList = null;
    curPara.push(line);
  }
  flushPara();
  return blocks;
}

// JSON 兜底：模型偶发吐纯文字带编号/列表（「1. xxx」「· xxx」）时，从里面抠出可点选项，
// 让交互不至于退化成纯文字。返回 { say, options } 或 null（抠不出选项就当纯文字）。
function salvageOptions(text) {
  const opts = [];
  const sayLines = [];
  for (const raw of String(text || '').split('\n')) {
    const m = raw.match(/^\s*(?:\d+[.、)]\s*|[·*\-•]\s+)(.+)$/);
    if (m) {
      const item = m[1].replace(/\*\*/g, '').trim();
      const c = item.match(/^(.{2,16}?)[：:]\s*(.+)$/);
      if (c) opts.push({ label: c[1].trim().slice(0, 12), desc: c[2].trim().slice(0, 24) });
      else opts.push({ label: item.slice(0, 12), desc: item.length > 12 ? item.slice(12, 36) : '' });
    } else if (!opts.length) {
      sayLines.push(raw);
    }
  }
  if (opts.length >= 2) return { say: sayLines.join('\n').trim() || '给你几个方向，挑一个：', options: opts.slice(0, 3) };
  return null;
}

// 可点击的方向卡片：左侧金色序号圈 · 中间描述 · 右侧箭头。
// 选中后该卡金色加粗描边，其余变灰；全组锁定不再可点（防重复发送）。
function DirectionCards({ items, picked, onPick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, margin: '6px 0 2px' }}>
      {items.map((c, j) => {
        const on = picked === c.label;
        const dim = picked && !on;
        return (
          <div key={j} className={`gdir-card${picked ? ' gdir-locked' : ''}`}
            onClick={() => { if (!picked) onPick && onPick(c); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              background: '#FFFCF7', borderRadius: 12, padding: '10px 14px',
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

// 共创式对话的 system prompt（工具版）。模型有 read_jar / save_idea 工具，回复用自然文字，
// 想给选项时在话里清楚列出方向，由前端 extractOptions 抽成可点卡片。
const SYS_PROMPT = `你是「灵感 Agent」，一个有经验的产品搭子，和用户一步步把一个 idea 聊成能落地的方案。

【风格】共创伙伴，不是方案生成器；每轮只推进一小步、简短；口语化中文，像朋友聊天，不要 markdown、不要加粗。

【你有的工具】
- read_jar：读用户灵感罐里的真实素材。开场、帮用户碰撞新点子、或想基于他的真实素材聊时，先调它看看再开口。
- save_idea：用户明确说想收藏 / 保存某个想法时，调它存进收藏。

【怎么给选项】想让用户在几个方向 / 方案里挑时，就在话里把它们清楚地一条条列出来（每条一行：简明标题 + 一句话）；只是解释或追问时正常说话就行。给不给选项你自己判断。

【节奏】开场或拿到 idea：先 read_jar 看素材，再给 2-3 个方向让用户挑。用户选了方向：说清核心玩法 + 目标用户是谁，再给下一步选项（拆解 MVP / 找类似产品 / 换个方向）。拆 MVP：列 3-5 步可执行的行动。`;

// 无灵感进来时的开场白（也用于「新对话」重置）。开场就带可点选项，直观体现「可选模式」。
const GREETING = '你今天有什么想聊的灵感吗？可以直接打字，也可以点下面的选项开始。';
const GREETING_OPTIONS = [
  { label: '帮我想个新点子', desc: '从灵感罐里碰一个出来' },
  { label: '我有个想法想聊聊', desc: '说给你听，一起展开' },
];
const greetingMsg = () => ({ role: 'agent', say: GREETING, options: GREETING_OPTIONS });

// 相对时间：刚刚 / x 分钟前 / x 小时前 / x 天前
function relativeTime(ts) {
  const d = Date.now() - (ts || 0);
  if (d < 60e3) return '刚刚';
  if (d < 3600e3) return Math.floor(d / 60e3) + ' 分钟前';
  if (d < 86400e3) return Math.floor(d / 3600e3) + ' 小时前';
  return Math.floor(d / 86400e3) + ' 天前';
}

// 历史对话抽屉：从左侧滑出，列出全部会话（按更新时间倒序），可切换 / 删除 / 新建。
function HistoryPanel({ conversations, activeId, onPick, onNew, onDelete, onClose }) {
  const list = React.useMemo(() => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt), [conversations]);
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex',
      background: 'rgba(46,42,32,0.28)', backdropFilter: 'blur(2px)', animation: 'gFade 0.18s ease-out' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(82%, 320px)', height: '100%', background: '#FFFDF7',
        boxShadow: '6px 0 28px rgba(120,90,30,0.18)', display: 'flex', flexDirection: 'column', animation: 'histIn 0.22s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px' }}>
          <span style={{ fontFamily: G.serif, fontSize: 17, color: G.ink }}>历史对话</span>
          <span onClick={onClose} className="gpress" style={{ fontSize: 22, color: G.inkFaint, cursor: 'pointer', lineHeight: 1 }}>×</span>
        </div>
        <div onClick={onNew} className="gpress" style={{ margin: '0 12px 6px', padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, border: `1px dashed ${G.hair}`, color: G.gold, fontSize: 13.5, fontWeight: 600 }}>
          <GIcon name="plus" size={15} color={G.gold} sw={2.2} />开始新对话
        </div>
        <div className="glow-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 12px 16px' }}>
          {list.map((c) => {
            const on = c.id === activeId;
            return (
              <div key={c.id} onClick={() => onPick(c.id)} className="gpress"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 11px', borderRadius: 12, cursor: 'pointer',
                  marginBottom: 4, background: on ? 'rgba(255,243,210,0.7)' : 'transparent',
                  border: `1px solid ${on ? 'rgba(217,165,42,0.35)' : 'transparent'}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: G.ink, fontWeight: on ? 600 : 500, whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title || '新对话'}</div>
                  <div style={{ fontSize: 11, color: G.inkFaint, marginTop: 2 }}>{relativeTime(c.updatedAt)}</div>
                </div>
                <span className="gpress" title="删除" onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                  style={{ flex: '0 0 auto', display: 'inline-flex', padding: 4, cursor: 'pointer', opacity: 0.6 }}>
                  <GIcon name="trash" size={15} color={G.inkFaint} sw={1.6} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AppAgent() {
  const pendingIdea = useStore((s) => s.pendingIdea);
  // 消息历史改存到全局 store 的「多会话」里（持久化）→ 切 Tab / 刷新页面都不丢
  const messages = useStore(selectChat);
  const conversations = useStore((s) => s.conversations);
  const activeConvId = useStore((s) => s.activeConvId);
  // 「正在等回复」的会话 id（按会话记，而非全局布尔）→ 切到别的会话不会误显示思考中
  const [loadingConvId, setLoadingConvId] = React.useState(null);
  const loading = loadingConvId === activeConvId; // 当前查看的会话是否在等回复
  const [draft, setDraft] = React.useState('');
  const [showHistory, setShowHistory] = React.useState(false);
  const scrollerRef = React.useRef(null);
  // 已处理过的 idea 引用 —— StrictMode 双触发兜底
  const handledIdeaRef = React.useRef(null);

  // 把某会话历史转成智谱 API 的 messages 数组（system + user/assistant 轮替）。
  // agent 消息回传纯文字（say），不回传 options 的 JSON —— 省 token、模型也更清楚。
  const buildApiHistory = (msgs) => [
    { role: 'system', content: SYS_PROMPT },
    ...msgs.map((m) => ({
      role: m.role === 'agent' ? 'assistant' : 'user',
      content: m.role === 'agent' ? (m.say ?? m.text ?? '') : m.text,
    })),
  ];

  // 发一条用户消息 → 追加用户气泡 → 跑 Agent → 追加 agent 气泡。
  // 关键：进函数就锁定本轮所属会话 convId，全程写回它；中途切/开新会话也不串台。
  const sendUser = async (text) => {
    const t = (text || '').trim();
    if (!t) return;
    const convId = Store.get().activeConvId;
    if (loadingConvId === convId) return; // 该会话已在等回复，不重复发
    if (!Agent.ensureKey()) return;
    const nextAfterUser = [...Store.getConvMessages(convId), { role: 'user', text: t }];
    Store.setConvMessages(convId, nextAfterUser);
    setLoadingConvId(convId);
    try {
      const reply = await Agent.runAgent(buildApiHistory(nextAfterUser), { model: Agent.CHAT_MODEL });
      let options = reply.options || [];
      if (!options.length) { const s = salvageOptions(reply.say); if (s) options = s.options; } // 本地正则兜底
      Store.setConvMessages(convId, [...Store.getConvMessages(convId), { role: 'agent', say: reply.say || '(没拿到回复)', options }]);
    } catch (err) {
      const msg = err && err.message === 'NO_KEY' ? '请先连接智谱 API Key' : (err && err.message) || '展开失败';
      Store.setConvMessages(convId, [...Store.getConvMessages(convId), { role: 'agent', say: '抱歉，出错了：' + msg }]);
    } finally {
      setLoadingConvId((cur) => (cur === convId ? null : cur));
    }
  };

  // 选项卡点击 → 给当前 agent 气泡打 picked 标记 + 自动发一条用户消息
  const handlePickDirection = (msgIndex, choice) => {
    const convId = Store.get().activeConvId;
    const updated = Store.getConvMessages(convId).map((mm, ii) => ii === msgIndex ? { ...mm, picked: choice.label } : mm);
    Store.setConvMessages(convId, updated);
    sendUser(choice.desc ? `我选「${choice.label}」：${choice.desc}` : `我选「${choice.label}」`);
  };

  const submitDraft = () => {
    const t = draft.trim();
    if (!t || loading) return;
    setDraft('');
    sendUser(t);
  };

  // 「新对话」→ 开一个全新会话（旧会话进历史，不被覆盖）。始终可点：
  // 即便某会话还在等回复，新会话也独立，回复会写回原会话不串台。
  const clearChat = () => {
    Store.newConversation([greetingMsg()]);
    setShowHistory(false);
    setDraft('');
  };
  // 历史里切换会话
  const pickConversation = (id) => {
    Store.switchConversation(id);
    setShowHistory(false);
  };
  const removeConversation = (id) => {
    Store.deleteConversation(id);
    // 删到一个不剩 → 立刻补一个带开场白的新会话，避免空态
    if (Store.get().conversations.length === 0) Store.newConversation([greetingMsg()]);
  };

  // 没有从首页带来灵感、且一个会话都没有时，开一个带开场白的会话；
  // activeConvId 失效（指向已删会话）时回落到最近一个，避免空白页。
  React.useEffect(() => {
    if (pendingIdea) return;
    const st = Store.get();
    if (st.conversations.length === 0) { Store.newConversation([greetingMsg()]); return; }
    if (!st.conversations.some((c) => c.id === st.activeConvId)) Store.switchConversation(st.conversations[0].id);
  }, [pendingIdea]);

  // 监听 store.pendingIdea：来自首页的灵感 → 每次都开一个全新会话再展开（不接在旧对话后面）
  React.useEffect(() => {
    if (!pendingIdea) return;
    if (handledIdeaRef.current === pendingIdea) return; // 同一个 idea 不会被处理两次
    if (!Agent.ensureKey()) return;
    handledIdeaRef.current = pendingIdea;
    const idea = pendingIdea;
    Store.clearPendingIdea();
    Store.newConversation();           // 全新空会话
    setShowHistory(false);
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
      {/* 头部：收成一条细行 —— 闪烁星星 + 标题 + 副标题同排居中，少占垂直空间 */}
      <div style={{ position: 'relative', overflow: 'hidden', zIndex: 2, padding: '11px 20px 9px' }}>
        <GlowField x="50%" y="20%" r={130} intensity={0.42} motes={5} spread={0.7} />
        {/* 左上角：历史对话 */}
        <span className="gpress" onClick={() => setShowHistory(true)} title="历史对话"
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 11px 5px 9px', borderRadius: 999,
            border: `1px solid ${G.hair}`, background: '#fff', boxShadow: '0 1px 4px rgba(120,90,30,0.05)',
            cursor: 'pointer', fontSize: 11.5, color: G.inkSoft }}>
          <GIcon name="history" size={13} color={G.gold} sw={1.8} />历史
        </span>
        <span className="gpress" onClick={clearChat} title="开始新对话"
          style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 11px 5px 9px', borderRadius: 999,
            border: `1px solid ${G.hair}`, background: '#fff', boxShadow: '0 1px 4px rgba(120,90,30,0.05)',
            cursor: 'pointer', fontSize: 11.5, color: G.inkSoft }}>
          <GIcon name="plus" size={12} color={G.gold} sw={2.2} />新对话
        </span>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
          <GlowDot size={22} />
          <span style={{ fontFamily: G.serif, fontSize: 16.5, color: G.ink, letterSpacing: 0.4 }}>灵感 Agent</span>
        </div>
      </div>
      <div ref={scrollerRef} className="glow-scroll" style={{ position: 'relative', zIndex: 2, flex: 1, minHeight: 0, overflowY: 'auto',
        padding: '2px 20px 10px', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
      <div style={{ position: 'relative', zIndex: 3, padding: '10px 20px 14px', background: G.bg }}>
        <form onSubmit={(e) => { e.preventDefault(); submitDraft(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, height: 46, borderRadius: 999, padding: '0 6px 0 18px',
          background: '#fff', border: `1px solid ${canSend ? 'rgba(217,165,42,0.5)' : G.hair}`,
          boxShadow: canSend ? '0 4px 16px rgba(217,165,42,0.13)' : '0 2px 10px rgba(120,90,30,0.05)',
          transition: 'border-color .2s ease, box-shadow .2s ease' }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} disabled={loading}
            placeholder={loading ? 'Agent 思考中…' : '继续聊聊你的想法…'}
            style={{ flex: 1, height: 44, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, color: G.ink, fontFamily: 'inherit' }} />
          <button type="submit" disabled={!canSend} className="gpress"
            style={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center',
              cursor: canSend ? 'pointer' : 'default', border: 'none', padding: 0,
              background: canSend ? G.gold : G.bgWarm,
              boxShadow: canSend ? '0 3px 10px rgba(217,165,42,0.4)' : 'inset 0 0 0 1px ' + G.hair,
              transition: 'background .2s ease, box-shadow .2s ease' }}>
            <GIcon name="up" size={17} color={canSend ? '#fff' : G.inkFaint} sw={2} />
          </button>
        </form>
      </div>
      {showHistory && (
        <HistoryPanel conversations={conversations} activeId={activeConvId}
          onPick={pickConversation} onNew={clearChat} onDelete={removeConversation}
          onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}
