import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import MCAFilingHistory from '../components/MCAFilingHistory';
import type { Submission } from '../types';
import { Edit, Download, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function SubmissionViewPage() {
  const { id } = useParams<{ id: string }>();
  const [sub, setSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/submissions/${id}`)
      .then(({ data }) => setSub(data.data))
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const downloadPDF = async () => {
    if (!sub?.referenceNumber) return;
    const token = localStorage.getItem('accessToken');
    const r = await fetch(`/api/submissions/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `DEMO_DIR12_${sub.referenceNumber}.pdf`; a.click();
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><span className="spinner spinner-lg" style={{ display: 'block', margin: '0 auto' }} /></div>;
  if (!sub) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Submission not found.</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Breadcrumb / header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link to="/submissions" style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}><ArrowLeft size={13} /> Back to Submissions</Link>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>
            {sub.referenceNumber ?? 'Draft Submission'}
          </h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <StatusBadge status={sub.status} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Updated {format(new Date(sub.updatedAt), 'dd MMM yyyy, HH:mm')}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {sub.status === 'DRAFT' && <Link to={`/submissions/${id}/edit`} className="btn btn-primary"><Edit size={14} /> Continue Filing</Link>}
          {sub.referenceNumber && <button className="btn btn-secondary" onClick={downloadPDF}><Download size={14} /> Download PDF</button>}
        </div>
      </div>

      {/* Reference block */}
      {sub.referenceNumber && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <strong>Demo Reference Number:</strong> {sub.referenceNumber} · Submitted: {sub.submittedAt ? format(new Date(sub.submittedAt), 'dd MMM yyyy, HH:mm') : '—'}
        </div>
      )}

      {/* Company */}
      {sub.company && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Company Details</span></div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item"><span className="info-label">CIN</span><span className="info-value" style={{ fontFamily: 'monospace' }}>{sub.company.cin}</span></div>
              <div className="info-item"><span className="info-label">Company Name</span><span className="info-value">{sub.company.companyName}</span></div>
              <div className="info-item"><span className="info-label">State</span><span className="info-value">{sub.company.state}</span></div>
              <div className="info-item"><span className="info-label">City</span><span className="info-value">{sub.company.city}</span></div>
              <div className="info-item"><span className="info-label">Pin Code</span><span className="info-value">{sub.company.pinCode}</span></div>
              <div className="info-item"><span className="info-label">Email</span><span className="info-value">{sub.company.email}</span></div>
            </div>
            <div style={{ marginTop: 10 }}><span className="info-label">Address</span><div style={{ fontSize: 13, marginTop: 2 }}>{sub.company.registeredOfficeAddress}</div></div>
          </div>
        </div>
      )}

      {/* Directors */}
      {sub.directors && sub.directors.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Directors ({sub.directors.length})</span></div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead><tr><th>DIN</th><th>Name</th><th>Designation</th><th>Purpose</th><th>Appointment</th><th>Category</th></tr></thead>
              <tbody>
                {sub.directors.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{d.din}</td>
                    <td style={{ fontWeight: 500 }}>{d.name}</td>
                    <td style={{ fontSize: 12 }}>{d.designation.replace(/_/g, ' ')}</td>
                    <td><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--info)' }}>{d.purposeOfFiling.replace(/_/g, ' ')}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.appointmentDate ? format(new Date(d.appointmentDate), 'dd MMM yyyy') : '—'}</td>
                    <td style={{ fontSize: 12 }}>{d.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KMP */}
      {sub.kmps && sub.kmps.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">KMP ({sub.kmps.length})</span></div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead><tr><th>Name</th><th>Designation</th><th>PAN</th><th>Purpose</th></tr></thead>
              <tbody>
                {sub.kmps.map(k => (
                  <tr key={k.id}>
                    <td style={{ fontWeight: 500 }}>{k.firstName} {k.lastName}</td>
                    <td style={{ fontSize: 12 }}>{k.designation.replace(/_/g, ' ')}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{k.pan ?? '—'}</td>
                    <td style={{ fontSize: 12 }}>{k.purposeOfFiling}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attachments */}
      {sub.attachments && sub.attachments.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Attachments ({sub.attachments.length})</span></div>
          <div className="card-body">
            {sub.attachments.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span>{a.originalFilename}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{a.attachmentType}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status History */}
      {sub.statusHistory && sub.statusHistory.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Status History</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            {sub.statusHistory.map(h => (
              <div key={h.id} style={{ display: 'flex', gap: 16, padding: '12px 16px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                <StatusBadge status={h.newStatus} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {h.oldStatus && <><StatusBadge status={h.oldStatus} /> → </>}
                    by {h.user?.name ?? 'System'} · {format(new Date(h.createdAt), 'dd MMM yyyy, HH:mm')}
                  </div>
                  {h.comment && <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text)' }}>{h.comment}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MCA Filing History — live from Finanvo */}
      {sub.company?.cin && <MCAFilingHistory cin={sub.company.cin} />}
    </div>
  );
}
