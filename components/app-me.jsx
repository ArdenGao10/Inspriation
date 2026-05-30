// app-me.jsx — profile / "我的" in the glow style
const { G, GIcon, GAvatar, GlowField } = window;

function AppMe() {
  const rows = [
    { t: '收藏的灵感', n: '128' },
    { t: '我发起 / 做过的项目', n: '6' },
    { t: '灵感口味偏好', n: '' },
    { t: '通用设置', n: '' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <GlowField x="50%" y="16%" r={320} intensity={0.7} motes={13} />
      <div className="glow-scroll" style={{ position: 'relative', zIndex: 2, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* profile */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 22px 0' }}>
          <GAvatar size={78} ring glow initial="向" />
          <div style={{ fontFamily: G.serif, fontSize: 22, color: G.ink, marginTop: 16 }}>向野</div>
          <div style={{ fontSize: 12.5, color: G.inkSoft, marginTop: 5, letterSpacing: 0.3 }}>vibe coder · 灵感 Lv.4</div>
          {/* inline stats */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 22 }}>
            {[{ n: '128', l: '收藏' }, { n: '6', l: '项目' }, { n: '23', l: '连续' }].map((s, i) => (
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

        {/* my jar summary — a quiet card-less row with a mini jar glow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '26px 22px 0', padding: '14px 0', borderTop: `1px solid ${G.hair2}`, borderBottom: `1px solid ${G.hair2}` }}>
          <div style={{ width: 38, height: 46, borderRadius: '8px 8px 14px 14px', position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(158deg, rgba(255,255,252,0.7), rgba(255,238,180,0.5))', border: '1px solid rgba(190,150,70,0.25)',
            boxShadow: 'inset 0 -8px 14px rgba(255,222,132,0.5)' }}>
            <div style={{ position: 'absolute', left: '50%', top: '60%', width: 18, height: 18, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,240,180,0.9), transparent 70%)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: G.ink }}>我的灵感罐</div>
            <div style={{ fontSize: 11.5, color: G.inkFaint, marginTop: 2 }}>25 份素材 · 今天合成 1 个</div>
          </div>
          <GIcon name="arrow" size={16} color={G.inkFaint} />
        </div>

        {/* energy */}
        <div style={{ margin: '18px 22px 6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: G.inkSoft, marginBottom: 9 }}>
            <span>灵感能量</span><span style={{ color: G.gold }}>再 3 个灵感升 Lv.5</span>
          </div>
          <div style={{ height: 5, borderRadius: 999, background: G.hair, overflow: 'hidden' }}>
            <div style={{ width: '64%', height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${G.goldSoft}, ${G.gold})`, boxShadow: '0 0 10px rgba(217,165,42,0.5)' }} />
          </div>
        </div>

        {/* list */}
        <div style={{ padding: '14px 22px 22px' }}>
          {rows.map((r, i) => (
            <div key={i} className="gpress" style={{ display: 'flex', alignItems: 'center', padding: '16px 2px', borderTop: `1px solid ${G.hair2}`, cursor: 'pointer' }}>
              <span style={{ fontSize: 14.5, color: G.ink, flex: 1 }}>{r.t}</span>
              {r.n && <span style={{ fontSize: 13, color: G.gold, marginRight: 10, fontFamily: G.serif }}>{r.n}</span>}
              <GIcon name="arrow" size={15} color={G.inkFaint} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AppMe });
