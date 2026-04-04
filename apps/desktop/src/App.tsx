import { useState, useEffect } from 'react';
import { getPlatform, getAuthAdapter, isDesktop } from '@scripture-ai/native';

function App() {
  const [platform, setPlatform] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize platform detection
    const currentPlatform = getPlatform();
    setPlatform(currentPlatform);

    // Check authentication status
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const auth = getAuthAdapter();
      const authenticated = await auth.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Failed to check auth:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    try {
      const auth = getAuthAdapter();
      await auth.login();
      // After login, check auth status again
      // For desktop, this will be triggered by callback
      if (!isDesktop()) {
        await checkAuth();
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  async function handleLogout() {
    try {
      const auth = getAuthAdapter();
      await auth.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">加载中...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1 className="title">AI读 - 圣经阅读</h1>
        <div className="header-actions">
          <span className="platform-badge">{platform}</span>
          {isAuthenticated ? (
            <button className="btn btn-secondary" onClick={handleLogout}>
              退出登录
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleLogin}>
              登录
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {isAuthenticated ? (
          <div className="content-area">
            <div className="placeholder-text">
              圣经阅读功能开发中...
              <br />
              <small>核心功能将逐步迁移到桌面端</small>
            </div>
          </div>
        ) : (
          <div className="login-prompt">
            <div className="login-icon">📖</div>
            <h2>欢迎使用 AI读</h2>
            <p>请登录以同步您的阅读进度、高亮和笔记</p>
            <button className="btn btn-primary btn-large" onClick={handleLogin}>
              开始使用
            </button>
          </div>
        )}
      </main>

      {/* Status Bar */}
      <footer className="status-bar">
        <span>AI读桌面版 v0.1.0</span>
        <span>平台: {platform}</span>
      </footer>
    </div>
  );
}

export default App;