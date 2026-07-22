import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/tasks', label: 'Tasks', icon: '☰' },
  { to: '/tasks/new', label: 'Add', icon: '＋' },
  { to: '/about', label: 'About', icon: 'ⓘ' },
  { to: '/admin/settings', label: 'Admin', icon: '⚙', adminOnly: true },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const items = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar__inner">
          <NavLink to="/tasks" className="brand" data-testid="brand">
            <span className="brand__mark" aria-hidden>✓</span>
            <span className="brand__name">Task List</span>
          </NavLink>

          <nav className="topnav" aria-label="Primary">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/tasks'}
                className={({ isActive }) => `topnav__link${isActive ? ' is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="account">
            {user ? (
              <>
                <span className="account__who" title={user.email}>
                  {user.email}
                  {isAdmin && <span className="pill pill--admin">Admin</span>}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={handleLogout}
                  data-testid="logout-button"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn btn--ghost btn--sm">
                  Log in
                </NavLink>
                <NavLink to="/signup" className="btn btn--primary btn--sm">
                  Sign up
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="content" data-testid="page-main">
        {children}
      </main>

      {/* Mobile bottom tab bar — replaces the top nav under 768px */}
      <nav className="tabbar" aria-label="Primary mobile">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/tasks'}
            className={({ isActive }) => `tabbar__item${isActive ? ' is-active' : ''}`}
          >
            <span className="tabbar__icon" aria-hidden>{item.icon}</span>
            <span className="tabbar__label">{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className="tabbar__item tabbar__item--btn"
          onClick={user ? handleLogout : () => navigate('/login')}
        >
          <span className="tabbar__icon" aria-hidden>{user ? '⏻' : '→'}</span>
          <span className="tabbar__label">{user ? 'Log out' : 'Log in'}</span>
        </button>
      </nav>
    </div>
  );
}
