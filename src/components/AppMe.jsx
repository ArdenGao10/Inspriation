// AppMe.jsx — 个人主页「我的」（光晕风格）。收藏数 / 灵感罐素材数读真实 store。
// 菜单项点击行为：
//   - 收藏的灵感 / 我的灵感罐 / 通用设置 → 行内展开
//   - 我发起的项目 / 灵感口味偏好 → toast 占位
import React from 'react';
import { G } from '../theme.js';
import { GIcon, GAvatar, GlowField } from './glow.jsx';
import { Store, useStore } from '../store.js';

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const pad = (n) => String(n).padStart(2, '0');
  if (sameDay) return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function SavedList({ items }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ padding: '14px 4px 18px', fontSize: 12.5, color: G.inkFaint, textAlign: 'center', lineHeight: 1.7 }}>
        还没有收藏的灵感，去首页摇一摇吧 ✨
      </div>
    );
  }
  return (
    <div style={{ padding: '4px 0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((it) => (
        <div key={it.id} style={{ padding: '12px 14px', background: G.bgWarm, border: `1px solid ${G.hair2}`, borderRadius: 12 }}>
          <div style={{ fontFamily: G.serif, fontSize: 15, color: G.ink, lineHeight: 1.45 }}>
            {it.lead ? <>{it.lead} </> : null}
            <span style={{ fontStyle: 'italic', color: G.gold }}>{it.accent || ''}</span>
          </div>
          {it.blurb && (
            <div style={{ fontSize: 12.5, color: G.inkSoft, marginTop: 6, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {it.blurb}
            </div>
          )}
          <div style={{ fontSize: 11, color: G.inkFaint, marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>{fmtTime(it.ts)}</span>
            {(it.sources && it.sources.length) ? <span>由 {it.sources.slice(0, 2).join(' · ')}{it.sources.length > 2 ? '…' : ''} 合成</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function FragmentsList({ items }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ padding: '14px 4px 18px', fontSize: 12.5, color: G.inkFaint, textAlign: 'center', lineHeight: 1.7 }}>
        罐子还是空的，去添加点素材吧 ✨
      </div>
    );
  }
  return (
    <div style={{ padding: '4px 0 14px', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }} className="glow-scroll">
      {items.slice().reverse().map((f) => (
        <div key={f.id} style={{ padding: '9px 12px', background: G.bgWarm, border: `1px solid ${G.hair2}`, borderRadius: 10, fontSize: 13, color: G.ink, lineHeight: 1.5, wordBreak: 'break-word' }}>
          {f.text}
        </div>
      ))}
    </div>
  );
}

function SettingsPanel({ apiKey, onSave, onToast }) {
  const [val, setVal] = React.useState(apiKey || '');
  React.useEffect(() => { setVal(apiKey || ''); }, [apiKey]);
  const save = () => {
    const v = (val || '').trim();
    onSave(v);
    onToast(v ? 'API Key 已保存 ✨' : 'API Key 已清空');
  };
  return (
    <div style={{ padding: '6px 4px 16px' }}>
      <div style={{ fontSize: 12, color: G.inkSoft, marginBottom: 8, letterSpacing: 0.3 }}>智谱 API Key</div>
      <input
        type="password"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="形如 xxx.yyy（留空则使用 .env 里的 VITE_ZHIPU_KEY）"
        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${G.hair2}`,
          background: G.bgWarm, fontSize: 13, color: G.ink, outline: 'none', fontFamily: G.sans }}
      />
      <div style={{ fontSize: 11, color: G.inkFaint, marginTop: 6, lineHeight: 1.6 }}>
        Key 只保存在浏览器本地 localStorage，不会上传任何地方。
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button onClick={save} style={{ padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
          background: G.gold, color: '#fff', fontSize: 13, fontFamily: G.sans, fontWeight: 500 }}>
          保存
        </button>
      </div>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: G.ink, color: '#fff', padding: '9px 18px', borderRadius: 999,
      fontSize: 12.5, letterSpacing: 0.3, zIndex: 50, pointerEvents: 'none',
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)', maxWidth: '78%', whiteSpace: 'nowrap',
      overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      {msg}
    </div>
  );
}

export function AppMe() {
  const savedCount = useStore((s) => s.saved.length);
  const fragCount = useStore((s) => s.fragments.length);
  const saved = useStore((s) => s.saved);
  const fragments = useStore((s) => s.fragments);
  const apiKey = useStore((s) => s.apiKey);

  const [openSaved, setOpenSaved] = React.useState(false);
  const [openFragments, setOpenFragments] = React.useState(false);
  const [openSettings, setOpenSettings] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const toastTimer = React.useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400);
  };
  React.useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const stats = [{ n: String(savedCount), l: '收藏' }, { n: '6', l: '项目' }, { n: '23', l: '连续' }];

  const rows = [
    {
      k: 'saved',
      t: '收藏的灵感',
      n: String(savedCount),
      open: openSaved,
      onClick: () => setOpenSaved((v) => !v),
      expand: openSaved && <SavedList items={saved} />,
    },
    {
      k: 'projects',
      t: '我发起 / 做过的项目',
      n: '6',
      onClick: () => showToast('功能开发中，敬请期待 ✨'),
    },
    {
      k: 'taste',
      t: '灵感口味偏好',
      n: '',
      onClick: () => showToast('功能开发中，敬请期待 ✨'),
    },
    {
      k: 'settings',
      t: '通用设置',
      n: '',
      open: openSettings,
      onClick: () => setOpenSettings((v) => !v),
      expand: openSettings && <SettingsPanel apiKey={apiKey} onSave={(v) => Store.set({ apiKey: v })} onToast={showToast} />,
    },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <GlowField x="50%" y="16%" r={320} intensity={0.7} motes={13} />
      <div className="glow-scroll" style={{ position: 'relative', zIndex: 2, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 22px 0' }}>
          <GAvatar size={78} ring glow initial="向" />
          <div style={{ fontFamily: G.serif, fontSize: 22, color: G.ink, marginTop: 16 }}>向野</div>
          <div style={{ fontSize: 12.5, color: G.inkSoft, marginTop: 5, letterSpacing: 0.3 }}>builder · 灵感 Lv.4</div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 22 }}>
            {stats.map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={{ width: 1, height: 26, background: G.hair, margin: '0 22px' }} />}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: G.serif, fontSize: 21, color: i === 2 ? G.gold : G.ink }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: G.inkFaint, marginTop: 3, letterSpacing: 0.5 }}>{s.l}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 我的灵感罐 卡片：点击展开素材列表 */}
        <div style={{ margin: '26px 22px 0', borderTop: `1px solid ${G.hair2}`, borderBottom: openFragments ? 'none' : `1px solid ${G.hair2}` }}>
          <div className="gpress" onClick={() => setOpenFragments((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', cursor: 'pointer' }}>
            <div style={{ width: 38, height: 46, borderRadius: '8px 8px 14px 14px', position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(158deg, rgba(255,255,252,0.7), rgba(255,238,180,0.5))', border: '1px solid rgba(190,150,70,0.25)',
              boxShadow: 'inset 0 -8px 14px rgba(255,222,132,0.5)' }}>
              <div style={{ position: 'absolute', left: '50%', top: '60%', width: 18, height: 18, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,240,180,0.9), transparent 70%)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: G.ink }}>我的灵感罐</div>
              <div style={{ fontSize: 11.5, color: G.inkFaint, marginTop: 2 }}>{fragCount} 份素材 · 静静发酵</div>
            </div>
            <span style={{ display: 'inline-flex', transform: openFragments ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>
              <GIcon name="arrow" size={16} color={G.inkFaint} />
            </span>
          </div>
          {openFragments && (
            <div style={{ padding: '0 0 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 8px' }}>
                <span style={{ fontSize: 11.5, color: G.inkSoft }}>全部素材</span>
                <span className="gpress" onClick={(e) => { e.stopPropagation(); Store.set({ showUpload: true }); }}
                  style={{ fontSize: 11.5, color: G.gold, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <GIcon name="plus" size={12} color={G.gold} sw={2} />添加
                </span>
              </div>
              <FragmentsList items={fragments} />
            </div>
          )}
        </div>

        <div style={{ margin: '18px 22px 6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: G.inkSoft, marginBottom: 9 }}>
            <span>灵感能量</span><span style={{ color: G.gold }}>再 3 个灵感升 Lv.5</span>
          </div>
          <div style={{ height: 5, borderRadius: 999, background: G.hair, overflow: 'hidden' }}>
            <div style={{ width: '64%', height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${G.goldSoft}, ${G.gold})`, boxShadow: '0 0 10px rgba(217,165,42,0.5)' }} />
          </div>
        </div>

        <div style={{ padding: '14px 22px 22px' }}>
          {rows.map((r) => (
            <div key={r.k}>
              <div className="gpress" onClick={r.onClick} style={{ display: 'flex', alignItems: 'center', padding: '16px 2px', borderTop: `1px solid ${G.hair2}`, cursor: 'pointer' }}>
                <span style={{ fontSize: 14.5, color: G.ink, flex: 1 }}>{r.t}</span>
                {r.n && <span style={{ fontSize: 13, color: G.gold, marginRight: 10, fontFamily: G.serif }}>{r.n}</span>}
                <span style={{ display: 'inline-flex', transform: r.open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>
                  <GIcon name="arrow" size={15} color={G.inkFaint} />
                </span>
              </div>
              {r.expand}
            </div>
          ))}
        </div>
      </div>
      <Toast msg={toastMsg} />
    </div>
  );
}
