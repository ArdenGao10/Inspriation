// UploadModal.jsx — 多模态素材上传弹窗：文本 / 链接（每行一条）+ 图片。
// 提交后逐条写入灵感罐（Store.addFragments），「灵感罐」计数实时增加。
// 注：图片暂以「图片素材：文件名」记入；真正的图片存储待接 Supabase Storage。
import React from 'react';
import { G } from '../theme.js';
import { Store, useStore } from '../store.js';
import { GIcon } from './glow.jsx';

export function UploadModal() {
  const open = useStore((s) => s.showUpload);
  const count = useStore((s) => s.fragments.length);
  const [text, setText] = React.useState('');
  const [images, setImages] = React.useState([]); // 文件名列表
  const [justAdded, setJustAdded] = React.useState(0);
  React.useEffect(() => { if (open) { setText(''); setImages([]); setJustAdded(0); } }, [open]);
  if (!open) return null;

  const close = () => Store.set({ showUpload: false });
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
  const total = lines.length + images.length;

  const onPickImages = (e) => {
    const names = Array.from(e.target.files || []).map((f) => f.name);
    if (names.length) setImages((prev) => [...prev, ...names]);
    e.target.value = '';
  };
  const submit = () => {
    const items = [...lines, ...images.map((n) => `图片素材：${n}`)];
    const n = Store.addFragments(items);
    if (n > 0) { setJustAdded(n); setText(''); setImages([]); }
  };

  const field = { width: '100%', borderRadius: 12, border: `1px solid ${G.hair}`, background: '#fff', color: G.ink,
    fontSize: 14, fontFamily: G.sans, outline: 'none', boxSizing: 'border-box', padding: '12px 14px' };

  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center',
      background: 'rgba(46,42,32,0.34)', backdropFilter: 'blur(3px)', padding: 32 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#FFFDF7', borderRadius: 22,
        padding: '24px 22px', boxShadow: '0 28px 70px rgba(120,90,30,0.3)', fontFamily: G.sans }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: G.serif, fontSize: 21, color: G.ink }}>添加素材进灵感罐</div>
          <span onClick={close} className="gpress" style={{ fontSize: 22, color: G.inkFaint, cursor: 'pointer', lineHeight: 1 }}>×</span>
        </div>
        <div style={{ fontSize: 12.5, color: G.inkSoft, marginTop: 6, lineHeight: 1.6 }}>
          文本、链接，<b>每行一条</b>；也可以附图片。攒得越多，摇出来的灵感越意想不到。
        </div>

        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} autoFocus
          placeholder={'例如：刷到一个很妙的本地咖啡地图'}
          style={{ ...field, marginTop: 14, resize: 'vertical', lineHeight: 1.6 }} />

        {/* 图片附件 */}
        <label className="gpress" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 12, padding: '8px 14px',
          borderRadius: 999, border: `1px solid ${G.hair}`, background: '#fff', cursor: 'pointer', fontSize: 13, color: G.inkSoft }}>
          <GIcon name="plus" size={15} color={G.gold} sw={2} /> 添加图片
          <input type="file" accept="image/*" multiple onChange={onPickImages} style={{ display: 'none' }} />
        </label>
        {images.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
            {images.map((n, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999,
                background: G.bgWarm, border: `1px solid ${G.hair2}`, fontSize: 11.5, color: G.inkSoft, maxWidth: 180 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🖼 {n}</span>
                <span onClick={() => setImages(images.filter((_, j) => j !== i))} style={{ cursor: 'pointer', color: G.inkFaint }}>×</span>
              </span>
            ))}
          </div>
        )}

        {justAdded > 0 && (
          <div style={{ marginTop: 14, fontSize: 12.5, color: G.gold, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <GIcon name="check" size={13} color={G.gold} sw={2.2} /> 已加入 {justAdded} 条 · 灵感罐现有 {count} 份素材
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={close} style={{ flex: '0 0 auto', padding: '0 18px', height: 42, borderRadius: 12, border: `1px solid ${G.hair}`,
            background: 'transparent', color: G.inkSoft, fontSize: 14, cursor: 'pointer', fontFamily: G.sans }}>完成</button>
          <button onClick={submit} disabled={total === 0} style={{ flex: 1, height: 42, borderRadius: 12, border: 'none',
            background: total ? G.gold : G.hair, color: '#fff', fontSize: 14.5, fontWeight: 600, cursor: total ? 'pointer' : 'default',
            fontFamily: G.sans, boxShadow: total ? '0 4px 14px rgba(217,165,42,0.32)' : 'none' }}>
            加入灵感罐{total ? ` · ${total} 条` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
