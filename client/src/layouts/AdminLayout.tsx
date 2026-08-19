import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, FileText, Users, ClipboardList, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = async () => { await logout(); toast.success('Signed out'); navigate('/login'); };
  const isActive = (to: string) => to === '/admin' ? location.pathname === to : location.pathname.startsWith(to);

  const navLinks = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/submissions', label: 'Submissions', icon: FileText },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="demo-banner">⚠ ADMIN PANEL — DEMO / DEVELOPMENT PORTAL — NOT AN OFFICIAL GOVERNMENT SERVICE</div>

      <header style={{ background: 'var(--navy-dark)', color: '#fff', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 56, gap: 24 }}>
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: '#e11d48', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: '#fff' }}>ADM</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1 }}>Admin Panel</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>Corporate Compliance Portal</div>
            </div>
          </Link>

          <nav style={{ display: 'flex', gap: 2, marginLeft: 20, flex: 1 }}>
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6,
                textDecoration: 'none', fontSize: 13, fontWeight: 500,
                color: isActive(to) ? '#fff' : 'rgba(255,255,255,0.6)',
                background: isActive(to) ? 'rgba(255,255,255,0.12)' : 'transparent',
              }}>
                <Icon size={14} />{label}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/dashboard" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textDecoration: 'none' }}>← User View</Link>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setDropOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '5px 10px', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10 }}>{user?.name?.[0]}</div>
                {user?.name}
                <ChevronDown size={12} />
              </button>
              {dropOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setDropOpen(false)} />
                  <div style={{ position: 'absolute', right: 0, top: '110%', width: 180, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 200, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
                    <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--danger)' }}>
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
          <Outlet />
        </div>
      </main>

      <footer style={{ background: 'var(--navy-dark)', color: 'rgba(255,255,255,0.35)', padding: '10px 0', textAlign: 'center', fontSize: 11 }}>
        Admin Panel — Corporate Compliance Portal — DEMO SYSTEM
      </footer>
    </div>
  );
}
