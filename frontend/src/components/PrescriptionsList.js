import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Plus, 
  Search, 
  Eye, 
  Pill, 
  AlertCircle, 
  ArrowRight, 
  Check 
} from 'lucide-react';
import { prescriptionsApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { PrescriptionModal } from './PrescriptionModal';
import { WritePrescriptionModal } from './WritePrescriptionModal';

export const PrescriptionsList = ({ 
  role = 'PATIENT', 
  refreshKey = 0, 
  onFindMedicines 
}) => {
  const { t } = useLanguage();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, dispensed
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [dispensingId, setDispensingId] = useState(null);
  const [dispenseSuccess, setDispenseSuccess] = useState(null);

  const fetchPrescriptions = () => {
    setLoading(true);
    const params = {};
    if (statusFilter === 'pending') params.status = 'pending';
    if (statusFilter === 'dispensed') params.status = 'dispensed';
    if (searchQuery.trim()) params.search = searchQuery.trim();

    prescriptionsApi.list(params)
      .then((data) => {
        setItems(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'ਪਰਚੀਆਂ ਲੋਡ ਕਰਨ ਵਿੱਚ ਅਸਮਰੱਥ (Failed to load prescriptions)');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [refreshKey, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPrescriptions();
  };

  const handleDispense = async (prescriptionId) => {
    setDispensingId(prescriptionId);
    setDispenseSuccess(null);
    try {
      const res = await prescriptionsApi.dispense(prescriptionId);
      setDispenseSuccess(`Prescription #${res.prescription?.prescription_number || prescriptionId} ${t('dispense_success')}`);
      setItems((prev) =>
        prev.map((it) => (it.id === prescriptionId ? { ...it, is_dispensed: true } : it))
      );
      setTimeout(() => setDispenseSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'ਦਵਾਈ ਦੇਣ ਵਿੱਚ ਸਮੱਸਿਆ ਆਈ (Dispense failed)');
    } finally {
      setDispensingId(null);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">
            {t('prescriptions_title')} ({items.length})
          </h3>
        </div>

        {/* Doctor: Write Prescription Button */}
        {role === 'DOCTOR' && (
          <button
            type="button"
            onClick={() => setIsWriteModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('write_prescription')}</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {dispenseSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{dispenseSuccess}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pharmacy / Admin: Search & Filter Tabs */}
      {['PHARMACY', 'ADMIN', 'HOSPITAL_ADMIN', 'ASHA_WORKER'].includes(role) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ਟੋਕਨ ਨੰਬਰ (RX-NBH...) ਜਾਂ ਮਰੀਜ਼ ਦਾ ਫ਼ੋਨ / ਨਾਮ ਲੱਭੋ..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
            >
              ਖੋਜ (Search)
            </button>
          </form>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ਸਭ (All)
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                statusFilter === 'pending' ? 'bg-white text-amber-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ਬਕਾਇਆ (Pending)
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('dispensed')}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                statusFilter === 'dispensed' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ਦਿੱਤੀਆਂ ਗਈਆਂ (Dispensed)
            </button>
          </div>
        </div>
      )}

      {/* Prescriptions List */}
      {loading ? (
        <p className="text-xs text-slate-400 py-6 text-center">ਪਰਚੀਆਂ ਲੋਡ ਹੋ ਰਹੀਆਂ ਹਨ (Loading prescriptions)…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-600 font-medium">ਕੋਈ ਪਰਚੀ ਉਪਲਬਧ ਨਹੀਂ (No prescriptions found)</p>
          {role === 'DOCTOR' && (
            <button
              type="button"
              onClick={() => setIsWriteModalOpen(true)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              + ਮਰੀਜ਼ ਲਈ ਪਹਿਲੀ ਪਰਚੀ ਲਿਖੋ
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((rx) => (
            <div
              key={rx.id}
              className="border border-slate-200 hover:border-emerald-300 rounded-xl p-4 bg-white transition hover:shadow-sm space-y-3"
            >
              {/* Row 1: Header & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {rx.prescription_number}
                  </span>
                  <span className="text-xs text-slate-500">
                    {rx.issue_date}
                  </span>
                  {rx.is_demo && (
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.2 rounded">
                      Demo
                    </span>
                  )}
                </div>

                <div>
                  {rx.is_dispensed ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{t('dispensed')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{t('pending_dispense')}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Doctor/Patient & Diagnosis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    {role === 'PATIENT' ? t('prescribed_by') : 'ਮਰੀਜ਼ (Patient)'}
                  </span>
                  <p className="font-bold text-slate-800">
                    {role === 'PATIENT' ? rx.doctor_name : rx.patient_name}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {role === 'PATIENT'
                      ? `${rx.doctor_hospital || 'Nabha Health'} • ${rx.doctor_specialization || 'General'}`
                      : `ਪਿੰਡ: ${rx.patient_village || 'Nabha'} • +91 ${rx.patient_phone || '—'}`}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">ਜਾਂਚ (Diagnosis)</span>
                  <p className="font-semibold text-slate-800">{rx.diagnosis}</p>
                  {rx.instructions && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">{rx.instructions}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Medicines pills preview */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-bold mr-1 flex items-center space-x-1">
                  <Pill className="w-3 h-3 text-emerald-600" />
                  <span>ਦਵਾਈਆਂ ({rx.items?.length || 0}):</span>
                </span>
                {(rx.items || []).map((it, i) => (
                  <span
                    key={it.id || i}
                    className="inline-flex items-center text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md"
                  >
                    {it.medicine_name} · <strong className="ml-1 font-mono text-slate-900">{it.quantity_prescribed}</strong>
                  </span>
                ))}
              </div>

              {/* Row 4: Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPrescription(rx)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  <span>{t('view_print')}</span>
                </button>

                <div className="flex items-center space-x-2">
                  {/* Patient: Find in pharmacy button if pending */}
                  {role === 'PATIENT' && !rx.is_dispensed && onFindMedicines && (
                    <button
                      type="button"
                      onClick={() => onFindMedicines(rx.items?.[0]?.generic_name || rx.items?.[0]?.medicine_name)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition"
                    >
                      <span>ਨੇੜਲੀ ਫਾਰਮੇਸੀ 'ਤੇ ਦਵਾਈ ਲੱਭੋ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Pharmacy: Dispense Prescription Button */}
                  {role === 'PHARMACY' && !rx.is_dispensed && (
                    <button
                      type="button"
                      disabled={dispensingId === rx.id}
                      onClick={() => handleDispense(rx.id)}
                      className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{dispensingId === rx.id ? 'ਦਵਾਈ ਦਿੱਤੀ ਜਾ ਰਹੀ ਹੈ...' : t('dispense_medicine')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Prescription Modal */}
      {selectedPrescription && (
        <PrescriptionModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
          onFindMedicines={onFindMedicines}
        />
      )}

      {/* Write Prescription Modal (Doctor) */}
      {isWriteModalOpen && (
        <WritePrescriptionModal
          onClose={() => setIsWriteModalOpen(false)}
          onCreated={(newRx) => {
            setItems((prev) => [newRx, ...prev]);
            setSelectedPrescription(newRx);
          }}
        />
      )}
    </section>
  );
};
