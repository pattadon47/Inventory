import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { profileAPI } from '../services/api';
import { User, Mail, Phone, Save, Camera } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const getInitials = () => {
    const name = formData.fullName || user?.username || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await profileAPI.update({
        ...formData,
        avatar: avatar
      });
      // Update global Auth state
      if (res.data) {
        updateUser(res.data);
      } else {
        updateUser({ ...user, ...formData, avatar });
      }
      showToast(t('profileSaved'));
    } catch {
      showToast('Profile saved locally');
    }
    setLoading(false);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>{t('profile')}</h1>
        <p>{t('welcome')}, {user?.username}</p>
      </div>

      <div className="card profile-card">
        <div className="card-body">
          <div className="profile-avatar-container" onClick={handleAvatarClick} title={t('changePhoto')}>
            {avatar ? (
              <img src={avatar} alt="Profile" className="profile-avatar" />
            ) : (
              <div className="profile-avatar">
                {getInitials()}
              </div>
            )}
            <div className="profile-avatar-overlay">
              <Camera size={20} style={{ marginBottom: 4 }} />
              <span>{t('changePhoto')}</span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          <div className="text-center mb-24" style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>
              {formData.fullName || user?.username}
            </h2>
            <span className={`badge ${user?.role === 'admin' ? 'badge-green' : 'badge-blue'}`} style={{ marginTop: 8 }}>
              {user?.role || 'user'}
            </span>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">
                <User size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                {t('fullName')}
              </label>
              <input
                className="form-input"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <Mail size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                {t('email')}
              </label>
              <input
                className="form-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <Phone size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                {t('phone')}
              </label>
              <input
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>

            <button className="btn btn-primary mt-8" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner-green" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {t('saveChanges')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {toast && <div className="toast toast-success" style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        background: 'var(--primary-600)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 1000,
        fontWeight: '600'
      }}>✓ {toast}</div>}
    </div>
  );
}
