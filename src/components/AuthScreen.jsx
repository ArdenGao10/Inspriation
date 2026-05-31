// AuthScreen.jsx — 登录 / 注册页（光晕风格）。
// App 的入口门禁：store.user 为空时渲染本页，登录/注册成功后写回 user → 自动进入主应用。
// 鉴权走 lib/auth.js：配了 Supabase 用 Supabase Auth，否则本地 mock。
import React from 'react';
import { G } from '../theme.js';
import { GIcon } from './glow.jsx';
import { Auth } from '../lib/auth.js';
import { hasSupabase } from '../lib/supabase.js';

// 品牌光点：发光圆 + 闪烁星，和对话页 GlowDot 同源
function BrandGlow({ size = 56 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: size * 1.7, height: size * 1.7, transform: 'translate(-50%,-50%)',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,224,130,0.6), rgba(255,224,130,0) 70%)', filter: 'blur(5px)', animation: 'gGlow 5s ease-in-out infinite' }} />
      <GIcon name="spark" size={size * 0.78} color={G.gold} sw={1.4} />
    </div>
  );
}

// 单个输入框：标签 + 输入。和 KeyModal 输入框同一套描边/圆角。
function Field({ label, ...props }) {
  return (
    <label style={{ display: 'block', marginTop: 14 }}>
      <span style={{ display: 'block', fontSize: 12, color: G.inkSoft, marginBottom: 6, letterSpacing: 0.3 }}>{label}</span>
      <input {...props}
        style={{ width: '100%', height: 44, borderRadius: 11, border: `1px solid ${G.hair}`, background: '#fff',
          padding: '0 13px', fontSize: 14, color: G.ink, outline: 'none', boxSizing: 'border-box', fontFamily: G.sans }} />
    </label>
  );
}

export function AuthScreen() {
  const [mode, setMode] = React.useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [err, setErr] = React.useState('');
  const [notice, setNotice] = React.useState(''); // 成功类提示（如「请查收确认邮件」）
  const [busy, setBusy] = React.useState(false);

  const isSignup = mode === 'signup';
  const switchMode = (m) => { setMode(m); setErr(''); setNotice(''); };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr(''); setNotice('');
    setBusy(true);
    try {
      if (isSignup) {
        const r = await Auth.signUp(email, password, name);
        if (r && r.needConfirm) {
          setNotice('注册成功，请查收邮箱确认后再登录');
          setMode('signin');
        }
        // 有 session 时 store.user 已被写入 → App 自动切到主应用，无需额外处理
      } else {
        await Auth.signIn(email, password);
      }
    } catch (e2) {
      setErr((e2 && e2.message) || '出错了，再试一次');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', background: G.bg, fontFamily: G.sans }} className="glow-scroll">
      {/* 顶部柔光（径向，自然发散） */}
      <div style={{ position: 'absolute', left: '50%', top: 0, width: 460, height: 300, transform: 'translate(-50%,-45%)',
        pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(50% 55% at 50% 50%, rgba(255,224,130,0.30) 0%, rgba(255,224,130,0.10) 42%, rgba(255,224,130,0) 72%)',
        filter: 'blur(18px)', animation: 'glowBreathe 9s ease-in-out infinite' }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '48px 22px' }}>
        {/* 品牌头 */}
        <BrandGlow size={56} />
        <div style={{ fontFamily: G.serif, fontSize: 24, color: G.ink, letterSpacing: 0.5, marginTop: 14 }}>灵感搜集器</div>
        <div style={{ fontSize: 12.5, color: G.inkFaint, marginTop: 6, letterSpacing: 0.4 }}>登录后，开始收集与展开你的灵感</div>

        {/* 卡片 */}
        <div style={{ width: 'min(100%, 360px)', marginTop: 26, background: '#FFFDF7', borderRadius: 20,
          border: `1px solid ${G.hair2}`, boxShadow: '0 18px 50px rgba(120,90,30,0.12)', padding: '20px 20px 22px' }}>
          {/* 登录 / 注册 分段切换 */}
          <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: G.bgWarm }}>
            {[['signin', '登录'], ['signup', '注册']].map(([m, label]) => {
              const on = mode === m;
              return (
                <button key={m} type="button" onClick={() => switchMode(m)} className="gpress"
                  style={{ flex: 1, height: 36, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: G.sans,
                    fontSize: 13.5, fontWeight: on ? 600 : 500, color: on ? G.ink : G.inkSoft,
                    background: on ? '#fff' : 'transparent',
                    boxShadow: on ? '0 2px 8px rgba(120,90,30,0.08)' : 'none', transition: 'all .18s ease' }}>
                  {label}
                </button>
              );
            })}
          </div>

          <form onSubmit={submit}>
            {isSignup && (
              <Field label="昵称（选填）" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="怎么称呼你" autoComplete="nickname" />
            )}
            <Field label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email" autoFocus />
            <Field label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位" autoComplete={isSignup ? 'new-password' : 'current-password'} />

            {err && <div style={{ marginTop: 12, fontSize: 12.5, color: '#C0492B', lineHeight: 1.5 }}>{err}</div>}
            {notice && <div style={{ marginTop: 12, fontSize: 12.5, color: G.gold, lineHeight: 1.5 }}>{notice}</div>}

            <button type="submit" disabled={busy} className="gpress"
              style={{ width: '100%', height: 46, marginTop: 18, borderRadius: 12, border: 'none',
                cursor: busy ? 'default' : 'pointer', fontFamily: G.sans, fontSize: 15, fontWeight: 600, color: '#fff',
                background: busy ? G.goldSoft : G.gold, opacity: busy ? 0.8 : 1,
                boxShadow: '0 6px 18px rgba(217,165,42,0.32)', transition: 'background .2s ease' }}>
              {busy ? '请稍候…' : (isSignup ? '注册并进入' : '登录')}
            </button>
          </form>

          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12.5, color: G.inkSoft }}>
            {isSignup ? '已经有账号了？' : '还没有账号？'}
            <span className="gpress" onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
              style={{ color: G.gold, fontWeight: 600, cursor: 'pointer', marginLeft: 4 }}>
              {isSignup ? '去登录' : '去注册'}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 18, fontSize: 11, color: G.inkFaint, textAlign: 'center', lineHeight: 1.6, maxWidth: 300 }}>
          {hasSupabase
            ? '由 Supabase 账号体系托管，密码不会明文存储。'
            : '当前为本地演示模式，账号仅保存在此浏览器。'}
        </div>
      </div>
    </div>
  );
}
