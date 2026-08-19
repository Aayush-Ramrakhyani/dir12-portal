import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', password: '', confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await register(form);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (err) {
      const fieldErrs = getFieldErrors(err);
      if (Object.keys(fieldErrs).length) setErrors(fieldErrs);
      else toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div className="demo-banner">⚠ DEMO / DEVELOPMENT PORTAL — NOT AN OFFICIAL GOVERNMENT SERVICE</div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: 'var(--navy)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: 800, fontSize: 22, color: '#fff' }}>CP</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Corporate Compliance Portal</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Create your demo account</p>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Register</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name<span className="required">*</span></label>
                  <input className={`form-control ${errors.name ? 'error' : ''}`} type="text" name="name" value={form.name} onChange={handleChange} placeholder="Enter your full name" required />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address<span className="required">*</span></label>
                  <input className={`form-control ${errors.email ? 'error' : ''}`} type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number<span className="required">*</span></label>
                  <input className={`form-control ${errors.mobile ? 'error' : ''}`} type="tel" name="mobile" value={form.mobile} onChange={handleChange} placeholder="10-digit mobile number" required />
                  {errors.mobile && <span className="form-error">{errors.mobile}</span>}
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Password<span className="required">*</span></label>
                    <input className={`form-control ${errors.password ? 'error' : ''}`} type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 8 chars, mixed case + digit" required />
                    {errors.password && <span className="form-error">{errors.password}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password<span className="required">*</span></label>
                    <input className={`form-control ${errors.confirmPassword ? 'error' : ''}`} type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password" required />
                    {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                  </div>
                </div>

                <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                  {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Registering...</> : <><UserPlus size={16} /> Create Account</>}
                </button>
              </form>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: 'var(--navy)', fontWeight: 600 }}>Sign in</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
