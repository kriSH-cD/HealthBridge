import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { clinicalApi } from '../services/api';

const FREQUENCIES = ['1-0-1', '1-0-0', '0-0-1', '0-1-0', '1-1-1', 'SOS'];
// "1-0-1" -> 2 doses a day; SOS counted as 1 so quantity has a sane default.
const perDay = (f) => (f === 'SOS' ? 1 : f.split('-').reduce((n, x) => n + Number(x), 0));

const VITALS = [
  ['bp', 'BP', 'text', '120/80'],
  ['pulse', 'Pulse', 'number', '72'],
  ['temp_c', 'Temp °C', 'number', '37.0'],
  ['spo2', 'SpO₂ %', 'number', '98'],
];

const field = 'w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white';
const label = 'block text-xs font-semibold text-slate-700 space-y-1';

/** Doctor closes a visit: note (+ optional vitals) and prescription, saved together. */
export const CompleteVisitForm = ({ appointment, onDone, onCancel }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [vitals, setVitals] = useState({});
  const [confidential, setConfidential] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const searchMedicines = async (q) => {
    setQuery(q);
    setMatches(q.trim().length >= 2 ? await clinicalApi.catalogue(q.trim()).catch(() => []) : []);
  };

  const addItem = (m) => {
    setItems((prev) => [...prev, { medicine: m, dosage: m.strength, frequency: '1-0-1', duration_days: 5, quantity_prescribed: 10 }]);
    setQuery('');
    setMatches([]);
  };

  const updateItem = (i, patch) => setItems((prev) => prev.map((it, j) => {
    if (j !== i) return it;
    const next = { ...it, ...patch };
    if ('frequency' in patch || 'duration_days' in patch) next.quantity_prescribed = perDay(next.frequency) * (Number(next.duration_days) || 1);
    return next;
  }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const filledVitals = Object.fromEntries(Object.entries(vitals)
      .filter(([, v]) => v !== '')
      .map(([k, v]) => [k, k === 'bp' ? v : Number(v)]));
    try {
      const result = await clinicalApi.completeVisit(appointment.id, {
        diagnosis,
        clinical_notes: notes || null,
        vitals: Object.keys(filledVitals).length ? filledVitals : null,
        is_confidential: confidential,
        prescription: items.length ? {
          instructions: instructions || null,
          items: items.map(({ medicine, ...rest }) => ({
            ...rest,
            medicine_id: medicine.id,
            duration_days: Number(rest.duration_days),
            quantity_prescribed: Number(rest.quantity_prescribed),
          })),
        } : null,
      });
      onDone(result);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Could not save — check the fields');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-4 text-left">
      <p className="text-sm font-bold text-slate-900">
        ਮੁਲਾਕਾਤ ਪੂਰੀ ਕਰੋ (Complete visit) · {appointment.patient_name.replace(' [DEMO DATA]', '')}
      </p>

      <label className={label}>
        <span>ਨਿਦਾਨ (Diagnosis)</span>
        <input required maxLength={5000} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className={field} />
      </label>

      <fieldset>
        <legend className="text-xs font-semibold text-slate-700 mb-1">Vitals (optional)</legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VITALS.map(([key, name, type, placeholder]) => (
            <label key={key} className="block text-[11px] font-medium text-slate-600 space-y-0.5">
              <span>{name}</span>
              <input
                type={type}
                step="any"
                placeholder={placeholder}
                value={vitals[key] ?? ''}
                onChange={(e) => setVitals((v) => ({ ...v, [key]: e.target.value }))}
                className={`${field} tabular-nums`}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <label className={label}>
        <span>ਨੋਟ (Clinical notes)</span>
        <textarea rows={2} maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)} className={field} />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold text-slate-700">ਦਵਾਈਆਂ (Prescription, optional)</legend>

        {items.map((it, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-2.5 grid grid-cols-2 sm:grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr_auto] gap-2 items-end">
            <p className="col-span-2 sm:col-span-1 text-sm font-semibold text-slate-900 self-center">
              {it.medicine.name} <span className="font-normal text-slate-500">{it.medicine.strength}</span>
            </p>
            <label className="block text-[11px] font-medium text-slate-600 space-y-0.5">
              <span>Dose</span>
              <input required maxLength={50} value={it.dosage} onChange={(e) => updateItem(i, { dosage: e.target.value })} className={field} />
            </label>
            <label className="block text-[11px] font-medium text-slate-600 space-y-0.5">
              <span>Frequency</span>
              <select value={it.frequency} onChange={(e) => updateItem(i, { frequency: e.target.value })} className={field}>
                {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
              </select>
            </label>
            <label className="block text-[11px] font-medium text-slate-600 space-y-0.5">
              <span>Days</span>
              <input required type="number" min={1} max={365} value={it.duration_days} onChange={(e) => updateItem(i, { duration_days: e.target.value })} className={`${field} tabular-nums`} />
            </label>
            <label className="block text-[11px] font-medium text-slate-600 space-y-0.5">
              <span>Qty</span>
              <input required type="number" min={1} max={1000} value={it.quantity_prescribed} onChange={(e) => updateItem(i, { quantity_prescribed: e.target.value })} className={`${field} tabular-nums`} />
            </label>
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
              className="min-h-10 px-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label={`Remove ${it.medicine.name}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ))}

        <label className="block text-[11px] font-medium text-slate-600 space-y-0.5">
          <span>Add medicine</span>
          <input
            type="search"
            value={query}
            onChange={(e) => searchMedicines(e.target.value)}
            placeholder="Search catalogue…"
            className={field}
          />
        </label>
        {matches.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Matching medicines">
            {matches.slice(0, 6).map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => addItem(m)}
                  className="flex items-center gap-1 border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  {m.name} {m.strength}
                </button>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <label className={label}>
            <span>Instructions for patient</span>
            <input maxLength={2000} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="After food, plenty of water" className={field} />
          </label>
        )}
      </fieldset>

      <label className="flex items-center gap-2 text-xs text-slate-700">
        <input type="checkbox" checked={confidential} onChange={(e) => setConfidential(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
        <span>Confidential — only this patient and I can see the note</span>
      </label>

      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-60 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-[background-color,transform]">
          {saving ? '…' : 'Save & complete'}
        </button>
        <button type="button" onClick={onCancel} className="border border-slate-300 hover:bg-slate-50 font-semibold text-xs py-2 px-4 rounded-xl transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
};
