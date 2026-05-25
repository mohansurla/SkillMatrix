import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const NAV = {
  student: [
    { to: '/student/dashboard', icon: '⚡', label: 'Dashboard' },
    { to: '/student/assignments', icon: '📝', label: 'Assignments' },
    { to: '/student/progress', icon: '📈', label: 'My Progress' },
    { to: '/student/profile', icon: '👤', label: 'Profile' },
  ],
  mentor: [
    { to: '/mentor/dashboard', icon: '⚡', label: 'Dashboard' },
    { to: '/mentor/evaluate', icon: '✅', label: 'Evaluate' },
    { to: '/mentor/students', icon: '🎓', label: 'My Students' },
    { to: '/mentor/profile', icon: '👤', label: 'Profile' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: '⚡', label: 'Dashboard' },
    { to: '/admin/analytics', icon: '📊', label: 'Analytics' },
    { to: '/admin/users', icon: '👥', label: 'Users' },
    { to: '/admin/skills', icon: '🎯', label: 'Skills' },
    { to: '/admin/modules', icon: '📚', label: 'Modules' },
  ],
};

const ROLE_LABELS = { student: 'Student', mentor: 'Mentor', admin: 'Administrator' };

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <span>SM</span>
        </div>
        <div>
          <div className="sidebar-logo-name">SkillMatrix</div>
          <div className="sidebar-logo-sub">Learning Platform</div>
        </div>
      </div>

      {/* User card */}
      <div className="sidebar-user">
        <div className="avatar avatar-md">
          {getInitials(user?.name)}
        </div>
        <div className="min-w-0">
          <div className="sidebar-user-name truncate">{user?.name}</div>
          <div className="sidebar-user-role">{ROLE_LABELS[user?.role]}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom: logout */}
      <div className="sidebar-bottom">
        <button className="sidebar-logout" onClick={handleLogout}>
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

