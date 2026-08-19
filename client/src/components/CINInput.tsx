import { useState, useRef, useEffect } from 'react';
import { Search, CheckCircle, Loader } from 'lucide-react';
import { useCINLookup } from '../hooks/useCINLookup';

interface CINInputProps {
  value: string;
  onChange: (cin: string, companyName?: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function CINInput({ value, onChange, error, disabled }: CINInputProps) {
  const { suggestions, searching, lookingUp, searchCompanies, lookupCIN, clearSuggestions } = useCINLookup();
  const [showDropdown, setShowDropdown] = useState(false);
  const [verified, setVerified] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-lookup when a full CIN is typed (21 chars)
  const handleCINChange = async (raw: string) => {
    const cin = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 21);
    setVerified(false);
    onChange(cin);

    if (cin.length === 21) {
      const result = await lookupCIN(cin);
      if (result) {
        onChange(cin, result.name);
        setVerified(true);
      }
    }
  };

  // Company name search
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    searchCompanies(q);
    setShowDropdown(true);
  };

  const handleSelect = (cin: string, name: string) => {
    onChange(cin, name);
    setVerified(true);
    setSearchMode(false);
    setSearchQuery('');
    clearSuggestions();
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Toggle between CIN entry and name search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <button
          type="button"
          className={`btn btn-sm ${!searchMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setSearchMode(false); setShowDropdown(false); }}
        >
          Enter CIN
        </button>
        <button
          type="button"
          className={`btn btn-sm ${searchMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setSearchMode(true); setShowDropdown(true); }}
        >
          <Search size={12} /> Search by Name
        </button>
      </div>

      {searchMode ? (
        <div>
          <div style={{ position: 'relative' }}>
            <input
              className="form-control"
              type="text"
              placeholder="Type company name to search MCA records..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              autoFocus
              disabled={disabled}
            />
            {searching && (
              <Loader size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', animation: 'spin 0.6s linear infinite' }} />
            )}
          </div>

          {showDropdown && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
              background: 'var(--surface)', border: '1px solid var(--border-strong)',
              borderRadius: 6, boxShadow: 'var(--shadow-md)', maxHeight: 240, overflowY: 'auto',
              marginTop: 2,
            }}>
              {suggestions.map((s) => (
                <button
                  key={s.cin}
                  type="button"
                  style={{
                    width: '100%', display: 'flex', flexDirection: 'column', gap: 2,
                    padding: '10px 12px', border: 'none', background: 'transparent',
                    cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => handleSelect(s.cin, s.name)}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.cin}</span>
                </button>
              ))}
            </div>
          )}

          {showDropdown && !searching && searchQuery.length >= 2 && suggestions.length === 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
              background: 'var(--surface)', border: '1px solid var(--border-strong)',
              borderRadius: 6, padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)',
              marginTop: 2,
            }}>
              No companies found matching "{searchQuery}"
            </div>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            className={`form-control ${error ? 'error' : ''}`}
            type="text"
            placeholder="e.g. U79120MH2023PTC407821"
            value={value}
            onChange={(e) => handleCINChange(e.target.value)}
            maxLength={21}
            disabled={disabled}
            style={{ paddingRight: 36, fontFamily: 'monospace', letterSpacing: '0.05em' }}
          />
          {lookingUp && (
            <Loader size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', animation: 'spin 0.6s linear infinite' }} />
          )}
          {verified && !lookingUp && (
            <CheckCircle size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--success)' }} />
          )}
        </div>
      )}

      {error && <span className="form-error">{error}</span>}
      <span className="form-hint">
        {searchMode
          ? 'Results fetched live from MCA records via Finanvo'
          : 'CIN will be auto-verified against MCA records when complete (21 characters)'}
      </span>
    </div>
  );
}
