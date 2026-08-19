import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = getErrorMessage(err);
      const fieldErrs = getFieldErrors(err);
      if (Object.keys(fieldErrs).length) setErrors(fieldErrs);
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div className="demo-banner">⚠ DEMO / DEVELOPMENT PORTAL — NOT AN OFFICIAL GOVERNMENT SERVICE</div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: 'var(--navy)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: 800, fontSize: 22, color: '#fff' }}>CP</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Corporate Compliance Portal</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>DEMO / DEVELOPMENT SYSTEM</p>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Sign In</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address<span className="required">*</span></label>
                  <input
                    className={`form-control ${errors.email ? 'error' : ''}`}
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Password<span className="required">*</span></label>
                  <input
                    className={`form-control ${errors.password ? 'error' : ''}`}
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>

                <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                  {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : <><LogIn size={16} /> Sign In</>}
                </button>
              </form>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: 'var(--navy)', fontWeight: 600 }}>Register</Link>
                </p>
              </div>
            </div>
          </div>

          {/* Demo credentials */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>DEMO CREDENTIALS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Admin', email: 'admin@demo.local', pwd: 'Admin@1234' },
                  { label: 'User 1', email: 'demo.user1@example.local', pwd: 'User@1234' },
                  { label: 'User 2', email: 'demo.user2@example.local', pwd: 'User@1234' },
                ].map((cred) => (
                  <button
                    key={cred.email}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'flex-start', fontSize: 12 }}
                    onClick={() => { setForm({ email: cred.email, password: cred.pwd }); }}
                  >
                    <span style={{ fontWeight: 600, minWidth: 44 }}>{cred.label}:</span>
                    <span style={{ color: 'var(--text-muted)' }}>{cred.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
