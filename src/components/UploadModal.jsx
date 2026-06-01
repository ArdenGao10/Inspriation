// UploadModal.jsx — 多模态素材上传弹窗：文本 / 链接（每行一条）+ 图片。
// 提交后逐条写入灵感罐（Store.addFragments）并带类型：链接自动识别成 link，
// 图片缩放后以 dataURL 存进 image 素材（localStorage 持久化，免依赖后端 Storage）。
import React from 'react';
import { G } from '../theme.js';
import { Store, useStore } from '../store.js';
import { GIcon } from './glow.jsx';

// 读图片 → 等比缩放到最长边 max → 转 JPEG dataURL，控制 localStorage 体积。
function fileToThumb(file, max = 900) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        try { resolve(canvas.toDataURL('image/jpeg', 0.72)); } catch { resolve(reader.result); }
      };
      img.onerror = () => resolve(reader.result);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function UploadModal() {
  const open = useStore((s) => s.showUpload);
  const count = useStore((s) => s.fragments.length);
  const [text, setText] = React.useState('');
  const [images, setImages] = React.useState([]); // [{ name, url(dataURL) }]
  const [justAdded, setJustAdded] = React.useState(0);
  React.useEffect(() => { if (open) { setText(''); setImages([]); setJustAdded(0); } }, [open]);
  if (!open) return null;

  const close = () => Store.set({ showUpload: false });
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
  const total = lines.length + images.length;

  const onPickImages = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const thumbs = await Promise.all(files.map(async (f) => ({ name: f.name, url: await fileToThumb(f) })));
    if (thumbs.length) setImages((prev) => [...prev, ...thumbs]);
  };
  const submit = () => {
    // 文本行交给 store 自动判别 text/link；图片显式记为 image 素材
    const items = [
      ...lines.map((t) => ({ text: t })),
      ...images.map((im) => ({ kind: 'image', url: im.url, text: `图片：${im.name}` })),
    ];
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {images.map((im, i) => (
              <span key={i} style={{ position: 'relative', width: 58, height: 58, borderRadius: 10, overflow: 'hidden',
                border: `1px solid ${G.hair2}` }}>
                <img src={im.url} alt={im.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span onClick={() => setImages(images.filter((_, j) => j !== i))}
                  style={{ position: 'absolute', top: 2, right: 2, width: 17, height: 17, borderRadius: '50%', cursor: 'pointer',
                    background: 'rgba(46,42,32,0.62)', color: '#fff', fontSize: 12, lineHeight: '17px', textAlign: 'center' }}>×</span>
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
