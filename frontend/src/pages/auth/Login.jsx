import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      const { user, token } = res.data.data;
      login(user, token);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
      const redirectMap = { admin: '/admin/dashboard', mentor: '/mentor/dashboard', student: '/student/dashboard' };
      navigate(redirectMap[user.role]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: 'admin@skillmatrix.com', password: 'Admin@123' },
      mentor: { email: 'mentor@skillmatrix.com', password: 'Mentor@123' },
      student: { email: 'student@skillmatrix.com', password: 'Student@123' },
    };
    setForm(creds[role]);
    setErrors({});
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card slide-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">SM</div>
          <div>
            <div className="auth-logo-name">SkillMatrix</div>
            <div className="auth-logo-sub">Learning Platform</div>
          </div>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to continue your learning journey</p>

        {/* Quick login buttons */}
        <div className="demo-logins">
          <span className="demo-label">Quick demo login:</span>
          <div className="demo-btns">
            {['student', 'mentor', 'admin'].map((r) => (
              <button key={r} type="button" className="demo-btn" onClick={() => fillDemo(r)}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button
            id="login-btn"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? <span className="spinner spinner-sm" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register">Create one →</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

