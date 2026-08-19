import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getErrorMessage } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import MCAFilingHistory from '../../components/MCAFilingHistory';
import type { Submission, SubmissionStatus } from '../../types';
import toast from 'react-hot-toast';
import { ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';

const ALL_STATUSES: SubmissionStatus[] = ['DRAFT','SUBMITTED','UNDER_REVIEW','QUERY_RAISED','RESUBMITTED','APPROVED','REJECTED'];

export default function AdminSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [sub, setSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    api.get(`/admin/submissions/${id}`)
      .then(({ data }) => { setSub(data.data); setNewStatus(data.data.status); })
      .catch(() => toast.error('Could not load submission'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleStatusUpdate = async () => {
    if (!id) return;
    setUpdating(true);
    try {
      await api.put(`/admin/submissions/${id}/status`, { status: newStatus, comment });
      toast.success('Status updated');
      setComment('');
      load();
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setUpdating(false); }
  };

  const downloadPDF = async () => {
    if (!sub?.referenceNumber) return;
    const token = localStorage.getItem('accessToken');
    const r = await fetch(`/api/admin/submissions/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `DEMO_DIR12_${sub.referenceNumber}.pdf`; a.click();
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><span className="spinner spinner-lg" style={{ display: 'block', margin: '0 auto' }} /></div>;
  if (!sub) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Not found.</div>;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link to="/admin/submissions" style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}><ArrowLeft size={13} /> All Submissions</Link>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>{sub.referenceNumber ?? 'Draft'}</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
            <StatusBadge status={sub.status} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Filed by: {(sub as any).user?.name} · {format(new Date(sub.updatedAt), 'dd MMM yyyy, HH:mm')}</span>
          </div>
        </div>
        {sub.referenceNumber && <button className="btn btn-secondary" onClick={downloadPDF}><Download size={14} /> Download PDF</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        <div>
          {/* Company */}
          {sub.company && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><span className="card-title">Company Details</span></div>
              <div className="card-body">
                <div className="info-grid">
                  <div className="info-item"><span className="info-label">CIN</span><span className="info-value" style={{ fontFamily: 'monospace' }}>{sub.company.cin}</span></div>
                  <div className="info-item"><span className="info-label">Company</span><span className="info-value">{sub.company.companyName}</span></div>
                  <div className="info-item"><span className="info-label">State</span><span className="info-value">{sub.company.state}</span></div>
                  <div className="info-item"><span className="info-label">Email</span><span className="info-value">{sub.company.email}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Directors */}
          {sub.directors && sub.directors.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><span className="card-title">Directors ({sub.directors.length})</span></div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead><tr><th>DIN</th><th>Name</th><th>Designation</th><th>Purpose</th><th>Category</th></tr></thead>
                  <tbody>
                    {sub.directors.map(d => (
                      <tr key={d.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{d.din}</td>
                        <td style={{ fontWeight: 500 }}>{d.name}</td>
                        <td style={{ fontSize: 12 }}>{d.designation.replace(/_/g, ' ')}</td>
                        <td style={{ fontSize: 12 }}>{d.purposeOfFiling.replace(/_/g, ' ')}</td>
                        <td style={{ fontSize: 12 }}>{d.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Status history */}
          {sub.statusHistory && sub.statusHistory.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><span className="card-title">Status History</span></div>
              <div className="card-body" style={{ padding: 0 }}>
                {sub.statusHistory.map(h => (
                  <div key={h.id} style={{ display: 'flex', gap: 14, padding: '12px 16px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                    <StatusBadge status={h.newStatus} />
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>by {h.user?.name ?? 'System'} · {format(new Date(h.createdAt), 'dd MMM yyyy, HH:mm')}</div>
                      {h.comment && <div style={{ fontSize: 12, marginTop: 3 }}>{h.comment}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sub.company?.cin && <MCAFilingHistory cin={sub.company.cin} />}
        </div>

        {/* Admin actions panel */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Update Status</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Comment (optional)</label>
                <textarea className="form-control" rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Reason or note..." />
              </div>
              <button className="btn btn-primary w-full" onClick={handleStatusUpdate} disabled={updating || newStatus === sub.status}>
                {updating ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Updating...</> : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
