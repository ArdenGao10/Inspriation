// Vercel Serverless Function —— 智谱 API 代理。
// 作用：把智谱 Key 藏在服务端环境变量 ZHIPU_KEY（不带 VITE_ 前缀 → 不会进前端 bundle），
// 前端没有自己的 key 时把请求体 POST 到这里，由服务端带 key 转发给智谱。
// 部署到 Vercel 后，在项目 Settings → Environment Variables 配置 ZHIPU_KEY 即可。
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const key = process.env.ZHIPU_KEY;
  if (!key) {
    res.status(500).json({ error: '服务端未配置 ZHIPU_KEY 环境变量' });
    return;
  }
  const base = process.env.ZHIPU_BASE || 'https://open.bigmodel.cn/api/paas/v4';
  try {
    const upstream = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: '代理请求失败：' + ((e && e.message) || 'unknown') });
  }
}
