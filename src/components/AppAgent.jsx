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
    <div style={{ alignSelf: 'flex-end', maxWidth: '80%', padding: '11px 15px', borderRadius: '16px 16px 5px 16px',
      background: 'rgba(255,243,210,0.7)', border: '1px solid rgba(217,165,42,0.34)',
      fontSize: 14.5, lineHeight: 1.55, color: G.ink, boxShadow: '0 2px 8px rgba(200,150,40,0.07)', whiteSpace: 'pre-wrap' }}>
      {children}
    </div>
  );
}

function AgentBubble({ children, maxW = '84%' }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: maxW }}>
      <div style={{ marginTop: 2 }}><GlowDot size={24} /></div>
      <div style={{ flex: 1, padding: '12px 15px', borderRadius: '16px 16px 16px 5px', background: '#FFFFFF',
        border: `1px solid ${G.hair}`, fontSize: 14.5, lineHeight: 1.6, color: G.ink, boxShadow: '0 3px 12px rgba(120,90,30,0.06)',
        whiteSpace: 'pre-wrap' }}>
        {children}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: 6, background: G.gold,
          animation: `f2Twinkle 1.1s ease-in-out ${i * 0.18}s infinite` }} />
      ))}
    </span>
  );
}

// 设计稿里的静态对话样本：仅在 pendingIdea 为空且没有真实消息时展示。
function StaticDemo() {
  const [picked, setPicked] = React.useState(null);
  const options = [
    { t: '会议录音 → 待办清单', d: '录音结束自动生成任务' },
    { t: '碎片时间 · 灵感速记本', d: '随手记,AI 帮你归类' },
    { t: '把日历空隙变成专注块', d: '空闲自动排成深度工作' },
  ];
  return (
    <>
      <div style={{ alignSelf: 'center', fontSize: 11, color: G.inkFaint, padding: '3px 12px', borderRadius: 999, border: `1px solid ${G.hair2}` }}>今天 14:08</div>
      <UserBubble>我想做个帮自己管理时间的小工具,但没什么头绪</UserBubble>
      <AgentBubble>
        <div style={{ marginBottom: 12 }}>从你罐子里的素材,我揉出了三个方向 —— 选一个我帮你展开成可落地方案:</div>
        <div style={{ border: `1px solid ${G.hair}`, borderRadius: 13, overflow: 'hidden', background: G.bgWarm }}>
          <div style={{ padding: '8px 13px', fontSize: 11, color: G.gold, letterSpacing: 1, borderBottom: `1px solid ${G.hair2}`, fontWeight: 600 }}>请选择一个方向</div>
          {options.map((o, i) => {
            const on = picked === i;
            return (
              <div key={i} className="gpress" onClick={() => setPicked(i)} style={{ display: 'flex', alignItems: 'center', gap: 11,
                padding: '12px 13px', cursor: 'pointer', borderTop: i ? `1px solid ${G.hair2}` : 'none',
                background: on ? 'rgba(255,243,210,0.7)' : 'transparent' }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', flex: '0 0 18px', display: 'grid', placeItems: 'center',
                  border: `1.5px solid ${on ? G.gold : 'rgba(120,95,40,0.28)'}`, background: on ? G.gold : 'transparent' }}>
                  {on && <GIcon name="check" size={11} color="#fff" sw={2.4} />}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: G.ink }}>{o.t}</div>
                  <div style={{ fontSize: 11.5, color: G.inkFaint, marginTop: 2 }}>{o.d}</div>
                </div>
              </div>
            );
          })}
        </div>
        {picked != null && (
          <div className="gpress" style={{ marginTop: 11, display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: G.serif,
            fontSize: 14, color: G.ink, borderBottom: `1.5px solid ${G.gold}`, paddingBottom: 3, cursor: 'pointer' }}>
            展开「{options[picked].t.split(' ')[0]}」 <GIcon name="arrow" size={14} color={G.gold} />
          </div>
        )}
      </AgentBubble>
      <UserBubble>就第一个吧,帮我拆一下要做什么</UserBubble>
      <AgentBubble>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>会议录音 → 待办清单 · MVP 拆解</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {['录音上传 / 实时转写', '识别「谁·做什么·截止」', '一键写入日历 & 提醒'].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: G.inkSoft }}>
              <span style={{ fontFamily: G.serif, fontStyle: 'italic', color: G.gold, fontSize: 13, width: 14 }}>{i + 1}</span>{s}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {['给技术栈', '画原型', '收藏进罐'].map((t, i) => (
            <span key={i} className="gpress" style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${G.hair}`,
              fontSize: 11.5, color: G.inkSoft, background: '#fff', cursor: 'pointer' }}>{t}</span>
          ))}
        </div>
      </AgentBubble>
    </>
  );
}

const ideaTitle = (idea) => `${idea.lead ? idea.lead + ' ' : ''}${idea.accent || ''}`.trim() || '一个新灵感';

function buildExpandPrompt(idea) {
  return `用户通过灵感罐碰撞出了一个 idea:
标题:${ideaTitle(idea)}
描述:${idea.blurb || '(无补充描述)'}

请帮用户展开这个想法:
1. 用一句话确认你理解了核心价值
2. 给出 2-3 个可以深入的方向让用户选择
3. 等用户选择后再展开详细方案

用友好的中文回复。`;
}

export function AppAgent() {
  const pendingIdea = useStore((s) => s.pendingIdea);
  const [messages, setMessages] = React.useState([]); // { role: 'user'|'agent', text: string }
  const [loading, setLoading] = React.useState(false);
  const scrollerRef = React.useRef(null);

  // 监听 store.pendingIdea：来自首页的灵感 → 自动产生一轮对话。
  React.useEffect(() => {
    if (!pendingIdea) return;
    // 没 Key 就让 KeyModal 接管，灵感原地保留（用户填完再切回来会自动跑）
    if (!Agent.ensureKey()) return;
    // 同步抓取并清空，避免 StrictMode 双触发或后续重渲染重复发起
    const idea = pendingIdea;
    Store.clearPendingIdea();
    const userText = `帮我展开这个灵感:${ideaTitle(idea)}`;
    setMessages((m) => [...m, { role: 'user', text: userText }]);
    setLoading(true);
    Agent.complete(
      [{ role: 'user', content: buildExpandPrompt(idea) }],
      { temperature: 0.8, maxTokens: 900 },
    )
      .then((data) => {
        const text = (data.choices?.[0]?.message?.content || '').trim() || '(没拿到回复)';
        setMessages((m) => [...m, { role: 'agent', text }]);
      })
      .catch((err) => {
        const msg = err && err.message === 'NO_KEY' ? '请先连接智谱 API Key' : (err && err.message) || '展开失败';
        setMessages((m) => [...m, { role: 'agent', text: '抱歉,展开这个灵感时出错了:' + msg }]);
      })
      .finally(() => setLoading(false));
  }, [pendingIdea]);

  // 新消息进来时滚到底
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const hasConversation = messages.length > 0 || loading;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <GlowField x="50%" y="14%" r={260} intensity={0.5} motes={9} spread={1.1} />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '6px 22px 12px' }}>
        <div style={{ fontFamily: G.serif, fontSize: 18, color: G.ink, letterSpacing: 0.4 }}>灵感 Agent</div>
        <div style={{ fontSize: 11.5, color: G.inkFaint, marginTop: 3, letterSpacing: 0.4 }}>把一句话,聊成一个方案</div>
      </div>
      <div ref={scrollerRef} className="glow-scroll" style={{ position: 'relative', zIndex: 2, flex: 1, minHeight: 0, overflowY: 'auto',
        padding: '4px 20px 12px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {hasConversation ? (
          <>
            {messages.map((m, i) => (
              m.role === 'user'
                ? <UserBubble key={i}>{m.text}</UserBubble>
                : <AgentBubble key={i}>{m.text}</AgentBubble>
            ))}
            {loading && <AgentBubble><TypingDots /></AgentBubble>}
          </>
        ) : (
          <StaticDemo />
        )}
      </div>
      <div style={{ position: 'relative', zIndex: 3, padding: '8px 20px 14px',
        background: 'linear-gradient(to top, rgba(253,251,244,0.97) 60%, rgba(253,251,244,0))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, borderRadius: 999, padding: '0 8px 0 18px',
          background: '#fff', border: `1px solid ${G.hair}`, boxShadow: '0 3px 14px rgba(120,90,30,0.06)' }}>
          <span style={{ flex: 1, fontSize: 13.5, color: G.inkFaint }}>继续聊聊你的想法…</span>
          <div className="gpress" style={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', cursor: 'pointer',
            background: G.bg, boxShadow: `inset 0 0 0 1px rgba(217,165,42,0.4)` }}>
            <GIcon name="up" size={16} color={G.gold} sw={1.9} />
          </div>
        </div>
      </div>
    </div>
  );
}
