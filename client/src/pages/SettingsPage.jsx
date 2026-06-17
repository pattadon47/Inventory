import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { profileAPI } from '../services/api';
import { Lock, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');

  // Preference States
  const [prefLanguage, setPrefLanguage] = useState(language);
  const [prefTimezone, setPrefTimezone] = useState(localStorage.getItem('timezone') || 'Asia/Bangkok');
  const [prefItemsPerPage, setPrefItemsPerPage] = useState(localStorage.getItem('itemsPerPage') || '10');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await profileAPI.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(t('profileSaved') || 'Password changed successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
    setLoading(false);
  };

  const handleSavePreferences = () => {
    // Save Language globally
    setLanguage(prefLanguage);
    // Save other preferences to localStorage
    localStorage.setItem('timezone', prefTimezone);
    localStorage.setItem('itemsPerPage', prefItemsPerPage);
    showToast(t('profileSaved') || 'Preferences saved successfully');
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>{t('settings')}</h1>
        <p>Manage your account and system preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        {/* Change Password Section */}
        <div className="settings-section" style={{ margin: 0, maxWidth: '100%' }}>
          <div className="settings-section-title">
            <Lock size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
            {t('changePassword')}
          </div>
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleChangePassword}>
                {error && (
                  <div style={{
                    background: 'var(--red-100)',
                    color: 'var(--red-500)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 14,
                    marginBottom: 16,
                  }}>
                    {error}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">{t('currentPassword')}</label>
                  <input
                    className="form-input"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('newPassword')}</label>
                  <input
                    className="form-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('confirmPassword')}</label>
                  <input
                    className="form-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="loading-spinner-green" />
                      Changing...
                    </>
                  ) : (
                    t('changePassword')
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="settings-section" style={{ margin: 0, maxWidth: '100%' }}>
          <div className="settings-section-title">
            <Shield size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
            {t('systemPrefs')}
          </div>
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">{t('language')}</label>
                <select 
                  className="form-select" 
                  value={prefLanguage} 
                  onChange={(e) => setPrefLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="th">ไทย (Thai)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('timezone')}</label>
                <select 
                  className="form-select" 
                  value={prefTimezone} 
                  onChange={(e) => setPrefTimezone(e.target.value)}
                >
                  <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                  <option value="UTC">UTC</option>
                  <option value="US/Eastern">US/Eastern (UTC-5)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('itemsPerPage')}</label>
                <select 
                  className="form-select" 
                  value={prefItemsPerPage} 
                  onChange={(e) => setPrefItemsPerPage(e.target.value)}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '6px', lineHeight: '1.4' }}>
                  💡 <strong>{t('itemsPerPage')}:</strong> {t('itemsPerPageDesc')}
                </p>
              </div>
              <button className="btn btn-primary" onClick={handleSavePreferences}>
                {t('savePrefs')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="toast toast-success">✓ {toast}</div>}
    </div>
  );
}
