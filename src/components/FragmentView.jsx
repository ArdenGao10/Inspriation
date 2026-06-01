// FragmentView.jsx — 单条灵感罐素材的「富展示」+ 删除入口（文本 / 链接 / 图片）。
// 灵感罐素材列表（AppMe）与灵感日历（CalendarModal）共用，保证两处样式与删除交互一致。
import React from 'react';
import { G } from '../theme.js';
import { GIcon } from './glow.jsx';

// 从链接里抽出域名做主标题，抽不出就原样显示
function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

// 一条素材卡片。onDelete 传入时右上角出现 🗑（点两下确认）。
export function FragmentRow({ frag, onDelete }) {
  const [confirming, setConfirming] = React.useState(false);
  const f = frag || {};
  const pad = onDelete ? (confirming ? 56 : 26) : 0;

  let body;
  if (f.kind === 'image' && f.url) {
    body = (
      <div>
        <img src={f.url} alt={f.text || '图片素材'}
          style={{ display: 'block', width: '100%', maxHeight: 168, objectFit: 'cover', borderRadius: 9, border: `1px solid ${G.hair2}` }} />
        {f.text && <div style={{ fontSize: 11.5, color: G.inkFaint, marginTop: 6, lineHeight: 1.5 }}>{f.text}</div>}
      </div>
    );
  } else if (f.kind === 'link' && f.url) {
    body = (
      <a href={f.url} target="_blank" rel="noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: G.ink }}>
        <span style={{ flex: '0 0 auto', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center',
          background: 'rgba(217,165,42,0.10)', border: `1px solid ${G.hair2}` }}>
          <GIcon name="link" size={15} color={G.gold} />
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontSize: 13, color: G.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {domainOf(f.url)}
          </span>
          <span style={{ display: 'block', fontSize: 11, color: G.gold, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.url}
          </span>
        </span>
      </a>
    );
  } else {
    body = <div style={{ fontSize: 13, color: G.ink, lineHeight: 1.5, wordBreak: 'break-word' }}>{f.text}</div>;
  }

  return (
    <div style={{ position: 'relative', padding: '9px 12px', background: G.bgWarm, border: `1px solid ${G.hair2}`, borderRadius: 10 }}>
      <div style={{ paddingRight: pad }}>{body}</div>
      {onDelete && (confirming ? (
        <span className="gpress" onClick={() => { onDelete(f.id); setConfirming(false); }}
          style={{ position: 'absolute', top: 8, right: 11, fontSize: 12, color: '#C0492B', fontWeight: 600, cursor: 'pointer' }}>
          删除?
        </span>
      ) : (
        <span className="gpress" onClick={() => setConfirming(true)}
          style={{ position: 'absolute', top: 7, right: 9, display: 'inline-flex', padding: 3, cursor: 'pointer' }}>
          <GIcon name="trash" size={14} color={G.inkFaint} />
        </span>
      ))}
    </div>
  );
}
