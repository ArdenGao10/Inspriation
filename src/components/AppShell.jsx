// AppShell.jsx — 响应式应用外壳 + 底部 Tab 导航（去掉模拟手机外框/状态栏）
import { G } from '../theme.js';
import { GIcon } from './glow.jsx';

const APP_TABS = [
  { k: 'home', label: '灵感', icon: 'home' },
  { k: 'agent', label: '对话', icon: 'spark' },
  { k: 'community', label: '社区', icon: 'comm' },
  { k: 'me', label: '我的', icon: 'user' },
];

function AppTabBar({ active, onChange }) {
  return (
    <div style={{ flex: '0 0 auto', position: 'relative', zIndex: 4, display: 'flex', justifyContent: 'space-around',
      alignItems: 'center', padding: '11px 16px 16px', borderTop: `1px solid ${G.hair2}`,
      background: 'linear-gradient(to top, rgba(253,251,244,0.97) 55%, rgba(253,251,244,0))' }}>
      {APP_TABS.map((t) => {
        const on = t.k === active;
        return (
          <div key={t.k} className="gpress" onClick={() => onChange(t.k)} style={{ display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 5, minWidth: 46, position: 'relative', cursor: 'pointer' }}>
            {on && <div style={{ position: 'absolute', top: -11, width: 32, height: 32, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,224,130,0.62), rgba(255,224,130,0) 70%)', filter: 'blur(4px)' }} />}
            <GIcon name={t.icon} size={t.k === 'comm' ? 22 : 21} color={on ? G.gold : G.inkFaint} sw={on ? 1.7 : 1.4} />
            <span style={{ fontSize: 10.5, color: on ? G.ink : G.inkFaint, fontWeight: on ? 600 : 500, letterSpacing: 0.3 }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// 响应式应用外壳：撑满所在容器（移动端全屏 / 桌面端居中列），底部 Tab 导航。
export function AppPhone({ active, onChange, children, bg }) {
  return (
    <div className="glow" style={{ width: '100%', height: '100%', background: bg || G.bg, display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden', fontFamily: G.sans, color: G.ink }}>
      {/* 顶部安全区留白（替代原模拟状态栏）：刘海屏自动撑开，桌面端约 12px */}
      <div style={{ flex: '0 0 auto', height: 'max(12px, env(safe-area-inset-top))' }} />
      <div className="glow-scroll" style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
      <AppTabBar active={active} onChange={onChange} />
    </div>
  );
}
