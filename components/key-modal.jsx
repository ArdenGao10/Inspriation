// key-modal.jsx — 智谱 API Key 弹窗 (P1)
// 由 Store.needKey 控制显隐；ensureKey() 缺 Key 时打开。Key 仅存本机浏览器。

const { G, Store, useStore } = window;

function KeyModal() {
  const needKey = useStore((s) => s.needKey);
  const apiKey = useStore((s) => s.apiKey);
  const [val, setVal] = React.useState('');
  React.useEffect(() => { if (needKey) setVal(apiKey || ''); }, [needKey]);
  if (!needKey) return null;
  const close = () => Store.set({ needKey: false });
  const submit = () => { const v = val.trim(); if (!v) return; Store.set({ apiKey: v, needKey: false }); };
  return (
    <div onClick={close} style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center',
      background: 'rgba(46,42,32,0.32)', backdropFilter: 'blur(3px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 300, background: '#FFFDF7', borderRadius: 20, padding: '22px 20px',
        boxShadow: '0 24px 60px rgba(120,90,30,0.28)', fontFamily: G.sans }}>
        <div style={{ fontFamily: G.serif, fontSize: 19, color: G.ink }}>连接智谱 BigModel</div>
        <div style={{ fontSize: 12, color: G.inkSoft, marginTop: 6, lineHeight: 1.6 }}>
          填入你的智谱 API Key，灵感合成与对话才能真正跑起来。Key 只存在你本机浏览器，不会上传。
        </div>
        <a href="https://open.bigmodel.cn/usercenter/apikeys" target="_blank" rel="noreferrer"
          style={{ display: 'inline-block', fontSize: 12, color: G.gold, marginTop: 8, textDecoration: 'none', borderBottom: `1px solid ${G.gold}`, paddingBottom: 1 }}>去 BigModel 申请 →</a>
        <input value={val} onChange={(e) => setVal(e.target.value)} type="password" placeholder="形如 xxxxxxxx.yyyyyyyy"
          onKeyDown={(e) => e.key === 'Enter' && submit()} autoFocus
          style={{ width: '100%', marginTop: 14, height: 42, borderRadius: 11, border: `1px solid ${G.hair}`, background: '#fff',
            padding: '0 13px', fontSize: 13.5, color: G.ink, outline: 'none', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button onClick={close} style={{ flex: '0 0 auto', padding: '0 16px', height: 40, borderRadius: 11, border: `1px solid ${G.hair}`,
            background: 'transparent', color: G.inkSoft, fontSize: 13.5, cursor: 'pointer', fontFamily: G.sans }}>稍后</button>
          <button onClick={submit} style={{ flex: 1, height: 40, borderRadius: 11, border: 'none', background: G.gold, color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: G.sans, boxShadow: '0 4px 14px rgba(217,165,42,0.32)' }}>保存并连接</button>
        </div>
      </div>
    </div>
  );
}
window.KeyModal = KeyModal;
