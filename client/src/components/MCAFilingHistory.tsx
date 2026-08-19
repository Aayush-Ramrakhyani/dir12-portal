import { useEffect, useState } from 'react';
import { useCINLookup } from '../hooks/useCINLookup';
import type { CINFilingDoc } from '../hooks/useCINLookup';
import { FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

function formatFileSize(bytes: string): string {
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return bytes;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MCAFilingHistory({ cin }: { cin: string }) {
  const { getFilings } = useCINLookup();
  const [docs, setDocs] = useState<CINFilingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!cin) return;
    setLoading(true);
    getFilings(cin)
      .then((d) => setDocs(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [cin, getFilings]);

  const visible = expanded ? docs : docs.slice(0, 5);

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header">
        <div>
          <span className="card-title">MCA Filing History</span>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Live data from MCA records · CIN: <span style={{ fontFamily: 'monospace' }}>{cin}</span>
          </div>
        </div>
        {docs.length > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {docs.length} filing{docs.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)' }}>
            <span className="spinner" /> Fetching MCA records...
          </div>
        ) : error ? (
          <div className="alert alert-warning" style={{ margin: 16 }}>
            MCA filing history unavailable — service temporarily unreachable.
          </div>
        ) : docs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No MCA filings found for this CIN.
          </div>
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Form</th>
                    <th>Document</th>
                    <th>Category</th>
                    <th>Year</th>
                    <th>Date of Filing</th>
                    <th>Pages</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((doc) => (
                    <tr key={doc.ref_key}>
                      <td>
                        <span style={{
                          background: 'var(--info-light)', color: 'var(--info)',
                          padding: '2px 7px', borderRadius: 4, fontSize: 11,
                          fontWeight: 600, fontFamily: 'monospace',
                        }}>
                          {doc.formId}
                        </span>
                      </td>
                      <td style={{ maxWidth: 280 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <FileText size={13} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, lineHeight: 1.4 }}>{doc.fileName}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.documentCategory}</td>
                      <td style={{ fontSize: 12 }}>{doc.year}</td>
                      <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{doc.dateOfFiling}</td>
                      <td style={{ fontSize: 12, textAlign: 'center' }}>{doc.numberOfPages}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatFileSize(doc.fileSize)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {docs.length > 5 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setExpanded(!expanded)}
                  style={{ gap: 4 }}
                >
                  {expanded
                    ? <><ChevronUp size={14} /> Show fewer</>
                    : <><ChevronDown size={14} /> Show all {docs.length} filings</>
                  }
                </button>
              </div>
            )}

            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ExternalLink size={11} />
              Data sourced from MCA via Finanvo API · For official records visit mca.gov.in
            </div>
          </>
        )}
      </div>
    </div>
  );
}
