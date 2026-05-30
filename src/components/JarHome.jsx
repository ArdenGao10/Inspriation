// JarHome.jsx — 首页灵感罐：玻璃罐 + 摇一摇 → AI 合成动画 → 揭晓新灵感。
// 摇一摇时后台调用 agent.synthesize() 跑真实合成，结果填入结果页。
import React from 'react';
import { G } from '../theme.js';
import { GIcon, Eyebrow } from './glow.jsx';
import { Store, useStore } from '../store.js';
import { Agent } from '../lib/agent.js';

const serif = (s, st = {}) => <span style={{ fontFamily: G.serif, color: G.ink, ...st }}>{s}</span>;

// motes inside the jar
function F2Motes({ n = 12, energized = false }) {
  const pts = React.useMemo(() => Array.from({ length: n }).map(() => ({
    x: 20 + Math.random() * 60, y: 32 + Math.random() * 52, size: 2.5 + Math.random() * 3.5,
    blur: Math.random() * 0.7, dur: 6 + Math.random() * 5, delay: -Math.random() * 9, rise: Math.random() < 0.5,
  })), [n]);
  return pts.map((p, i) => (
    <span key={i} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size, borderRadius: '50%',
      filter: p.blur ? `blur(${p.blur}px)` : 'none', background: 'radial-gradient(circle, rgba(255,243,196,1), rgba(255,216,104,0.5) 60%, rgba(255,216,104,0) 80%)',
      boxShadow: '0 0 6px 1px rgba(255,210,90,0.55)',
      animation: `${p.rise ? 'f2Mote' : 'f2Twinkle'} ${(energized ? p.dur * 0.4 : p.dur)}s ${p.rise ? 'linear' : 'ease-in-out'} ${p.delay}s infinite` }} />
  ));
}

// ── GLASS JAR ──
export function ChubbyJar({ shaking = false, fading = false }) {
  const W = 224, H = 348;
  return (
    <div style={{ position: 'relative', width: W, height: H, opacity: fading ? 0 : 1, transition: 'opacity .4s ease',
      animation: shaking ? 'f2Shake 0.8s ease-in-out' : 'none', transformOrigin: '50% 82%' }}>
      <div style={{ position: 'absolute', left: '50%', top: '60%', width: 210, height: 210, transform: 'translate(-50%,-50%)',
        background: 'radial-gradient(circle, rgba(255,224,134,0.5), rgba(255,224,134,0) 68%)', filter: 'blur(15px)' }} />
      {/* knob */}
      <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 42, height: 17, zIndex: 6,
        borderRadius: '11px 11px 7px 7px',
        background: 'radial-gradient(130% 130% at 38% 26%, #FFFAEE, #F3E2B4 72%, #E6CD92)',
        boxShadow: 'inset 0 2px 2.5px rgba(255,255,255,0.85), inset 0 -2px 4px rgba(200,160,80,0.28), 0 2px 4px rgba(170,130,50,0.22)' }} />
      {/* stopper dome */}
      <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', width: 104, height: 34, zIndex: 5,
        borderRadius: '17px 17px 8px 8px', overflow: 'hidden',
        background: 'radial-gradient(130% 150% at 36% 22%, rgba(255,251,236,0.95), rgba(247,229,186,0.9) 56%, rgba(232,207,150,0.9))',
        boxShadow: 'inset 9px 7px 14px rgba(255,255,255,0.6), inset -11px -8px 16px rgba(205,165,80,0.32), 0 4px 9px rgba(175,135,55,0.22)' }}>
        <div style={{ position: 'absolute', top: 6, left: 18, width: 12, height: 18, borderRadius: 10, background: 'linear-gradient(180deg, rgba(255,255,255,0.85), transparent)', filter: 'blur(0.6px)' }} />
      </div>
      {/* mouth rim */}
      <div style={{ position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)', width: 138, height: 17, zIndex: 4,
        borderRadius: '8px 8px 6px 6px',
        background: 'linear-gradient(180deg, rgba(255,252,242,0.95), rgba(238,214,158,0.86))',
        boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.82), inset 0 -3px 6px rgba(205,165,80,0.28), 0 3px 7px rgba(175,135,55,0.2)' }} />
      {/* body */}
      <div style={{ position: 'absolute', top: 62, left: '50%', transform: 'translateX(-50%)', width: W, height: H - 70, zIndex: 3,
        borderRadius: '34px 34px 56px 56px', overflow: 'hidden', backdropFilter: 'blur(1px)',
        background: 'radial-gradient(125% 105% at 36% 22%, rgba(255,255,255,0.7), rgba(255,251,238,0.42) 32%, rgba(255,235,176,0.32) 64%, rgba(248,222,150,0.44) 100%)',
        boxShadow: [
          'inset 20px 18px 34px rgba(255,255,255,0.55)',
          'inset -24px -20px 44px rgba(210,165,70,0.30)',
          'inset 0 -16px 38px rgba(255,222,132,0.42)',
          '0 24px 50px rgba(195,150,55,0.20)',
          '0 0 0 1px rgba(190,150,70,0.16)',
        ].join(', ') }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '46%',
          background: 'radial-gradient(118% 84% at 50% 124%, rgba(255,224,134,0.68), rgba(255,234,168,0.15) 56%, transparent 74%)' }} />
        <F2Motes n={13} energized={shaking} />
        <div style={{ position: 'absolute', top: 22, left: 26, width: 60, height: 150, borderRadius: '50%', transform: 'rotate(16deg)',
          background: 'radial-gradient(closest-side, rgba(255,255,255,0.68), rgba(255,255,255,0) 72%)', filter: 'blur(5px)' }} />
        <div style={{ position: 'absolute', top: 36, right: 18, width: 14, height: 170, borderRadius: '50%', transform: 'rotate(-6deg)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.46), rgba(255,255,255,0) 82%)', filter: 'blur(3px)' }} />
        <div style={{ position: 'absolute', bottom: 24, left: 24, width: 48, height: 38, borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(255,240,190,0.48), transparent 72%)', filter: 'blur(5px)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 164, height: 22, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,218,116,0.32), transparent 70%)', filter: 'blur(7px)' }} />
    </div>
  );
}

// ── PAGE · idle ──
function PageIdle({ onShake, shaking, fading }) {
  const count = useStore((s) => s.fragments.length);
  return (
    <>
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 22px 0' }}>
        {serif('灵感罐', { fontSize: 17, letterSpacing: 0.5 })}
        <span className="gpress" onClick={() => Store.set({ showUpload: true })} title="添加素材" style={{ display: 'inline-flex', cursor: 'pointer' }}>
          <GIcon name="plus" size={21} color={G.gold} sw={1.9} />
        </span>
      </div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ height: 36 }} />
        <Eyebrow center>{count} 份素材 · 静静发酵</Eyebrow>
        <div className="gpress" onClick={onShake} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ChubbyJar shaking={shaking} fading={fading} />
        </div>
        <div className="gpress" onClick={onShake} style={{ paddingBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: fading ? 0 : 1, transition: 'opacity .4s ease' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, animation: 'f2Breathe 2.6s ease-in-out infinite' }}>
            {serif('摇一摇，合成新灵感', { fontSize: 21, letterSpacing: 0.5 })}
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: G.gold, boxShadow: '0 0 10px 2px rgba(217,165,42,0.6)', animation: 'f2Dot 2.6s ease-in-out infinite' }} />
          </span>
          <svg width="178" height="9" viewBox="0 0 178 9" fill="none" style={{ marginTop: 7 }}><path d="M2 5.5C46 1.5 132 1.5 176 4.5" stroke={G.gold} strokeWidth="1.7" strokeLinecap="round" /></svg>
          <span style={{ fontSize: 11.5, color: G.inkFaint, letterSpacing: 1.6, marginTop: 12 }}>轻点 · 或摇一摇手机</span>
        </div>
      </div>
    </>
  );
}

// ── SYNTH SEQUENCE ── (pending=true 表示后台 API 还没返回；动画跑完会等结果就绪再揭晓)
function SynthSequence({ onDone, pending }) {
  const steps = React.useMemo(() => [
    { phase: 'gather', caption: '收集素材中' },
    { phase: 'think', caption: '寻找隐藏的关联点' },
    { phase: 'condense', caption: '正在合成新灵感' },
  ], []);
  const [step, setStep] = React.useState(0);
  const [capVisible, setCapVisible] = React.useState(true);
  const [timelineDone, setTimelineDone] = React.useState(false);
  React.useEffect(() => {
    const t = [];
    t.push(setTimeout(() => setTimelineDone(true), 3250));
    // 文案和光晕阶段同频轮播：淡出 → 切换 step → 淡入，合成结束时随组件卸载停止
    const fadeMs = 260;
    const interval = setInterval(() => {
      setCapVisible(false);
      const swap = setTimeout(() => {
        setStep((s) => (s + 1) % steps.length);
        setCapVisible(true);
      }, fadeMs);
      t.push(swap);
    }, 2000);
    return () => { t.forEach(clearTimeout); clearInterval(interval); };
  }, [steps.length]);
  React.useEffect(() => { if (timelineDone && !pending) onDone(); }, [timelineDone, pending]);

  const ringR = 86;
  const parts = React.useMemo(() => Array.from({ length: 20 }).map((_, i) => {
    const ang = (i / 20) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
    const r = ringR * (0.78 + Math.random() * 0.3);
    return {
      rx: Math.cos(ang) * r, ry: Math.sin(ang) * r * 0.92,
      sx: (Math.random() * 2 - 1) * 150, sy: (Math.random() * 2 - 1) * 240,
      size: 3 + Math.random() * 4, delay: Math.random() * 0.25, blur: Math.random() < 0.4,
    };
  }), []);

  const { phase, caption } = steps[step];
  const gathered = phase !== 'gather';
  const condensing = phase === 'condense';

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: '#FEFDF8', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: '50%', top: '44%', width: 320, height: 320, transform: 'translate(-50%,-50%)',
        background: 'radial-gradient(circle, rgba(255,228,140,0.42), rgba(255,228,140,0) 66%)', filter: 'blur(20px)', animation: 'f2Halo 4s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', left: '50%', top: '44%', width: 0, height: 0 }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 200, height: 184, transform: 'translate(-50%,-50%)', borderRadius: '50%',
          border: '1px dashed rgba(217,165,42,0.28)', opacity: phase === 'think' ? 1 : 0.001, transition: 'opacity .5s', animation: 'f2Spin 7s linear infinite' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 134, height: 124, transform: 'translate(-50%,-50%)', borderRadius: '50%',
          border: '1px dashed rgba(217,165,42,0.22)', opacity: phase === 'think' ? 1 : 0.001, transition: 'opacity .5s', animation: 'f2SpinR 5s linear infinite' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, animation: phase === 'gather' ? 'none' : 'f2Spin 4.5s linear infinite' }}>
          {parts.map((p, i) => {
            const tx = condensing ? 0 : (gathered ? p.rx : p.sx);
            const ty = condensing ? 0 : (gathered ? p.ry : p.sy);
            const sc = condensing ? 0.3 : (gathered ? 1 : 0.4);
            const op = condensing ? 0 : (gathered ? 1 : 0);
            return (
              <span key={i} style={{ position: 'absolute', left: 0, top: 0, width: p.size, height: p.size, borderRadius: '50%',
                transform: `translate(${tx}px, ${ty}px) scale(${sc})`, opacity: op,
                transition: `transform ${condensing ? '0.7s cubic-bezier(.6,0,.3,1)' : '0.9s cubic-bezier(.4,0,.2,1)'} ${p.delay}s, opacity .5s ${p.delay}s`,
                filter: p.blur ? 'blur(1px)' : 'none',
                background: 'radial-gradient(circle, rgba(255,244,198,1), rgba(255,214,100,0.5) 60%, rgba(255,214,100,0) 80%)',
                boxShadow: '0 0 8px 2px rgba(255,206,90,0.6)' }} />
            );
          })}
        </div>
        {[
          { s: 132, c: 'rgba(255,236,170,0.5)', a: 'f2Halo 4.5s' },
          { s: 86, c: 'rgba(255,224,130,0.62)', a: 'f2Bloom2 5s' },
          { s: 50, c: 'rgba(255,238,180,0.8)', a: 'f2Halo 3.6s' },
        ].map((g, i) => (
          <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: condensing ? g.s * 1.4 : g.s, height: condensing ? g.s * 1.4 : g.s,
            transform: 'translate(-50%,-50%)', borderRadius: '50%', transition: 'width .6s, height .6s',
            background: `radial-gradient(circle, ${g.c}, transparent 68%)`, filter: 'blur(9px)', animation: `${g.a} ease-in-out infinite` }} />
        ))}
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 24, height: 24, borderRadius: '50%', transform: 'translate(-50%,-50%)',
          background: 'radial-gradient(circle, rgba(255,250,225,0.95), rgba(255,228,150,0.32) 64%, transparent 80%)', filter: 'blur(3px)', animation: 'f2Bloom2 3.6s ease-in-out infinite' }} />
        {(phase === 'think' || condensing) && [0, 1, 2].map((i) => (
          <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: 70, height: 64, borderRadius: '50%', transform: 'translate(-50%,-50%)',
            background: 'radial-gradient(closest-side, transparent 56%, rgba(255,222,130,0.5) 78%, transparent 92%)',
            filter: 'blur(3px)', animation: `f2RingSoft 3s ease-out ${i * 1}s infinite` }} />
        ))}
        {condensing && (
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 150, height: 150, borderRadius: '50%', transform: 'translate(-50%,-50%)',
            background: 'radial-gradient(circle, rgba(255,240,185,0.85), rgba(255,214,100,0) 70%)', filter: 'blur(6px)', animation: 'f2Flare 0.7s ease-out forwards' }} />
        )}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
          opacity: capVisible ? 1 : 0, transition: 'opacity 0.26s ease-in-out' }}>
          {serif(caption, { fontFamily: G.serif, fontSize: 17, letterSpacing: 0.6 })}
          <span style={{ display: 'inline-flex', gap: 3 }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ width: 4, height: 4, borderRadius: 4, background: G.gold, animation: `f2Twinkle 1.1s ease-in-out ${i * 0.18}s infinite` }} />)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── PAGE · result ──
function PageResult({ onBack, onAgain, onExpand, result, err }) {
  const [saved, setSaved] = React.useState(false);
  const r = result || { lead: '给独居老人的', accent: '方言会议助手', blurb: '', sources: ['周会复盘', '方言天气', '截图美化器'], constraint: '' };
  const toggleSave = () => {
    setSaved((s) => {
      const next = !s;
      if (next && result) Store.addSaved({ lead: r.lead, accent: r.accent, blurb: r.blurb, sources: r.sources });
      return next;
    });
  };
  if (err) {
    return (
      <>
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 22px 0' }}>
          <span className="gpress" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13.5, color: G.inkSoft, cursor: 'pointer' }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>‹</span> 罐子
          </span>
        </div>
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px', textAlign: 'center' }}>
          <div style={{ fontFamily: G.serif, fontSize: 19, color: G.ink, marginBottom: 12 }}>合成没能完成</div>
          <div style={{ fontSize: 13, color: G.inkSoft, lineHeight: 1.6, marginBottom: 26 }}>{err}</div>
          <span className="gpress" onClick={onAgain} style={{ fontFamily: G.serif, fontSize: 16, color: G.ink, borderBottom: `1.6px solid ${G.gold}`, paddingBottom: 4, cursor: 'pointer' }}>再试一次 →</span>
        </div>
      </>
    );
  }
  return (
    <>
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 22px 0' }}>
        <span className="gpress" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13.5, color: G.inkSoft, cursor: 'pointer' }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>‹</span> 罐子
        </span>
        <span className="gpress" onClick={() => Store.set({ showUpload: true })} title="添加素材" style={{ display: 'inline-flex', cursor: 'pointer' }}>
          <GIcon name="plus" size={21} color={G.gold} sw={1.9} />
        </span>
      </div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 34px', animation: 'f2Rise 0.6s ease-out' }}>
        <Eyebrow center>刚刚合成 · 全新灵感</Eyebrow>
        <div style={{ position: 'relative', height: 92, width: 220, display: 'grid', placeItems: 'center', margin: '12px 0 6px' }}>
          <div style={{ position: 'absolute', left: '50%', top: '40%', width: 130, height: 130, transform: 'translate(-50%,-50%)',
            background: 'radial-gradient(circle, rgba(255,228,140,0.5), rgba(255,228,140,0) 66%)', filter: 'blur(11px)', animation: 'f2Halo 4.5s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', left: '50%', top: '40%', width: 64, height: 64, transform: 'translate(-50%,-50%)',
            background: 'radial-gradient(circle, rgba(255,240,180,0.75), rgba(255,224,130,0) 64%)', filter: 'blur(7px)', animation: 'f2Bloom2 3.6s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', left: '50%', top: '40%', width: 20, height: 20, transform: 'translate(-50%,-50%)', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,250,225,0.95), rgba(255,228,150,0.3) 62%, transparent 80%)', filter: 'blur(2px)', animation: 'f2Bloom2 3.6s ease-in-out infinite' }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} style={{ position: 'absolute', left: `${36 + i * 8}%`, top: '54%', width: 3, height: 3, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,244,198,1), rgba(255,214,100,0) 75%)', filter: 'blur(0.4px)',
              '--dx': `${(i % 2 ? 1 : -1) * 6}px`, '--dy': '-22px',
              animation: `f2Mote ${3.5 + i * 0.5}s linear ${-i * 0.8}s infinite` }} />
          ))}
          <div style={{ position: 'absolute', bottom: 12, width: 150, height: 2, borderRadius: 2,
            background: 'linear-gradient(90deg, transparent, rgba(244,178,51,0.95), transparent)',
            boxShadow: '0 0 12px 1px rgba(244,178,51,0.5)', animation: 'f2Line 4s ease-in-out infinite' }} />
        </div>
        <div style={{ fontFamily: G.serif, fontSize: 27, lineHeight: 1.4, color: G.ink, textAlign: 'center', textWrap: 'pretty', margin: '4px 0 18px' }}>
          {r.lead ? <>{r.lead} <br /></> : null}<span style={{ fontStyle: 'italic', color: G.gold }}>{r.accent}</span>
        </div>
        <div style={{ fontFamily: G.serif, fontStyle: 'italic', fontSize: 13, color: G.inkFaint, letterSpacing: 0.3, textAlign: 'center', textWrap: 'pretty', lineHeight: 1.6, marginBottom: 38 }}>
          {r.blurb ? <>{r.blurb}<br /></> : null}—— 由 {(r.sources || []).join(' · ')} 合成
        </div>
        <span className="gpress" onClick={() => onExpand && onExpand(r)} style={{ fontFamily: G.serif, fontSize: 17, color: G.ink, borderBottom: `1.6px solid ${G.gold}`, paddingBottom: 4, cursor: 'pointer' }}>让 Agent 展开它 →</span>
        <div style={{ display: 'flex', gap: 26, fontSize: 13, marginTop: 20 }}>
          <span className="gpress" onClick={toggleSave} style={{ cursor: 'pointer', color: saved ? G.gold : G.inkFaint, fontWeight: saved ? 600 : 400, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {saved && <GIcon name="check" size={13} color={G.gold} sw={2.2} />}{saved ? '已收藏' : '收藏进罐'}
          </span>
          <span className="gpress" onClick={onAgain} style={{ cursor: 'pointer', color: G.inkFaint }}>再摇一次</span>
        </div>
      </div>
    </>
  );
}

// 灵感罐主流程（无外壳，供 App 复用）。stage: idle | shaking | synth | result
export function JarHome({ onExpand }) {
  const [stage, setStage] = React.useState('idle');
  const [result, setResult] = React.useState(null);
  const [err, setErr] = React.useState(null);
  const [pending, setPending] = React.useState(false);
  const go = () => {
    if (stage !== 'idle') return;
    if (!Agent.ensureKey()) return;   // 没 Key → 弹窗，停在 idle
    setResult(null); setErr(null); setPending(true);
    setStage('shaking');
    setTimeout(() => setStage('synth'), 720);
    Agent.synthesize()
      .then((r) => setResult(r))
      .catch((e) => setErr(e.message === 'NO_KEY' ? '请先连接智谱 API Key' : e.message))
      .finally(() => setPending(false));
  };
  const reset = () => { setStage('idle'); setResult(null); setErr(null); };
  // 「让 Agent 展开它」：把结果存进 store.pendingIdea，再让父级切到对话 Tab。
  const handoffToAgent = (idea) => {
    if (idea) Store.setPendingIdea(idea);
    if (onExpand) onExpand();
  };
  return (
    <>
      {stage === 'result'
        ? <PageResult onBack={reset} onAgain={() => { reset(); setTimeout(go, 0); }} onExpand={handoffToAgent} result={result} err={err} />
        : <PageIdle onShake={go} shaking={stage === 'shaking'} fading={stage === 'synth'} />}
      {stage === 'synth' && <SynthSequence pending={pending} onDone={() => setStage('result')} />}
    </>
  );
}
