import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import CINInput from '../components/CINInput';
import type { Submission, Director, KMP } from '../types';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, ChevronRight, ChevronLeft, Send } from 'lucide-react';

const STEPS = ['Company Details', 'Director Count', 'Directors', 'KMP', 'Attachments', 'Review & Submit'];
const DESIGNATIONS = ['DIRECTOR','MANAGING_DIRECTOR','ALTERNATE_DIRECTOR','ADDITIONAL_DIRECTOR','CASUAL_VACANCY_DIRECTOR','NOMINEE_DIRECTOR','WHOLE_TIME_DIRECTOR'];
const KMP_DESIGNATIONS = ['MANAGER','COMPANY_SECRETARY','CEO','CFO'];
const CATEGORIES = ['PROMOTER','PROFESSIONAL','INDEPENDENT','SMALL_SHAREHOLDER'];
const DIRECTOR_TYPES = ['CHAIRMAN','EXECUTIVE_DIRECTOR','NON_EXECUTIVE_DIRECTOR'];

function emptyDirector(): Partial<Director> {
  return { purposeOfFiling: 'APPOINTMENT', din: '', name: '', fatherName: '', residentialAddress: '', nationality: 'India', dateOfBirth: '', gender: 'Male', email: '', designation: 'ADDITIONAL_DIRECTOR', appointmentDate: '', category: 'PROMOTER', directorType: 'EXECUTIVE_DIRECTOR', numberOfEntities: 0 };
}

function emptyKMP(): Partial<KMP> {
  return { purposeOfFiling: 'APPOINTMENT', firstName: '', lastName: '', address: '', designation: 'CEO' };
}

export default function NewSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Form state
  const [company, setCompany] = useState({ cin: '', companyName: '', registeredOfficeAddress: '', email: '', state: 'Maharashtra', district: '', city: '', pinCode: '', formLanguage: 'ENGLISH' });
  const [directors, setDirectors] = useState<Partial<Director>[]>([emptyDirector()]);
  const [kmps, setKmps] = useState<Partial<KMP>[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<Array<{ id: string; originalFilename: string; attachmentType: string }>>([]);
  const [confirmed, setConfirmed] = useState(false);

  // Load existing submission
  useEffect(() => {
    if (!id) return;
    api.get(`/submissions/${id}`).then(({ data }) => {
      const s: Submission = data.data;
      setSubmission(s);
      setStep(Math.min(s.currentStep, 6));
      if (s.company) {
        setCompany({ cin: s.company.cin, companyName: s.company.companyName, registeredOfficeAddress: s.company.registeredOfficeAddress, email: s.company.email, state: s.company.state, district: s.company.district, city: s.company.city, pinCode: s.company.pinCode, formLanguage: s.company.formLanguage });
      }
      if (s.directors?.length) setDirectors(s.directors.map(d => ({ ...d, dateOfBirth: d.dateOfBirth ? d.dateOfBirth.slice(0, 10) : '', appointmentDate: d.appointmentDate ? d.appointmentDate.slice(0, 10) : '' })));
      if (s.kmps?.length) setKmps(s.kmps.map(k => ({ ...k, dateOfBirth: k.dateOfBirth ? k.dateOfBirth.slice(0, 10) : '', appointmentOrCessationDate: k.appointmentOrCessationDate ? k.appointmentOrCessationDate.slice(0, 10) : '' })));
      if (s.attachments?.length) setUploadedAttachments(s.attachments.map(a => ({ id: a.id, originalFilename: a.originalFilename, attachmentType: a.attachmentType })));
    }).catch(() => { toast.error('Could not load submission'); navigate('/submissions'); });
  }, [id, navigate]);

  const save = useCallback(async (nextStep?: number) => {
    if (!id) return;
    setSaving(true);
    try {
      await api.put(`/submissions/${id}`, { currentStep: nextStep ?? step, company, directors, kmps });
      setLastSaved(new Date());
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setSaving(false); }
  }, [id, step, company, directors, kmps]);

  // Autosave every 30s
  useEffect(() => {
    if (!id || !submission) return;
    const timer = setInterval(() => save(), 30000);
    return () => clearInterval(timer);
  }, [id, submission, save]);

  const goNext = async () => {
    await save(step + 1);
    setStep(s => Math.min(s + 1, 6));
  };

  const goPrev = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!confirmed) { toast.error('Please confirm the declaration before submitting'); return; }
    setSubmitting(true);
    try {
      await save(8);
      await api.post(`/submissions/${id}/submit`);
      navigate(`/submissions/${id}/success`);
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setSubmitting(false); }
  };

  const uploadFile = async (file: File, type: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('attachmentType', type);
    try {
      const { data } = await api.post(`/submissions/${id}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadedAttachments(a => [...a, { id: data.data.id, originalFilename: data.data.originalFilename, attachmentType: data.data.attachmentType }]);
      toast.success(`${file.name} uploaded`);
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const deleteAttachment = async (attachId: string) => {
    try {
      await api.delete(`/submissions/attachments/${attachId}`);
      setUploadedAttachments(a => a.filter(x => x.id !== attachId));
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  if (!submission) return <div style={{ padding: 60, textAlign: 'center' }}><span className="spinner spinner-lg" style={{ display: 'block', margin: '0 auto' }} /></div>;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>DIR-12 Filing</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => save()} disabled={saving}>
          {saving ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Saving...</> : <><Save size={13} /> Save Draft</>}
        </button>
      </div>

      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((label, i) => (
          <div key={label} className={`step ${step === i + 1 ? 'active' : step > i + 1 ? 'completed' : ''}`}>
            <div className="step-circle">{step > i + 1 ? '✓' : i + 1}</div>
            <div className="step-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          {/* ── STEP 1: Company ──────────────────── */}
          {step === 1 && (
            <div>
              <h3 className="section-heading">Step 1 — Company Details</h3>
              <div className="form-group">
                <label className="form-label">Corporate Identity Number (CIN)<span className="required">*</span></label>
                <CINInput value={company.cin} onChange={(cin, name) => setCompany(c => ({ ...c, cin, ...(name ? { companyName: name } : {}) }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Name of Company<span className="required">*</span></label>
                <input className="form-control" value={company.companyName} onChange={e => setCompany(c => ({ ...c, companyName: e.target.value }))} placeholder="Auto-filled from CIN lookup" />
              </div>
              <div className="form-group">
                <label className="form-label">Registered Office Address<span className="required">*</span></label>
                <textarea className="form-control" value={company.registeredOfficeAddress} onChange={e => setCompany(c => ({ ...c, registeredOfficeAddress: e.target.value }))} rows={3} placeholder="Full registered address" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">State<span className="required">*</span></label>
                  <input className="form-control" value={company.state} onChange={e => setCompany(c => ({ ...c, state: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">District<span className="required">*</span></label>
                  <input className="form-control" value={company.district} onChange={e => setCompany(c => ({ ...c, district: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">City<span className="required">*</span></label>
                  <input className="form-control" value={company.city} onChange={e => setCompany(c => ({ ...c, city: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Pin Code<span className="required">*</span></label>
                  <input className="form-control" value={company.pinCode} onChange={e => setCompany(c => ({ ...c, pinCode: e.target.value }))} maxLength={6} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email ID of Company<span className="required">*</span></label>
                <input className="form-control" type="email" value={company.email} onChange={e => setCompany(c => ({ ...c, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Form Language</label>
                <div className="radio-group">
                  {['ENGLISH', 'HINDI'].map(l => (
                    <label key={l} className="radio-option">
                      <input type="radio" name="lang" value={l} checked={company.formLanguage === l} onChange={() => setCompany(c => ({ ...c, formLanguage: l }))} />
                      {l.charAt(0) + l.slice(1).toLowerCase()}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Count ──────────────────── */}
          {step === 2 && (
            <div>
              <h3 className="section-heading">Step 2 — Number of Directors / KMP</h3>
              <div className="alert alert-info" style={{ marginBottom: 20 }}>
                Set the number of directors and KMP to file. You can adjust these counts before moving to the next step.
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Number of Directors<span className="required">*</span></label>
                  <input className="form-control" type="number" min={1} max={20} value={directors.length}
                    onChange={e => {
                      const n = parseInt(e.target.value) || 1;
                      setDirectors(d => {
                        if (n > d.length) return [...d, ...Array(n - d.length).fill(null).map(emptyDirector)];
                        return d.slice(0, n);
                      });
                    }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Number of KMP (Manager / Secretary / CEO / CFO)</label>
                  <input className="form-control" type="number" min={0} max={10} value={kmps.length}
                    onChange={e => {
                      const n = parseInt(e.target.value) || 0;
                      setKmps(k => {
                        if (n > k.length) return [...k, ...Array(n - k.length).fill(null).map(emptyKMP)];
                        return k.slice(0, n);
                      });
                    }} />
                </div>
              </div>
              <div style={{ marginTop: 12, padding: 14, background: 'var(--bg)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                <strong>{directors.length}</strong> director form(s) · <strong>{kmps.length}</strong> KMP form(s) will be generated in the next steps.
              </div>
            </div>
          )}

          {/* ── STEP 3: Directors ──────────────── */}
          {step === 3 && (
            <div>
              <h3 className="section-heading">Step 3 — Director Details</h3>
              {directors.map((dir, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, color: 'var(--navy)', fontSize: 14 }}>Director {i + 1}</h4>
                    {directors.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => setDirectors(d => d.filter((_, j) => j !== i))}><Trash2 size={12} /> Remove</button>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purpose of Filing<span className="required">*</span></label>
                    <div className="radio-group">
                      {(['APPOINTMENT','CESSATION','CHANGE_IN_DESIGNATION'] as const).map(p => (
                        <label key={p} className="radio-option">
                          <input type="radio" name={`purpose-${i}`} value={p} checked={dir.purposeOfFiling === p} onChange={() => setDirectors(d => d.map((x, j) => j === i ? { ...x, purposeOfFiling: p } : x))} />
                          {p.replace(/_/g, ' ')}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group"><label className="form-label">DIN<span className="required">*</span></label><input className="form-control" value={dir.din ?? ''} onChange={e => setDirectors(d => d.map((x, j) => j === i ? { ...x, din: e.target.value } : x))} placeholder="8-digit DIN" maxLength={8} /></div>
                    <div className="form-group"><label className="form-label">Full Name<span className="required">*</span></label><input className="form-control" value={dir.name ?? ''} onChange={e => setDirectors(d => d.map((x, j) => j === i ? { ...x, name: e.target.value.toUpperCase() } : x))} /></div>
                    <div className="form-group"><label className="form-label">Father's Name<span className="required">*</span></label><input className="form-control" value={dir.fatherName ?? ''} onChange={e => setDirectors(d => d.map((x, j) => j === i ? { ...x, fatherName: e.target.value.toUpperCase() } : x))} /></div>
                    <div className="form-group"><label className="form-label">Nationality<span className="required">*</span></label><input className="form-control" value={dir.nationality ?? 'India'} onChange={e => setDirectors(d => d.map((x, j) => j === i ? { ...x, nationality: e.target.value } : x))} /></div>
                    <div className="form-group"><label className="form-label">Date of Birth<span className="required">*</span></label><input className="form-control" type="date" value={dir.dateOfBirth as string ?? ''} onChange={e => setDirectors(d => d.map((x, j) => j === i ? { ...x, dateOfBirth: e.target.value } : x))} /></div>
                    <div className="form-group">
                      <label className="form-label">Gender<span className="required">*</span></label>
                      <select className="form-control" value={dir.gender ?? 'Male'} onChange={e => setDirectors(d => d.map((x, j) => j === i ? { ...x, gender: e.target.value } : x))}>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Email<span className="required">*</span></label><input className="form-control" type="email" value={dir.email ?? ''} onChange={e => setDirectors(d => d.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} /></div>
                    <div className="form-group">
                      <label className="form-label">Designation<span className="required">*</span></label>
                      <select className="form-control" value={dir.designation ?? 'ADDITIONAL_DIRECTOR'} onChange={e => setDirectors(d => d.map((x, j) => j === i ? { ...x, designation: e.target.value as Director['designation'] } : x))}>
                        {DESIGNATIONS.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Date of Appointment</label><input className="form-control" type="date" value={dir.appointmentDate as string ?? ''} onChange={e => setDirectors(d => d.map((x, j) => j === i ? { ...x, appointmentDate: e.target.value } : x))} /></div>
                    <div className="form-group">
                      <label className="form-label">Category<span className="required">*</span></label>
                      <select className="form-control" value={dir.category ?? 'PROMOTER'} onChange={e => setDirectors(d => d.map((x, j) => j === i ? { ...x, category: e.target.value as Director['category'] } : x))}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Director Type</label>
                      <select className="form-control" value={dir.directorType ?? ''} onChange={e => setDirectors(d => d.map((x, j) => j === i ? { ...x, directorType: e.target.value as Director['directorType'] } : x))}>
                        <option value="">— Select —</option>
                        {DIRECTOR_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">No. of Other Entities</label><input className="form-control" type="number" min={0} value={dir.numberOfEntities ?? 0} onChange={e => setDirectors(d => d.map((x, j) => j === i ? { ...x, numberOfEntities: parseInt(e.target.value) || 0 } : x))} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Residential Address<span className="required">*</span></label><textarea className="form-control" rows={2} value={dir.residentialAddress ?? ''} onChange={e => setDirectors(d => d.map((x, j) => j === i ? { ...x, residentialAddress: e.target.value } : x))} /></div>
                </div>
              ))}
              <button className="btn btn-secondary" onClick={() => setDirectors(d => [...d, emptyDirector()])}><Plus size={14} /> Add Another Director</button>
            </div>
          )}

          {/* ── STEP 4: KMP ───────────────────── */}
          {step === 4 && (
            <div>
              <h3 className="section-heading">Step 4 — Key Managerial Personnel (KMP)</h3>
              {kmps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  <p style={{ marginBottom: 16 }}>No KMP entries. Click below to add.</p>
                  <button className="btn btn-secondary" onClick={() => setKmps([emptyKMP()])}><Plus size={14} /> Add KMP</button>
                </div>
              ) : kmps.map((kmp, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 14, color: 'var(--navy)' }}>KMP {i + 1}</h4>
                    <button className="btn btn-danger btn-sm" onClick={() => setKmps(k => k.filter((_, j) => j !== i))}><Trash2 size={12} /> Remove</button>
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Designation<span className="required">*</span></label>
                      <select className="form-control" value={kmp.designation} onChange={e => setKmps(k => k.map((x, j) => j === i ? { ...x, designation: e.target.value as KMP['designation'] } : x))}>
                        {KMP_DESIGNATIONS.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Purpose of Filing<span className="required">*</span></label>
                      <select className="form-control" value={kmp.purposeOfFiling} onChange={e => setKmps(k => k.map((x, j) => j === i ? { ...x, purposeOfFiling: e.target.value as KMP['purposeOfFiling'] } : x))}>
                        <option value="APPOINTMENT">APPOINTMENT</option><option value="CESSATION">CESSATION</option>
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">First Name<span className="required">*</span></label><input className="form-control" value={kmp.firstName ?? ''} onChange={e => setKmps(k => k.map((x, j) => j === i ? { ...x, firstName: e.target.value.toUpperCase() } : x))} /></div>
                    <div className="form-group"><label className="form-label">Last Name</label><input className="form-control" value={kmp.lastName ?? ''} onChange={e => setKmps(k => k.map((x, j) => j === i ? { ...x, lastName: e.target.value.toUpperCase() } : x))} /></div>
                    <div className="form-group"><label className="form-label">PAN</label><input className="form-control" value={kmp.pan ?? ''} onChange={e => setKmps(k => k.map((x, j) => j === i ? { ...x, pan: e.target.value.toUpperCase() } : x))} maxLength={10} /></div>
                    <div className="form-group"><label className="form-label">Mobile</label><input className="form-control" type="tel" value={kmp.mobile ?? ''} onChange={e => setKmps(k => k.map((x, j) => j === i ? { ...x, mobile: e.target.value } : x))} /></div>
                    <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={kmp.email ?? ''} onChange={e => setKmps(k => k.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} /></div>
                    <div className="form-group"><label className="form-label">Date of Appointment / Cessation</label><input className="form-control" type="date" value={kmp.appointmentOrCessationDate as string ?? ''} onChange={e => setKmps(k => k.map((x, j) => j === i ? { ...x, appointmentOrCessationDate: e.target.value } : x))} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Address<span className="required">*</span></label><textarea className="form-control" rows={2} value={kmp.address ?? ''} onChange={e => setKmps(k => k.map((x, j) => j === i ? { ...x, address: e.target.value } : x))} /></div>
                </div>
              ))}
              {kmps.length > 0 && <button className="btn btn-secondary" onClick={() => setKmps(k => [...k, emptyKMP()])}><Plus size={14} /> Add Another KMP</button>}
            </div>
          )}

          {/* ── STEP 5: Attachments ───────────── */}
          {step === 5 && (
            <div>
              <h3 className="section-heading">Step 5 — Attachments</h3>
              <div className="alert alert-info" style={{ marginBottom: 20 }}>Accepted: PDF, JPG, PNG, DOC, DOCX · Max 10 MB per file</div>
              {[
                { type: 'BOARD_RESOLUTION', label: 'Board/Court/NCLT/Members Resolution' },
                { type: 'RESIGNATION_NOTICE', label: 'Notice of Resignation' },
                { type: 'CESSATION_EVIDENCE', label: 'Evidence of Cessation' },
                { type: 'OPTIONAL', label: 'Optional Attachments' },
              ].map(({ type, label }) => {
                const existing = uploadedAttachments.filter(a => a.attachmentType === type);
                return (
                  <div key={type} style={{ marginBottom: 20, padding: 16, border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--navy)' }}>{label}</div>
                    {existing.map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg)', borderRadius: 6, marginBottom: 6, fontSize: 13 }}>
                        <span>{a.originalFilename}</span>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteAttachment(a.id)}><Trash2 size={12} /></button>
                      </div>
                    ))}
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                      <Plus size={13} /> Upload {label}
                      <input type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => { if (e.target.files?.[0]) { uploadFile(e.target.files[0], type); e.target.value = ''; } }} />
                    </label>
                  </div>
                );
              })}

              {/* DSC Certificates */}
              <div style={{ marginTop: 28 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Digital Signature Certificates (DSC)</h4>
                <div className="alert alert-info" style={{ marginBottom: 16, fontSize: 12 }}>
                  Attach the DSC certificate file (.pfx, .p12, .cer, .crt, .pem) for each director. This is a demo portal — no actual cryptographic signing is performed.
                </div>
                {[
                  ...directors.map((d, i) => ({
                    type: `DSC_CERT_${d.din || i}`,
                    label: `Director ${i + 1}: ${d.name || `DIN ${d.din}`}`,
                    sub: `DIN: ${d.din || '—'}`,
                    required: true,
                  })),
                  { type: 'DSC_CERT_DECLARANT', label: 'Authorized Signatory / Declarant', sub: 'Board-authorized representative', required: true },
                  { type: 'DSC_CERT_PROFESSIONAL', label: 'Certifying Professional (CA / CS / CWA)', sub: 'Practicing professional certification', required: false },
                ].map(({ type, label, sub, required }) => {
                  const attached = uploadedAttachments.filter(a => a.attachmentType === type);
                  const signed = attached.length > 0;
                  return (
                    <div key={type} style={{ marginBottom: 12, padding: '14px 16px', border: `1.5px solid ${signed ? 'var(--success)' : 'var(--border-strong)'}`, borderRadius: 8, background: signed ? 'var(--success-light)' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {signed
                            ? <span style={{ color: 'var(--success)', fontSize: 15 }}>✓</span>
                            : <span style={{ color: required ? 'var(--danger)' : 'var(--text-muted)', fontSize: 15 }}>○</span>}
                          {label}
                          {required && !signed && <span style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 500 }}>REQUIRED</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, marginLeft: 21 }}>{sub}</div>
                        {signed && attached.map(a => (
                          <div key={a.id} style={{ marginTop: 6, marginLeft: 21, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--success)' }}>📎 {a.originalFilename}</span>
                            <button className="btn btn-danger btn-sm" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => deleteAttachment(a.id)}>Remove</button>
                          </div>
                        ))}
                      </div>
                      {!signed && (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--navy)', color: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          + Attach DSC
                          <input type="file" style={{ display: 'none' }} accept=".pfx,.p12,.cer,.crt,.pem,.p7b" onChange={e => { if (e.target.files?.[0]) { uploadFile(e.target.files[0], type); e.target.value = ''; } }} />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 6: Review & Submit ──────── */}
          {step === 6 && (
            <div>
              <h3 className="section-heading">Step 6 — Review & Submit</h3>
              <div className="alert alert-warning" style={{ marginBottom: 20 }}>
                Please review all information carefully. This is a DEMO submission — no official filing will occur.
              </div>

              {/* Company review */}
              <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy)', marginBottom: 10 }}>Company Details</div>
                <div className="info-grid">
                  <div className="info-item"><span className="info-label">CIN</span><span className="info-value">{company.cin || '—'}</span></div>
                  <div className="info-item"><span className="info-label">Company Name</span><span className="info-value">{company.companyName || '—'}</span></div>
                  <div className="info-item"><span className="info-label">State</span><span className="info-value">{company.state}</span></div>
                  <div className="info-item"><span className="info-label">Email</span><span className="info-value">{company.email || '—'}</span></div>
                </div>
              </div>

              {/* Directors review */}
              <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy)', marginBottom: 10 }}>Directors ({directors.length})</div>
                {directors.map((d, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <strong>{d.name || `Director ${i+1}`}</strong> · DIN: {d.din} · {d.designation?.replace(/_/g,' ')} · {d.purposeOfFiling}
                  </div>
                ))}
              </div>

              {/* Attachments review */}
              <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy)', marginBottom: 10 }}>Attachments ({uploadedAttachments.length})</div>
                {uploadedAttachments.length === 0 ? <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No attachments uploaded</span>
                  : uploadedAttachments.map(a => <div key={a.id} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>{a.originalFilename} <span style={{ color: 'var(--text-muted)' }}>({a.attachmentType})</span></div>)}
              </div>

              {/* DSC review */}
              <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy)', marginBottom: 10 }}>DSC Certificates</div>
                {directors.map((d, i) => {
                  const type = `DSC_CERT_${d.din || i}`;
                  const attached = uploadedAttachments.some(a => a.attachmentType === type);
                  return (
                    <div key={type} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{d.name || `Director ${i+1}`} (DIN: {d.din})</span>
                      {attached ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ DSC Attached</span> : <span style={{ color: 'var(--danger)' }}>⚠ Not attached</span>}
                    </div>
                  );
                })}
                {['DSC_CERT_DECLARANT','DSC_CERT_PROFESSIONAL'].map(type => {
                  const attached = uploadedAttachments.some(a => a.attachmentType === type);
                  const label = type === 'DSC_CERT_DECLARANT' ? 'Authorized Signatory' : 'Certifying Professional';
                  return (
                    <div key={type} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{label}</span>
                      {attached ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ DSC Attached</span> : <span style={{ color: 'var(--text-muted)' }}>Not attached</span>}
                    </div>
                  );
                })}
              </div>

              {/* Declaration */}
              <div style={{ padding: 16, border: '2px solid var(--border-strong)', borderRadius: 8, marginBottom: 20 }}>
                <label className="checkbox-group" style={{ alignItems: 'flex-start', gap: 10 }}>
                  <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ marginTop: 2 }} />
                  <span style={{ fontSize: 13 }}>I confirm that all the information entered in this <strong>DEMO development system</strong> is accurate and complete to the best of my knowledge. I understand this is not an official government filing and no legal effect is created.</span>
                </label>
              </div>

              <button className="btn btn-primary btn-lg w-full" onClick={handleSubmit} disabled={submitting || !confirmed}>
                {submitting ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Submitting...</> : <><Send size={16} /> Submit Demo Filing</>}
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={goPrev} disabled={step === 1}><ChevronLeft size={15} /> Previous</button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Step {step} of {STEPS.length}</span>
          {step < 6 && <button className="btn btn-primary" onClick={goNext}>{saving ? 'Saving...' : 'Next'} <ChevronRight size={15} /></button>}
          {step === 6 && <span />}
        </div>
      </div>
    </div>
  );
}
