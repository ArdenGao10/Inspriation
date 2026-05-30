// AppCommunity.jsx — 社区 feed（光晕风格）。读真实 store：点赞切换、发帖、接力跨页。
import React from 'react';
import { G } from '../theme.js';
import { GIcon, GAvatar, GlowField } from './glow.jsx';
import { Store, useStore } from '../store.js';

function fmtAgo(ts) {
  if (!ts) return '';
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return '刚刚';
  if (s < 3600) return Math.floor(s / 60) + '分钟前';
  if (s < 86400) return Math.floor(s / 3600) + '小时前';
  return Math.floor(s / 86400) + '天前';
}

// 发帖弹层：标题 + 类型（晒成品 / 接力灵感）
function ComposeModal({ onClose }) {
  const [title, setTitle] = React.useState('');
  const [kind, setKind] = React.useState('晒成品');
  const submit = () => {
    const t = title.trim();
    if (!t) return;
    Store.addPost({ title: t, kind });
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center',
      background: 'rgba(46,42,32,0.32)', backdropFilter: 'blur(3px)', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 360, background: '#FFFDF8',
        borderRadius: 18, border: `1px solid ${G.hair}`, padding: '20px 20px 18px', boxShadow: '0 18px 50px rgba(120,90,30,0.18)' }}>
        <div style={{ fontFamily: G.serif, fontSize: 18, color: G.ink, marginBottom: 14 }}>发条灵感</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['晒成品', '接力灵感'].map((k) => (
            <span key={k} className="gpress" onClick={() => setKind(k)} style={{ padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
              fontSize: 12.5, border: `1px solid ${kind === k ? G.gold : G.hair}`, color: kind === k ? G.gold : G.inkSoft,
              background: kind === k ? 'rgba(212,148,58,0.07)' : 'transparent', fontWeight: kind === k ? 600 : 400 }}>{k}</span>
          ))}
        </div>
        <textarea value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
          placeholder={kind === '接力灵感' ? '抛出一个想法，等人接力…' : '说说你做出来的东西…'}
          style={{ width: '100%', minHeight: 84, resize: 'none', padding: '11px 13px', borderRadius: 12, border: `1px solid ${G.hair2}`,
            background: G.bgWarm, fontSize: 14, color: G.ink, lineHeight: 1.5, outline: 'none', fontFamily: G.sans, boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 999, border: `1px solid ${G.hair}`, cursor: 'pointer',
            background: 'transparent', color: G.inkSoft, fontSize: 13, fontFamily: G.sans }}>取消</button>
          <button onClick={submit} disabled={!title.trim()} style={{ padding: '8px 18px', borderRadius: 999, border: 'none',
            cursor: title.trim() ? 'pointer' : 'default', background: G.gold, color: '#fff', fontSize: 13, fontFamily: G.sans,
            fontWeight: 500, opacity: title.trim() ? 1 : 0.45 }}>发布</button>
        </div>
      </div>
    </div>
  );
}

export function AppCommunity({ onRelay }) {
  const posts = useStore((s) => s.posts);
  const [tab, setTab] = React.useState(0);
  const [composing, setComposing] = React.useState(false);
  const tabs = ['推荐', '关注', '最新'];

  // 最新 = 按时间倒序；其余 tab 暂时都用默认顺序（store 已是新帖置顶）
  const list = React.useMemo(() => (
    tab === 2 ? [...posts].sort((a, b) => (b.ts || 0) - (a.ts || 0)) : posts
  ), [posts, tab]);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <GlowField x="86%" y="2%" r={230} intensity={0.5} motes={7} sun />
      <div style={{ position: 'relative', zIndex: 2, padding: '4px 22px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: G.serif, fontSize: 24, color: G.ink, letterSpacing: 0.3 }}>社区</div>
        <div style={{ display: 'flex', gap: 18, paddingBottom: 4 }}>
          {tabs.map((t, i) => (
            <span key={i} className="gpress" onClick={() => setTab(i)} style={{ fontSize: 13.5, cursor: 'pointer',
              color: tab === i ? G.ink : G.inkFaint, fontWeight: tab === i ? 600 : 400 }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 2, fontSize: 11.5, color: G.inkFaint, padding: '6px 22px 8px', letterSpacing: 0.4 }}>看看大家从罐子里摇出了什么</div>
      <div className="glow-scroll" style={{ position: 'relative', zIndex: 2, flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 22px 12px' }}>
        {list.map((p, i) => (
          <div key={p.id} style={{ padding: '18px 0', borderTop: i ? `1px solid ${G.hair2}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
              <GAvatar size={28} initial={p.name[0]} />
              <span style={{ fontSize: 13, fontWeight: 600, color: G.ink }}>{p.name}</span>
              <span style={{ fontSize: 11, color: G.gold, letterSpacing: 0.3 }}>· {p.kind}</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: G.inkFaint }}>{fmtAgo(p.ts)}</span>
            </div>
            <div style={{ fontFamily: G.serif, fontSize: 17, lineHeight: 1.45, color: G.ink, marginBottom: 13 }}>{p.title}</div>
            {p.media && (
              <div style={{ height: 140, borderRadius: 14, position: 'relative', overflow: 'hidden', marginBottom: 13,
                background: 'linear-gradient(150deg, #FCF3DC, #F6E6BC)' }}>
                <div style={{ position: 'absolute', left: '34%', top: '42%', width: 120, height: 120,
                  background: 'radial-gradient(circle, rgba(255,224,130,0.6), rgba(255,224,130,0) 70%)', filter: 'blur(10px)' }} />
                <div style={{ position: 'absolute', right: 12, bottom: 10, fontSize: 10.5, color: G.inkSoft, background: 'rgba(255,255,255,0.7)', padding: '3px 9px', borderRadius: 999, backdropFilter: 'blur(4px)' }}>产品 Demo</div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12.5, color: G.inkSoft }}>
              <span className="gpress" onClick={() => Store.toggleLike(p.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                color: p.liked ? G.gold : G.inkSoft, fontWeight: p.liked ? 600 : 400 }}>
                <GIcon name="heart" size={15} color={p.liked ? G.gold : G.inkSoft} /> {p.likes}
              </span>
              <span>评论 {p.comments}</span>
              <div style={{ flex: 1 }} />
              {p.kind === '接力灵感' && (
                <span className="gpress" onClick={() => onRelay && onRelay(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: G.gold, fontWeight: 600, cursor: 'pointer' }}>
                  接力 <GIcon name="arrow" size={14} color={G.gold} />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="gpress" onClick={() => setComposing(true)} title="发帖" style={{ position: 'absolute', right: 18, bottom: 18, zIndex: 3, width: 50, height: 50, borderRadius: '50%',
        display: 'grid', placeItems: 'center', cursor: 'pointer',
        background: G.gold, boxShadow: '0 6px 18px rgba(217,165,42,0.32)' }}>
        <GIcon name="plus" size={22} color="#fff" sw={2} />
      </div>
      {composing && <ComposeModal onClose={() => setComposing(false)} />}
    </div>
  );
}
