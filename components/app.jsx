// app.jsx — 应用根组件：4 Tab 切换 + 挂载 API Key 弹窗，并渲染到 #root。
const { AppPhone, JarHome, AppAgent, AppCommunity, AppMe, KeyModal } = window;

function App() {
  const [tab, setTab] = React.useState('home');
  let screen;
  if (tab === 'home') screen = <JarHome onExpand={() => setTab('agent')} />;
  else if (tab === 'agent') screen = <AppAgent />;
  else if (tab === 'community') screen = <AppCommunity />;
  else screen = <AppMe />;
  return (
    <div className="stage">
      <div className="phone-wrap">
        <AppPhone active={tab} onChange={setTab}>{screen}</AppPhone>
        <KeyModal />
      </div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
