// App.jsx — 应用根：4 Tab 切换 + 全局弹窗（API Key / 素材上传）。
// 四个 Tab 全部常驻挂载，只用 CSS display 切换可见性 —— 切走再回来，
// 各页的本地 state / 滚动位置 / 在途请求都保留（不会被卸载重置）。
import React from 'react';
import { AppShell } from './components/AppShell.jsx';
import { JarHome } from './components/JarHome.jsx';
import { AppAgent } from './components/AppAgent.jsx';
import { AppCommunity } from './components/AppCommunity.jsx';
import { AppMe } from './components/AppMe.jsx';
import { KeyModal } from './components/KeyModal.jsx';
import { UploadModal } from './components/UploadModal.jsx';

// 单个 Tab 容器：铺满内容区，非激活时 display:none（DOM 保留、state 不卸载）。
function TabPane({ active, children }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: active ? 'block' : 'none' }}>
      {children}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = React.useState('home');
  return (
    <>
      <AppShell active={tab} onChange={setTab}>
        <TabPane active={tab === 'home'}><JarHome onExpand={() => setTab('agent')} /></TabPane>
        <TabPane active={tab === 'agent'}><AppAgent /></TabPane>
        <TabPane active={tab === 'community'}><AppCommunity /></TabPane>
        <TabPane active={tab === 'me'}><AppMe /></TabPane>
      </AppShell>
      <KeyModal />
      <UploadModal />
    </>
  );
}
