import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Package, User, Lock, Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password States
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'success'
  const [forgotInput, setForgotInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(t('loginErrorEmpty'));
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(username, password);
    if (!result.success) {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotInput.trim()) {
      setError(t('forgotErrorEmpty'));
      return;
    }
    setLoading(true);
    setError('');
    
    // Simulate API request to reset password
    setTimeout(() => {
      setLoading(false);
      setMode('success');
    }, 1200);
  };

  const handleBackToLogin = () => {
    setMode('login');
    setError('');
    setForgotInput('');
  };

  return (
    <div className="login-page">
      {/* Floating background shapes */}
      <div className="login-bg-shapes">
        <div className="login-bg-shape" />
        <div className="login-bg-shape" />
        <div className="login-bg-shape" />
        <div className="login-bg-shape" />
        <div className="login-bg-shape" />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Package size={32} />
          </div>
          <h1>itopplus</h1>
          <p>{t('systemDesc')}</p>
        </div>

        {mode === 'login' && (
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}

            <div className="login-input-group">
              <div className="login-input-icon">
                <User size={18} />
              </div>
              <input
                type="text"
                className="login-input"
                placeholder={t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="login-input-group">
              <div className="login-input-icon">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '8px' }}>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => { setMode('forgot'); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {t('forgotPassword')}
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner" />
                  {t('signingIn')}
                </>
              ) : (
                t('signIn')
              )}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form className="login-form" onSubmit={handleForgotSubmit}>
            <div style={{ color: 'white', textAlign: 'center', marginBottom: 12, fontSize: '14px' }}>
              {t('forgotPasswordDesc')}
            </div>

            {error && <div className="login-error">{error}</div>}

            <div className="login-input-group">
              <div className="login-input-icon">
                <Mail size={18} />
              </div>
              <input
                type="text"
                className="login-input"
                placeholder={t('usernameOrEmail')}
                value={forgotInput}
                onChange={(e) => setForgotInput(e.target.value)}
                autoFocus
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner" />
                  Sending...
                </>
              ) : (
                t('resetPassword')
              )}
            </button>

            <button
              type="button"
              className="login-btn"
              onClick={handleBackToLogin}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                marginTop: '-4px'
              }}
            >
              <ArrowLeft size={16} />
              {t('backToLogin')}
            </button>
          </form>
        )}

        {mode === 'success' && (
          <div className="login-form" style={{ textAlign: 'center', color: 'white' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              ✓
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
              Sent!
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '24px' }}>
              {t('forgotSuccess')}
            </p>
            <button
              type="button"
              className="login-btn"
              onClick={handleBackToLogin}
            >
              {t('backToLogin')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
