import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, FileText, Shield, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const isActive = (to: string) =>
    to === '/dashboard' ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="demo-banner">⚠ DEMO / DEVELOPMENT PORTAL — NOT AN OFFICIAL GOVERNMENT SERVICE</div>

      <header style={{ background: 'var(--navy)', color: '#fff', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 56, gap: 24 }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: 'var(--cyan)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' }}>CP</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1 }}>Corporate Compliance Portal</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em' }}>DIR-12 FILING SYSTEM</div>
            </div>
          </Link>

          <nav style={{ display: 'flex', gap: 2, marginLeft: 20, flex: 1 }}>
            {[
              { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { to: '/submissions', label: 'My Submissions', icon: FileText },
              ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel', icon: Shield }] : []),
            ].map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6,
                textDecoration: 'none', fontSize: 13, fontWeight: 500,
                color: isActive(to) ? '#fff' : 'rgba(255,255,255,0.65)',
                background: isActive(to) ? 'rgba(255,255,255,0.15)' : 'transparent',
              }}>
                <Icon size={14} />{label}
              </Link>
            ))}
          </nav>

          <div style={{ position: 'relative' }}>
            <button onClick={() => setUserMenuOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '5px 10px', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span>{user?.name}</span>
              <ChevronDown size={13} />
            </button>
            {userMenuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setUserMenuOpen(false)} />
                <div style={{ position: 'absolute', right: 0, top: '110%', width: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 200, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
                    <span className={`badge badge-${user?.role?.toLowerCase()}`} style={{ marginTop: 4 }}>{user?.role}</span>
                  </div>
                  <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--danger)' }}>
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
          <Outlet />
        </div>
      </main>

      <footer style={{ background: 'var(--navy)', color: 'rgba(255,255,255,0.45)', padding: '14px 0', textAlign: 'center', fontSize: 11 }}>
        Corporate Compliance Portal · DEMO SYSTEM · Not affiliated with MCA or Government of India
      </footer>
    </div>
  );
}
