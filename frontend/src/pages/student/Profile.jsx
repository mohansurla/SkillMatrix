import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { usersAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '', password: '', confirm_password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.password && form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password && form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { name: form.name, bio: form.bio };
      if (form.password) payload.password = form.password;
      const res = await usersAPI.update(user.id, payload);
      updateUser(res.data.data.user);
      toast.success('Profile updated successfully! ✅');
      setForm((f) => ({ ...f, password: '', confirm_password: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  const getInitials = (name = '') => name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <DashboardLayout title="Profile">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account information</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ maxWidth: 900 }}>
        {/* Profile overview */}
        <div className="card">
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div
              className="avatar avatar-xl"
              style={{ margin: '0 auto 14px', background: '#0066cc' }}
            >
              {getInitials(user?.name)}
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</h3>
            <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>{user?.email}</p>
            <div style={{ marginTop: '10px' }}>
              <span className={`badge badge-${user?.role === 'admin' ? 'danger' : user?.role === 'mentor' ? 'info' : 'primary'}`}>
                {user?.role}
              </span>
            </div>
            {user?.bio && (
              <p style={{ color: '#666', fontSize: 13, marginTop: '14px', lineHeight: 1.6 }}>
                {user.bio}
              </p>
            )}
            <p style={{ fontSize: 11, color: '#999', marginTop: '14px' }}>
              Member since {new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Edit form */}
        <div className="card">
          <div className="card-header"><span className="card-title">Edit Profile</span></div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-email">Email Address</label>
              <input
                id="profile-email"
                type="email"
                className="form-input"
                value={user?.email}
                disabled
                style={{ opacity: 0.5 }}
              />
              <span className="form-hint">Email cannot be changed</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-bio">Bio</label>
              <textarea
                id="profile-bio"
                className="form-textarea"
                placeholder="Tell us about yourself..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
              />
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '14px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: '10px' }}>Change Password</p>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-password">New Password</label>
                <input
                  id="profile-password"
                  type="password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Leave blank to keep current"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label" htmlFor="profile-confirm">Confirm Password</label>
                <input
                  id="profile-confirm"
                  type="password"
                  className={`form-input ${errors.confirm_password ? 'error' : ''}`}
                  placeholder="Repeat new password"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                />
                {errors.confirm_password && <span className="form-error">{errors.confirm_password}</span>}
              </div>
            </div>

            <button
              id="save-profile-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? <span className="spinner spinner-sm" /> : '💾'}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

