import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../../services/api';
import type { User } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { UserX, UserCheck } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<(User & { _count?: { submissions: number } })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleStatus = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/toggle-status`);
      toast.success('User status updated');
      load();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Users</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{users.length} registered users</p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}><span className="spinner spinner-lg" style={{ display: 'block', margin: '0 auto' }} /></div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Role</th><th>Status</th><th>Submissions</th><th>Joined</th><th>Last Login</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ fontSize: 13 }}>{u.email}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.mobile}</td>
                    <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                    <td><span className={`badge badge-${u.status.toLowerCase()}`}>{u.status}</span></td>
                    <td style={{ textAlign: 'center', fontSize: 13 }}>{u._count?.submissions ?? 0}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.lastLoginAt ? format(new Date(u.lastLoginAt), 'dd MMM yyyy') : '—'}</td>
                    <td>
                      {u.role !== 'ADMIN' && (
                        <button
                          className={`btn btn-sm ${u.status === 'ACTIVE' ? 'btn-danger' : 'btn-secondary'}`}
                          onClick={() => toggleStatus(u.id)}
                        >
                          {u.status === 'ACTIVE' ? <><UserX size={12} /> Disable</> : <><UserCheck size={12} /> Enable</>}
                        </button>
                      )}
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
