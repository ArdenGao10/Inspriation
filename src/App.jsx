// App.jsx — 应用根：4 Tab 切换 + 挂载 API Key 弹窗。响应式：移动端全屏 / 桌面端居中列。
import React from 'react';
import { AppPhone } from './components/AppShell.jsx';
import { JarHome } from './components/JarHome.jsx';
import { AppAgent } from './components/AppAgent.jsx';
import { AppCommunity } from './components/AppCommunity.jsx';
import { AppMe } from './components/AppMe.jsx';
import { KeyModal } from './components/KeyModal.jsx';

export default function App() {
  const [tab, setTab] = React.useState('home');
  let screen;
  if (tab === 'home') screen = <JarHome onExpand={() => setTab('agent')} />;
  else if (tab === 'agent') screen = <AppAgent />;
  else if (tab === 'community') screen = <AppCommunity />;
  else screen = <AppMe />;
  return (
    <div className="app-outer">
      <div className="app-frame">
        <AppPhone active={tab} onChange={setTab}>{screen}</AppPhone>
        <KeyModal />
      </div>
    </div>
  );
}
