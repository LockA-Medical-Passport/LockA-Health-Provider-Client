import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Spinner } from '../components/Spinner';
import { Badge, statusToBadgeTone } from '../components/Badge';
import { Modal } from '../components/Modal';
import { QrIcon, SearchIcon } from '../components/Icons';
import { createAccessRequest, searchPatients } from '../lib/api';
import { useToast } from '../components/Toast';
import { RECORD_CATEGORY_LABELS } from '../lib/types';
import type { PatientLookupResult, RecordCategory } from '../lib/types';

const ALL_CATEGORIES = Object.keys(RECORD_CATEGORY_LABELS) as RecordCategory[];

export function PatientSearch() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PatientLookupResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [requestTarget, setRequestTarget] = useState<PatientLookupResult | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setSearched(true);
    const found = await searchPatients(query);
    setResults(found);
    setSearching(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Patient Search</h1>
        <p className="text-slate-400 text-sm">
          Find a patient by QR code, passport ID, or approved contact method to initiate an access request.
        </p>
      </div>

      <GlassCard className="p-5 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            className="input-field"
            placeholder="Passport ID, name, or contact method…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary rounded-lg px-5 py-2.5 flex items-center justify-center gap-2 whitespace-nowrap">
            {searching ? <Spinner size={14} /> : <SearchIcon className="w-4 h-4" />}
            Search
          </button>
          <button type="button" className="btn-secondary rounded-lg px-5 py-2.5 flex items-center justify-center gap-2 whitespace-nowrap">
            <QrIcon className="w-4 h-4" />
            Scan QR
          </button>
        </form>
      </GlassCard>

      {searching && (
        <div className="text-center py-10">
          <Spinner size={24} />
        </div>
      )}

      {!searching && searched && results.length === 0 && (
        <GlassCard className="p-8 text-center">
          <p className="text-slate-400 text-sm">No patients matched “{query}”.</p>
        </GlassCard>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-3">
          {results.map((patient) => (
            <GlassCard key={patient.passportId} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-white font-medium">{patient.displayName}</div>
                <div className="text-xs text-slate-500 font-mono">{patient.passportId}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={statusToBadgeTone(patient.passportStatus)}>{patient.passportStatus}</Badge>
                <button
                  onClick={() => setRequestTarget(patient)}
                  disabled={patient.passportStatus !== 'active'}
                  className="btn-primary rounded-lg px-4 py-2 text-sm"
                >
                  Request Access
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {requestTarget && (
        <AccessRequestModal
          patient={requestTarget}
          onClose={() => setRequestTarget(null)}
          onSubmitted={() => {
            toast('success', `Access request sent to ${requestTarget.displayName}`);
            setRequestTarget(null);
          }}
        />
      )}
    </div>
  );
}

function AccessRequestModal({
  patient,
  onClose,
  onSubmitted,
}: {
  patient: PatientLookupResult;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [categories, setCategories] = useState<RecordCategory[]>([]);
  const [duration, setDuration] = useState(30);
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function toggleCategory(cat: RecordCategory) {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (categories.length === 0 || !purpose.trim()) return;
    setSubmitting(true);
    await createAccessRequest({
      patientPassportId: patient.passportId,
      patientDisplayName: patient.displayName,
      requestedCategories: categories,
      durationDays: duration,
      purpose: purpose.trim(),
    });
    setSubmitting(false);
    onSubmitted();
  }

  return (
    <Modal title={`Request Access — ${patient.displayName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Record Categories</label>
          <div className="grid grid-cols-2 gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`tab-btn text-left ${categories.includes(cat) ? 'active' : ''}`}
              >
                {RECORD_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-2 block">Access Duration</label>
          <select
            className="input-field"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-2 block">Purpose Statement</label>
          <textarea
            className="input-field"
            rows={3}
            placeholder="Describe why access is needed…"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || categories.length === 0 || !purpose.trim()}
          className="btn-primary w-full rounded-lg py-2.5 flex items-center justify-center gap-2"
        >
          {submitting && <Spinner size={14} />}
          Send Access Request
        </button>
      </form>
    </Modal>
  );
}
