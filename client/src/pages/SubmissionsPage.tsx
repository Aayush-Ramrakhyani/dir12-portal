import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import type { Submission } from '../types';
import { Plus, Eye, Edit, Download, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function SubmissionsPage() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/submissions')
      .then(({ data }) => setSubmissions(data.data))
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleNew = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/submissions');
      navigate(`/submissions/${data.data.id}/edit`);
    } catch (e) { toast.error(getErrorMessage(e)); setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this draft?')) return;
    try {
      await api.delete(`/submissions/${id}`);
      toast.success('Draft deleted');
      load();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const downloadPDF = async (id: string, refNo: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const r = await fetch(`/api/submissions/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `DEMO_DIR12_${refNo}.pdf`; a.click();
    } catch { toast.error('PDF download failed'); }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>My Submissions</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>All DIR-12 filings — drafts and submitted</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew} disabled={creating}>
          {creating ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Creating...</> : <><Plus size={15} /> New Filing</>}
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}><span className="spinner spinner-lg" style={{ display: 'block', margin: '0 auto' }} /></div>
        ) : submissions.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={44} style={{ color: 'var(--border-strong)', display: 'block', margin: '0 auto 14px' }} />
            <p style={{ marginBottom: 16 }}>No submissions yet.</p>
            <button className="btn btn-primary" onClick={handleNew}><Plus size={15} /> Create First Filing</button>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr><th>Reference No.</th><th>Company / CIN</th><th>Status</th><th>Step</th><th>Updated</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.referenceNumber ?? <span style={{ color: 'var(--text-muted)' }}>Draft</span>}</td>
                    <td>
                      {s.company
                        ? <><div style={{ fontWeight: 500, fontSize: 13 }}>{s.company.companyName}</div><div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.company.cin}</div></>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td><StatusBadge status={s.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>Step {s.currentStep} / 7</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(s.updatedAt), 'dd MMM yyyy, HH:mm')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {s.status === 'DRAFT' && <Link to={`/submissions/${s.id}/edit`} className="btn btn-secondary btn-sm"><Edit size={12} /> Continue</Link>}
                        <Link to={`/submissions/${s.id}`} className="btn btn-secondary btn-sm"><Eye size={12} /> View</Link>
                        {s.referenceNumber && <button className="btn btn-secondary btn-sm" onClick={() => downloadPDF(s.id, s.referenceNumber!)}><Download size={12} /> PDF</button>}
                        {s.status === 'DRAFT' && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}><Trash2 size={12} /></button>}
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
