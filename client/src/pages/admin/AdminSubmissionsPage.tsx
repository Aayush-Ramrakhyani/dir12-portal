import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import type { Submission, SubmissionStatus } from '../../types';
import { Eye, Search } from 'lucide-react';
import { format } from 'date-fns';

const STATUSES: SubmissionStatus[] = ['DRAFT','SUBMITTED','UNDER_REVIEW','QUERY_RAISED','RESUBMITTED','APPROVED','REJECTED'];

export default function AdminSubmissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState<(Submission & { user?: { name: string; email: string }; _count?: { directors: number; attachments: number } })[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const status = searchParams.get('status') ?? '';

  const load = (s = search, st = status) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (s) params.set('search', s);
    if (st) params.set('status', st);
    api.get(`/admin/submissions?${params}`)
      .then(({ data }) => { setSubmissions(data.data.submissions); setTotal(data.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(search, status); };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>All Submissions</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{total} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-control" placeholder="Reference no, CIN, company, email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
          </div>
          <select className="form-control" style={{ width: 160 }} value={status} onChange={e => setSearchParams(e.target.value ? { status: e.target.value } : {})}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <button className="btn btn-primary" type="submit"><Search size={13} /> Search</button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><span className="spinner spinner-lg" style={{ display: 'block', margin: '0 auto' }} /></div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead><tr><th>Reference No.</th><th>Company</th><th>User</th><th>Status</th><th>Directors</th><th>Submitted</th><th>Actions</th></tr></thead>
              <tbody>
                {submissions.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.referenceNumber ?? <span style={{ color: 'var(--text-muted)' }}>Draft</span>}</td>
                    <td>
                      {s.company
                        ? <><div style={{ fontWeight: 500, fontSize: 13 }}>{s.company.companyName}</div><div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.company.cin}</div></>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{s.user?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.user?.email}</div>
                    </td>
                    <td><StatusBadge status={s.status} /></td>
                    <td style={{ fontSize: 12, textAlign: 'center' }}>{s._count?.directors ?? '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.submittedAt ? format(new Date(s.submittedAt), 'dd MMM yyyy') : '—'}</td>
                    <td><Link to={`/admin/submissions/${s.id}`} className="btn btn-secondary btn-sm"><Eye size={12} /> View</Link></td>
                  </tr>
                ))}
                {submissions.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No submissions found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
