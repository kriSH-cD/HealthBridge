import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { clinicalApi } from '../services/api';

const VITAL_LABELS = { bp: 'BP', pulse: 'Pulse', temp_c: 'Temp °C', spo2: 'SpO₂ %', weight_kg: 'Weight kg' };
const clean = (name) => name?.replace(' [DEMO DATA]', '');

const Prescription = ({ rx }) => (
  <li className="py-4">
    <div className="flex items-baseline justify-between gap-3">
      <p className="text-sm font-semibold text-slate-900">℞ {rx.diagnosis || 'Prescription'}</p>
      <p className="text-xs text-slate-500 tabular-nums shrink-0">{rx.issue_date}</p>
    </div>
    <p className="text-xs text-slate-500">
      {clean(rx.doctor_name)}
      {rx.valid_until && <> · valid till <span className="tabular-nums">{rx.valid_until}</span></>}
      {rx.is_dispensed && <> · dispensed</>}
    </p>
    <ul className="mt-2 space-y-1">
      {rx.items.map((it, i) => (
        <li key={i} className="text-xs text-slate-700 flex flex-wrap gap-x-2">
          <span className="font-semibold text-slate-900">{it.medicine_name} {it.strength}</span>
          <span className="tabular-nums">{it.dosage} · {it.frequency} · {it.duration_days} days · qty {it.quantity_prescribed}</span>
          {it.instructions && <span className="text-slate-500">({it.instructions})</span>}
        </li>
      ))}
    </ul>
    {rx.instructions && <p className="text-xs text-slate-600 mt-1.5">{rx.instructions}</p>}
  </li>
);

const VisitNote = ({ r }) => (
  <li className="py-4">
    <div className="flex items-baseline justify-between gap-3">
      <p className="text-sm font-semibold text-slate-900">{r.diagnosis || r.title}</p>
      <p className="text-xs text-slate-500 tabular-nums shrink-0">{r.record_date}</p>
    </div>
    <p className="text-xs text-slate-500">
      {r.title}{r.doctor_name && <> · {clean(r.doctor_name)}</>}{r.is_confidential && <> · confidential</>}
    </p>
    {r.vitals && (
      <dl className="mt-2 flex flex-wrap gap-1.5">
        {Object.entries(r.vitals).map(([k, v]) => (
          <div key={k} className="text-[11px] bg-slate-100 rounded px-1.5 py-0.5 tabular-nums">
            <dt className="inline text-slate-500">{VITAL_LABELS[k] ?? k} </dt>
            <dd className="inline font-semibold text-slate-800">{v}</dd>
          </div>
        ))}
      </dl>
    )}
    {r.clinical_notes && <p className="text-xs text-slate-600 mt-1.5">{r.clinical_notes}</p>}
  </li>
);

/** Patient's own prescriptions and visit notes. */
export const HealthHistory = () => {
  const [tab, setTab] = useState('prescriptions');
  const [data, setData] = useState({ prescriptions: [], records: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([clinicalApi.prescriptions(), clinicalApi.records()])
      .then(([prescriptions, records]) => setData({ prescriptions, records }))
      .catch(() => setError('ਰਿਕਾਰਡ ਲੋਡ ਨਹੀਂ ਹੋਏ (Could not load your history)'))
      .finally(() => setLoading(false));
  }, []);

  const tabs = [['prescriptions', `ਪਰਚੀਆਂ · Prescriptions (${data.prescriptions.length})`], ['records', `ਰਿਕਾਰਡ · Visit notes (${data.records.length})`]];
  const list = data[tab];

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <FileText className="w-4 h-4 text-emerald-600" aria-hidden="true" />
        <span>ਸਿਹਤ ਰਿਕਾਰਡ (Health history)</span>
      </h3>

      <div role="tablist" aria-label="Health history" className="mt-3 inline-flex rounded-lg bg-slate-100 p-1 gap-1">
        {tabs.map(([key, name]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {name}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="text-xs text-red-600 mt-3">{error}</p>}
      {loading ? (
        <p className="text-xs text-slate-400 py-4">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-xs text-slate-500 py-4">
          {tab === 'prescriptions' ? 'ਅਜੇ ਕੋਈ ਪਰਚੀ ਨਹੀਂ (No prescriptions yet)' : 'ਅਜੇ ਕੋਈ ਰਿਕਾਰਡ ਨਹੀਂ (No visit notes yet)'}
        </p>
      ) : (
        <ul role="tabpanel" className="divide-y divide-slate-100">
          {tab === 'prescriptions'
            ? list.map((rx) => <Prescription key={rx.id} rx={rx} />)
            : list.map((r) => <VisitNote key={r.id} r={r} />)}
        </ul>
      )}
    </section>
  );
};
