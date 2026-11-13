import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { appointmentsApi } from '../services/api';

const STATUS_STYLE = {
  SCHEDULED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  NO_SHOW: 'bg-amber-50 text-amber-800 border-amber-200',
};

// Status changes each role may make on a SCHEDULED appointment.
const ACTIONS = {
  DOCTOR: [['COMPLETED', 'ਪੂਰੀ (Complete)'], ['NO_SHOW', 'ਨਹੀਂ ਆਏ (No-show)'], ['CANCELLED', 'ਰੱਦ (Cancel)']],
  PATIENT: [['CANCELLED', 'ਰੱਦ ਕਰੋ (Cancel)']],
};

export const AppointmentsPanel = ({ role, refreshKey = 0 }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    appointmentsApi.list()
      .then((data) => { setItems(data); setError(null); })
      .catch(() => setError('ਮੁਲਾਕਾਤਾਂ ਲੋਡ ਨਹੀਂ ਹੋਈਆਂ (Could not load appointments)'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [refreshKey]);

  const changeStatus = async (id, status) => {
    try {
      const updated = await appointmentsApi.setStatus(id, status);
      setItems((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed');
    }
  };

  const otherParty = (a) => (role === 'DOCTOR' ? a.patient_name : a.doctor_name).replace(' [DEMO DATA]', '');

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-4">
        <Calendar className="w-4 h-4 text-emerald-600" />
        <span>ਮੇਰੀਆਂ ਮੁਲਾਕਾਤਾਂ (My Appointments: {items.length})</span>
      </h3>

      {error && <p role="alert" className="text-xs text-red-600 pb-3">{error}</p>}

      {loading ? (
        <p className="text-xs text-slate-400 py-4">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-slate-500 py-4">ਕੋਈ ਮੁਲਾਕਾਤ ਨਹੀਂ (No appointments yet)</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((a) => (
            <li key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-bold text-slate-800">{otherParty(a)}</p>
                <p className="text-slate-500">
                  {a.appointment_date} • {a.appointment_time} • {a.appointment_type === 'TELECONSULTATION' ? 'Video' : 'In person'}
                </p>
                {a.symptom_summary && <p className="text-slate-600 mt-0.5">{a.symptom_summary}</p>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`border font-bold px-2 py-0.5 rounded ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                {a.status === 'SCHEDULED' && (ACTIONS[role] || []).map(([status, label]) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => changeStatus(a.id, status)}
                    className="border border-slate-300 hover:bg-slate-50 font-semibold px-2 py-1 rounded-lg transition"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
