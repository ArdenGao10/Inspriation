// App.jsx — 应用根：4 Tab 切换 + 全局弹窗（API Key / 素材上传）。
import React from 'react';
import { AppShell } from './components/AppShell.jsx';
import { JarHome } from './components/JarHome.jsx';
import { AppAgent } from './components/AppAgent.jsx';
import { AppCommunity } from './components/AppCommunity.jsx';
import { AppMe } from './components/AppMe.jsx';
import { KeyModal } from './components/KeyModal.jsx';
import { UploadModal } from './components/UploadModal.jsx';

export default function App() {
  const [tab, setTab] = React.useState('home');
  let screen;
  if (tab === 'home') screen = <JarHome onExpand={() => setTab('agent')} />;
  else if (tab === 'agent') screen = <AppAgent />;
  else if (tab === 'community') screen = <AppCommunity />;
  else screen = <AppMe />;
  return (
    <>
      <AppShell active={tab} onChange={setTab}>{screen}</AppShell>
      <KeyModal />
      <UploadModal />
    </>
  );
}
