import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { CheckCircle, Download, Eye, LayoutDashboard } from 'lucide-react';

export default function SuccessPage() {
  const { id } = useParams<{ id: string }>();
  const [refNo, setRefNo] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/submissions/${id}/status`).then(({ data }) => setRefNo(data.data.referenceNumber ?? ''));
  }, [id]);

  const downloadPDF = async () => {
    const token = localStorage.getItem('accessToken');
    const r = await fetch(`/api/submissions/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `DEMO_DIR12_${refNo}.pdf`; a.click();
  };

  return (
    <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
      <div className="success-icon"><CheckCircle size={36} /></div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Filing Submitted!</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Your demo DIR-12 filing has been submitted successfully.</p>

      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Reference Number</div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'monospace', color: 'var(--navy)', marginBottom: 8 }}>{refNo || '—'}</div>
        <div className="alert alert-warning" style={{ textAlign: 'left', fontSize: 12 }}>
          This is a DEMO reference number only. It is not an official MCA SRN and has no legal standing.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={downloadPDF}><Download size={15} /> Download Demo PDF</button>
        <Link to={`/submissions/${id}`} className="btn btn-secondary"><Eye size={15} /> View Submission</Link>
        <Link to="/dashboard" className="btn btn-secondary"><LayoutDashboard size={15} /> Dashboard</Link>
      </div>
    </div>
  );
}
