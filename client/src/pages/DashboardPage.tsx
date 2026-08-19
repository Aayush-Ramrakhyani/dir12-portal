import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/StatusBadge';
import type { Submission } from '../types';
import { Plus, Eye, Edit, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get('/submissions')
      .then(({ data }) => setSubmissions(data.data))
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const stats = submissions.reduce(
    (acc, s) => {
      acc.total++;
      if (s.status === 'DRAFT') acc.draft++;
      else if (s.status === 'SUBMITTED') acc.submitted++;
      else if (s.status === 'UNDER_REVIEW') acc.underReview++;
      else if (s.status === 'APPROVED') acc.approved++;
      else if (s.status === 'REJECTED') acc.rejected++;
      return acc;
    },
    { total: 0, draft: 0, submitted: 0, underReview: 0, approved: 0, rejected: 0 }
  );

  const handleNew = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/submissions');
      navigate(`/submissions/${data.data.id}/edit`);
    } catch (e) {
      toast.error(getErrorMessage(e));
      setCreating(false);
    }
  };

  const downloadPDF = async (submissionId: string, refNo: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const r = await fetch(`/api/submissions/${submissionId}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `DEMO_DIR12_${refNo}.pdf`; a.click();
    } catch { toast.error('PDF download failed'); }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Welcome back, {user?.name}</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew} disabled={creating}>
          {creating ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Creating...</> : <><Plus size={15} /> New DIR-12 Filing</>}
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Filings', value: stats.total, color: 'var(--navy)' },
          { label: 'Drafts', value: stats.draft, color: '#64748b' },
          { label: 'Submitted', value: stats.submitted, color: 'var(--info)' },
          { label: 'Under Review', value: stats.underReview, color: 'var(--warning)' },
          { label: 'Approved', value: stats.approved, color: 'var(--success)' },
          { label: 'Rejected', value: stats.rejected, color: 'var(--danger)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Submissions table */}
      <div className="card">
        <div className="card-header"><span className="card-title">My Submissions</span></div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><span className="spinner spinner-lg" style={{ display: 'block', margin: '0 auto' }} /></div>
        ) : submissions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={40} style={{ color: 'var(--border-strong)', display: 'block', margin: '0 auto 12px' }} />
            <p style={{ marginBottom: 16 }}>No submissions yet.</p>
            <button className="btn btn-primary" onClick={handleNew} disabled={creating}><Plus size={15} /> Create First Filing</button>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr><th>Reference No.</th><th>Company</th><th>Status</th><th>Last Updated</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.referenceNumber ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      {s.company
                        ? <><div style={{ fontWeight: 500, fontSize: 13 }}>{s.company.companyName}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.company.cin}</div></>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not entered</span>}
                    </td>
                    <td><StatusBadge status={s.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(s.updatedAt), 'dd MMM yyyy, HH:mm')}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(s.createdAt), 'dd MMM yyyy')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {s.status === 'DRAFT' && <Link to={`/submissions/${s.id}/edit`} className="btn btn-secondary btn-sm"><Edit size={12} /> Continue</Link>}
                        <Link to={`/submissions/${s.id}`} className="btn btn-secondary btn-sm"><Eye size={12} /> View</Link>
                        {s.referenceNumber && <button className="btn btn-secondary btn-sm" onClick={() => downloadPDF(s.id, s.referenceNumber!)}><Download size={12} /> PDF</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
