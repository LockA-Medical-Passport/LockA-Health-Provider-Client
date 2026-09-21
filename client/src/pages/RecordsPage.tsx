import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Spinner } from '../components/Spinner';
import { Modal } from '../components/Modal';
import { CloseIcon, RecordsIcon, UploadIcon } from '../components/Icons';
import { listRecords, uploadRecord, viewRecord } from '../lib/api';
import { useToast } from '../components/Toast';
import { formatDate } from '../lib/format';
import { RECORD_CATEGORY_LABELS } from '../lib/types';
import type { MedicalRecord, RecordCategory } from '../lib/types';
import { FieldError } from '../components/FieldError';
import { useFormValidation } from '../hooks/useFormValidation';
import { passportIdError, requiredError } from '../lib/validation';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { canUploadRecords, useCurrentRole } from '../lib/roleContext';

const ALL_CATEGORIES = Object.keys(RECORD_CATEGORY_LABELS) as RecordCategory[];

const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const ACCEPTED_FILE_TYPES_LABEL = 'PDF, PNG, or JPG';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Tab = 'all' | 'add';

export function RecordsPage() {
  const { toast } = useToast();
  const { role } = useCurrentRole();
  const canUpload = canUploadRecords(role);
  const [tab, setTab] = useState<Tab>('all');
  const records = usePaginatedList(listRecords);
  const [detail, setDetail] = useState<MedicalRecord | null>(null);

  async function openRecord(id: string) {
    try {
      const record = await viewRecord(id);
      if (!record) throw new Error('Record not found');
      setDetail(record);
    } catch {
      toast('error', 'Failed to open record. Please try again.');
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Medical Records</h1>
        <p className="text-slate-400 text-sm">View approved records and upload treatment notes, prescriptions, and lab results.</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          All Records
        </button>
        {canUpload && <button className={`tab-btn ${tab === 'add' ? 'active' : ''}`} onClick={() => setTab('add')}>
          Add Record
        </button>}
      </div>

      {(tab === 'all' || !canUpload) && (
        <>
          {records.initialLoading ? (
            <div className="text-center py-10">
              <Spinner size={24} />
            </div>
          ) : records.error && !records.data ? (
            <ErrorState onRetry={records.reload} />
          ) : records.items.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <p className="text-slate-400 text-sm">No records available yet.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {records.items.map((record) => (
                <GlassCard
                  key={record.id}
                  className="p-4 flex items-center justify-between gap-4 flex-wrap cursor-pointer hover:border-blue-500/40"
                  onClick={() => openRecord(record.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <RecordsIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{record.title}</div>
                      <div className="text-xs text-slate-500">
                        {record.patientDisplayName} · {RECORD_CATEGORY_LABELS[record.category]}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 whitespace-nowrap">{formatDate(record.createdAt)}</div>
                </GlassCard>
              ))}
            </div>
          )}
          {records.data && <Pagination {...records} />}
        </>
      )}

      {tab === 'add' && canUpload && (
        <AddRecordForm
          onUploaded={() => {
            toast('success', 'Record uploaded and hash committed on-chain');
            setTab('all');
            records.refresh();
          }}
        />
      )}

      {detail && <RecordDetailModal record={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function AddRecordForm({ onUploaded }: { onUploaded: () => void }) {
  const { toast } = useToast();
  const { role } = useCurrentRole();
  const [patientPassportId, setPatientPassportId] = useState('');
  const [patientDisplayName, setPatientDisplayName] = useState('');
  const [category, setCategory] = useState<RecordCategory>('medical_summary');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const validation = useFormValidation({
    passport: passportIdError(patientPassportId),
    title: requiredError(title, 'Title'),
    file: fileError ?? (file ? null : 'Attach a document'),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!selected) return;
    validation.touch('file');
    setFile(null);
    if (!ACCEPTED_FILE_TYPES.includes(selected.type)) {
      setFileError(`Unsupported file type. Attach a ${ACCEPTED_FILE_TYPES_LABEL} file.`);
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`);
      return;
    }
    setFileError(null);
    setFile(selected);
  }

  function removeFile() {
    validation.touch('file');
    setFile(null);
    setFileError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUploadRecords(role) || !validation.validate() || !file || submitting) return;
    setSubmitting(true);
    try {
      await uploadRecord({
        patientPassportId: patientPassportId.trim(),
        patientDisplayName: patientDisplayName.trim() || patientPassportId.trim(),
        category,
        title: title.trim(),
        notes: notes.trim(),
        file,
      });
      setPatientPassportId('');
      setPatientDisplayName('');
      setTitle('');
      setNotes('');
      setFile(null);
      setFileError(null);
      validation.reset();
      onUploaded();
    } catch {
      toast('error', 'Failed to upload record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassCard className="p-5">
      <form noValidate onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label htmlFor="record-passport" className="text-xs text-slate-400 mb-1.5 block">Patient Passport ID</label>
          <input
            id="record-passport"
            {...validation.fieldProps('passport')}
            className="input-field"
            placeholder="pp_…"
            value={patientPassportId}
            onChange={(e) => setPatientPassportId(e.target.value)}
          />
          <FieldError id={validation.errorId('passport')} error={validation.error('passport')} />
        </div>
        <div>
          <label htmlFor="record-patient-name" className="text-xs text-slate-400 mb-1.5 block">Patient Name</label>
          <input
            id="record-patient-name"
            className="input-field"
            placeholder="Patient display name"
            value={patientDisplayName}
            onChange={(e) => setPatientDisplayName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="record-category" className="text-xs text-slate-400 mb-1.5 block">Record Category</label>
          <select id="record-category" className="input-field" value={category} onChange={(e) => setCategory(e.target.value as RecordCategory)}>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {RECORD_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="record-title" className="text-xs text-slate-400 mb-1.5 block">Title</label>
          <input id="record-title" {...validation.fieldProps('title')} className="input-field" placeholder="e.g. Complete Blood Count Panel" value={title} onChange={(e) => setTitle(e.target.value)} />
          <FieldError id={validation.errorId('title')} error={validation.error('title')} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Document ({ACCEPTED_FILE_TYPES_LABEL}, max {formatFileSize(MAX_FILE_SIZE_BYTES)})</label>
          <label className="btn-secondary rounded-lg px-4 py-2 text-sm inline-flex items-center gap-2 cursor-pointer w-fit">
            <UploadIcon className="w-4 h-4" />
            Choose File
            <input
              {...validation.fieldProps('file')}
              type="file"
              accept={ACCEPTED_FILE_TYPES.join(',')}
              aria-label="Record document attachment"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
          {file && (
            <div className="mt-2 flex items-center justify-between gap-2 text-sm bg-slate-900/40 border border-blue-900/30 rounded-lg px-3 py-2">
              <span className="truncate text-slate-200">{file.name}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
                <button type="button" onClick={removeFile} className="text-slate-400 hover:text-white" aria-label="Remove attachment">
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <FieldError id={validation.errorId('file')} error={validation.error('file')} />
        </div>
        <div>
          <label htmlFor="record-notes" className="text-xs text-slate-400 mb-1.5 block">Notes</label>
          <textarea id="record-notes" className="input-field" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-success rounded-lg px-5 py-2.5 flex items-center gap-2"
        >
          {submitting ? <Spinner size={14} /> : <UploadIcon className="w-4 h-4" />}
          Upload & Commit Hash
        </button>
      </form>
    </GlassCard>
  );
}

function RecordDetailModal({ record, onClose }: { record: MedicalRecord; onClose: () => void }) {
  return (
    <Modal title={record.title} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <Row label="Patient" value={record.patientDisplayName} />
        <Row label="Passport ID" value={record.patientPassportId} mono />
        <Row label="Category" value={RECORD_CATEGORY_LABELS[record.category]} />
        <Row label="Issued By" value={record.issuerName} />
        <Row label="Created" value={formatDate(record.createdAt)} />
        <Row label="Commitment Hash" value={record.commitmentHash} mono />
        {record.attachment && (
          <Row label="Attachment" value={`${record.attachment.fileName} · ${formatFileSize(record.attachment.fileSize)}`} />
        )}
        <div>
          <div className="text-xs text-slate-500 mb-1">Notes</div>
          <p className="text-slate-300">{record.notes}</p>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-right text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
