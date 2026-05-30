// AppCommunity.jsx — 社区 feed（光晕风格）。当前为本地静态种子数据。
import React from 'react';
import { G } from '../theme.js';
import { GIcon, GAvatar, GlowField } from './glow.jsx';

export function AppCommunity() {
  const [tab, setTab] = React.useState(0);
  const tabs = ['推荐', '关注', '最新'];
  const posts = [
    { name: '林深', kind: '晒成品', title: '上周从灵感罐摇出来的「代码截图美化器」，开源了', media: true, likes: 248, cm: 32, t: '2h' },
    { name: '阿木', kind: '接力灵感', title: '想给独居老人做一句话方言天气播报，谁来接力？', media: false, likes: 156, cm: 41, t: '5h' },
    { name: 'Yuki', kind: '晒成品', title: '宠物喂食打卡墙，室友们都在用，附上 Demo', media: true, likes: 320, cm: 18, t: '1d' },
  ];
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
        {posts.map((p, i) => (
          <div key={i} className="gpress" style={{ padding: '18px 0', borderTop: i ? `1px solid ${G.hair2}` : 'none', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
              <GAvatar size={28} initial={p.name[0]} />
              <span style={{ fontSize: 13, fontWeight: 600, color: G.ink }}>{p.name}</span>
              <span style={{ fontSize: 11, color: G.gold, letterSpacing: 0.3 }}>· {p.kind}</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: G.inkFaint }}>{p.t}</span>
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><GIcon name="heart" size={15} color={G.inkSoft} /> {p.likes}</span>
              <span>评论 {p.cm}</span>
              <div style={{ flex: 1 }} />
              {!p.media && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: G.gold, fontWeight: 600 }}>接力 <GIcon name="arrow" size={14} color={G.gold} /></span>}
            </div>
          </div>
        ))}
      </div>
      <div className="gpress" style={{ position: 'absolute', right: 18, bottom: 18, zIndex: 3, width: 50, height: 50, borderRadius: '50%',
        display: 'grid', placeItems: 'center', cursor: 'pointer',
        background: G.gold, boxShadow: '0 6px 18px rgba(217,165,42,0.32)' }}>
        <GIcon name="plus" size={22} color="#fff" sw={2} />
      </div>
    </div>
  );
}
