import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { AuditLog } from '../../types';
import { format } from 'date-fns';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/audit-logs?page=${page}&limit=50`)
      .then(({ data }) => { setLogs(data.data.logs); setTotal(data.data.total); })
      .finally(() => setLoading(false));
  }, [page]);

  const actionColor: Record<string, string> = {
    USER_REGISTERED: 'var(--success)', USER_LOGIN: 'var(--info)', USER_LOGOUT: '#64748b',
    SUBMISSION_CREATED: 'var(--info)', SUBMISSION_SUBMITTED: 'var(--navy)',
    STATUS_CHANGED: 'var(--warning)', ADMIN_LOGIN: '#7c3aed', ADMIN_VIEWED_SUBMISSION: '#64748b',
    ATTACHMENT_UPLOADED: 'var(--cyan)', ATTACHMENT_DELETED: 'var(--danger)',
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Audit Logs</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{total} total entries</p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}><span className="spinner spinner-lg" style={{ display: 'block', margin: '0 auto' }} /></div>
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead><tr><th>Time</th><th>Action</th><th>User</th><th>Reference</th><th>Description</th><th>IP</th></tr></thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{format(new Date(l.createdAt), 'dd MMM yyyy HH:mm:ss')}</td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: actionColor[l.action] ?? 'var(--text-muted)', background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>
                          {l.action}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {l.user ? <><div style={{ fontWeight: 500 }}>{l.user.name}</div><div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{l.user.email}</div></> : '—'}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{l.submission?.referenceNumber ?? '—'}</td>
                      <td style={{ fontSize: 12, maxWidth: 280 }}>{l.description}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{l.ipAddress ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Page {page} · {total} entries</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
                <button className="btn btn-secondary btn-sm" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
