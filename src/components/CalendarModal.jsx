// CalendarModal.jsx — 灵感日历（全屏页）。把灵感罐素材按「收藏当天」聚合成热力日历：
// 当天有素材的格子变深，颜色深度随当天数量递增；点格子看当天素材（可删除）。
import React from 'react';
import { G } from '../theme.js';
import { GIcon, GlowField } from './glow.jsx';
import { Store, useStore } from '../store.js';
import { FragmentRow } from './FragmentView.jsx';

const WEEK = ['一', '二', '三', '四', '五', '六', '日'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const keyOf = (y, m, d) => `${y}-${m}-${d}`;
const tsKey = (ts) => { const d = new Date(ts); return keyOf(d.getFullYear(), d.getMonth(), d.getDate()); };

// 数量 → 暖金热力（只变背景深浅）。0 为极淡底；1~4+ 逐级加深，满级带柔光。
function heat(n) {
  if (!n) return { bg: 'rgba(70,58,30,0.05)', glow: false };
  const lvl = Math.min(n, 4);
  const alpha = [0, 0.2, 0.4, 0.64, 0.9][lvl];
  return { bg: `rgba(217,165,42,${alpha})`, glow: lvl >= 4 };
}

export function CalendarModal() {
  const open = useStore((s) => s.showCalendar);
  const fragments = useStore((s) => s.fragments);
  const today = React.useMemo(() => new Date(), [open]);
  const [view, setView] = React.useState(() => ({ y: today.getFullYear(), m: today.getMonth() }));
  const [sel, setSel] = React.useState(() => tsKey(Date.now()));

  // 进入时回到当月、选中今天
  React.useEffect(() => { if (open) { setView({ y: today.getFullYear(), m: today.getMonth() }); setSel(tsKey(Date.now())); } }, [open]);

  // 按天聚合素材
  const byDay = React.useMemo(() => {
    const map = {};
    for (const f of fragments) { const k = tsKey(f.ts || Date.now()); (map[k] || (map[k] = [])).push(f); }
    return map;
  }, [fragments]);

  if (!open) return null;
  const close = () => Store.set({ showCalendar: false });

  const { y, m } = view;
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7; // 周一为一周起点
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  const todayKey = tsKey(Date.now());
  const prevMonth = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));

  // 当月汇总
  let monthTotal = 0, activeDays = 0;
  for (let d = 1; d <= daysInMonth; d++) { const n = (byDay[keyOf(y, m, d)] || []).length; if (n) { monthTotal += n; activeDays++; } }

  const selItems = (byDay[sel] || []).slice().reverse();
  const selLabel = (() => { const [yy, mm, dd] = sel.split('-').map(Number); return `${mm + 1}月${dd}日`; })();

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: G.bg, fontFamily: G.sans, display: 'flex', flexDirection: 'column' }}>
      <GlowField x="50%" y="12%" r={300} intensity={0.6} motes={10} />
      <div className="glow-scroll" style={{ position: 'relative', zIndex: 2, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* 顶栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 4px' }}>
          <span className="gpress" onClick={close} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13.5, color: G.inkSoft, cursor: 'pointer' }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>‹</span> 返回
          </span>
          <span style={{ fontFamily: G.serif, fontSize: 18, color: G.ink, letterSpacing: 0.5 }}>灵感日历</span>
          <span style={{ width: 44 }} />
        </div>

        {/* 月份切换 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '14px 0 4px' }}>
          <span className="gpress" onClick={prevMonth} style={{ cursor: 'pointer', fontSize: 20, color: G.inkSoft, padding: 4 }}>‹</span>
          <span style={{ fontFamily: G.serif, fontSize: 21, color: G.ink, minWidth: 128, textAlign: 'center' }}>{y} 年 {MONTHS[m]}</span>
          <span className="gpress" onClick={nextMonth} style={{ cursor: 'pointer', fontSize: 20, color: G.inkSoft, padding: 4 }}>›</span>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: G.inkFaint, marginBottom: 8 }}>
          本月收藏 {monthTotal} 份 · 活跃 {activeDays} 天
        </div>

        {/* 星期表头 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, padding: '0 18px' }}>
          {WEEK.map((w) => (
            <div key={w} style={{ textAlign: 'center', fontSize: 11, color: G.inkFaint, paddingBottom: 4 }}>{w}</div>
          ))}
        </div>
        {/* 日期格子 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, padding: '0 18px' }}>
          {cells.map((d, i) => {
            if (d == null) return <div key={i} />;
            const k = keyOf(y, m, d);
            const n = (byDay[k] || []).length;
            const h = heat(n);
            const isToday = k === todayKey;
            const isSel = k === sel;
            return (
              <div key={i} className="gpress" onClick={() => setSel(k)}
                style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 10, cursor: 'pointer',
                  background: h.bg, display: 'grid', placeItems: 'center',
                  border: isSel ? `1.5px solid ${G.gold}` : `1px solid ${isToday ? 'rgba(217,165,42,0.5)' : 'transparent'}`,
                  boxShadow: h.glow ? '0 0 10px rgba(217,165,42,0.5)' : 'none', transition: 'transform .12s' }}>
                <span style={{ fontSize: 12.5, color: G.ink, fontWeight: isToday ? 700 : 500 }}>{d}</span>
              </div>
            );
          })}
        </div>

        {/* 图例 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 0 6px', fontSize: 10.5, color: G.inkFaint }}>
          <span>少</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <span key={lvl} style={{ width: 13, height: 13, borderRadius: 4, background: heat(lvl).bg, border: `1px solid ${G.hair2}` }} />
          ))}
          <span>多</span>
        </div>

        {/* 选中当天素材 */}
        <div style={{ padding: '8px 18px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '6px 2px 10px' }}>
            <span style={{ fontFamily: G.serif, fontSize: 16, color: G.ink }}>{selLabel}</span>
            <span style={{ fontSize: 11.5, color: G.inkFaint }}>{selItems.length} 份素材</span>
          </div>
          {selItems.length === 0 ? (
            <div style={{ padding: '20px 4px', textAlign: 'center', fontSize: 12.5, color: G.inkFaint, lineHeight: 1.7 }}>
              这天还没收集素材 ✨
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selItems.map((f) => (
                <FragmentRow key={f.id} frag={f} onDelete={(id) => Store.removeFragment(id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
