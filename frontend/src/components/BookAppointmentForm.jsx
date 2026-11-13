import React, { useEffect, useState } from 'react';
import { appointmentsApi, directoryApi } from '../services/api';

const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

const field = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

export const BookAppointmentForm = ({ onBooked, onCancel }) => {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    doctor_id: '', appointment_date: today(), appointment_time: TIME_SLOTS[0],
    appointment_type: 'IN_PERSON', symptom_summary: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    directoryApi.getDoctors()
      .then((list) => setDoctors(list.filter((d) => d.doctor_profile?.is_available)))
      .catch(() => setError('ਡਾਕਟਰ ਲੋਡ ਨਹੀਂ ਹੋਏ (Could not load doctors)'));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await appointmentsApi.book({
        ...form,
        doctor_id: Number(form.doctor_id),
        symptom_summary: form.symptom_summary || null,
      });
      onBooked();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-900">ਡਾਕਟਰ ਨਾਲ ਮੁਲਾਕਾਤ ਬੁੱਕ ਕਰੋ (Book Appointment)</h3>

      <label className="block text-xs font-semibold text-slate-700 space-y-1">
        <span>ਡਾਕਟਰ (Doctor)</span>
        <select required value={form.doctor_id} onChange={set('doctor_id')} className={field}>
          <option value="" disabled>— Select —</option>
          {doctors.map((d) => (
            <option key={d.doctor_profile.id} value={d.doctor_profile.id}>
              {d.full_name.replace(' [DEMO DATA]', '')} • {d.doctor_profile.specialization} • {d.village || 'Nabha'}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block text-xs font-semibold text-slate-700 space-y-1">
          <span>ਤਾਰੀਖ (Date)</span>
          <input type="date" required min={today()} value={form.appointment_date} onChange={set('appointment_date')} className={field} />
        </label>
        <label className="block text-xs font-semibold text-slate-700 space-y-1">
          <span>ਸਮਾਂ (Time)</span>
          <select value={form.appointment_time} onChange={set('appointment_time')} className={field}>
            {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-700 space-y-1">
          <span>ਕਿਸਮ (Type)</span>
          <select value={form.appointment_type} onChange={set('appointment_type')} className={field}>
            <option value="IN_PERSON">In person</option>
            <option value="TELECONSULTATION">Video</option>
          </select>
        </label>
      </div>

      <label className="block text-xs font-semibold text-slate-700 space-y-1">
        <span>ਲੱਛਣ (Symptoms, optional)</span>
        <textarea rows={2} maxLength={2000} value={form.symptom_summary} onChange={set('symptom_summary')} className={field} />
      </label>

      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-xs py-2 px-4 rounded-xl transition">
          {submitting ? '…' : 'ਬੁੱਕ ਕਰੋ (Book)'}
        </button>
        <button type="button" onClick={onCancel} className="border border-slate-300 hover:bg-slate-50 font-semibold text-xs py-2 px-4 rounded-xl transition">
          ਰੱਦ (Close)
        </button>
      </div>
    </form>
  );
};
