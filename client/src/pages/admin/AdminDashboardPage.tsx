import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Users, FileText, CheckCircle, XCircle, Clock, Inbox, AlertCircle } from 'lucide-react';

interface Stats { totalUsers: number; totalSubmissions: number; drafts: number; submitted: number; underReview: number; approved: number; rejected: number; }

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data.data)).catch(() => {});
  }, []);

  const cards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'var(--navy)', link: '/admin/users' },
    { label: 'Total Submissions', value: stats.totalSubmissions, icon: FileText, color: 'var(--info)', link: '/admin/submissions' },
    { label: 'Drafts', value: stats.drafts, icon: Inbox, color: '#64748b', link: '/admin/submissions?status=DRAFT' },
    { label: 'Submitted', value: stats.submitted, icon: Clock, color: 'var(--info)', link: '/admin/submissions?status=SUBMITTED' },
    { label: 'Under Review', value: stats.underReview, icon: AlertCircle, color: 'var(--warning)', link: '/admin/submissions?status=UNDER_REVIEW' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'var(--success)', link: '/admin/submissions?status=APPROVED' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'var(--danger)', link: '/admin/submissions?status=REJECTED' },
  ] : [];

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Admin Overview</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Corporate Compliance Portal — Demo system</p>
      </div>

      {!stats ? (
        <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner spinner-lg" style={{ display: 'block', margin: '0 auto' }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 32 }}>
          {cards.map(({ label, value, icon: Icon, color, link }) => (
            <Link to={link} key={label} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: 20, textAlign: 'center', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}>
                <Icon size={24} style={{ color, display: 'block', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginTop: 4 }}>{label}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="alert alert-info">
        <strong>Integration Status:</strong> Finanvo MCA API connected · Company search, CIN lookup & filing history live ·
        Official MCA filing submission: placeholder (requires authorized MCA API credentials)
      </div>
    </>
  );
}
