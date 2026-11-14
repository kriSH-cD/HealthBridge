import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Stethoscope, 
  Pill, 
  AlertCircle, 
  Check 
} from 'lucide-react';
import { medicinesApi, prescriptionsApi, directoryApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const FREQUENCY_OPTIONS = [
  'Twice daily after meals (ਦਿਨ \'ਚ 2 ਵਾਰ ਰੋਟੀ ਤੋਂ ਬਾਅਦ)',
  'Once daily morning (ਸਵੇਰੇ 1 ਵਾਰ ਖਾਲੀ ਪੇਟ / ਰੋਟੀ ਤੋਂ ਬਾਅਦ)',
  'Thrice daily (ਦਿਨ \'ਚ 3 ਵਾਰ)',
  'Once daily at bedtime (ਰਾਤ ਨੂੰ ਸੌਣ ਵੇਲੇ 1 ਵਾਰ)',
  'As needed for pain/fever (ਲੋੜ ਪੈਣ \'ਤੇ / SOS)',
];

const DOSAGE_PRESETS = [
  '1 tablet',
  '1 capsule',
  '5 ml (1 ਚਮਚ)',
  '10 ml (2 ਚਮਚ)',
  '2 drops',
  '1 puff',
];

export const WritePrescriptionModal = ({ 
  patient, 
  appointmentId, 
  onClose, 
  onCreated 
}) => {
  const { t } = useLanguage();

  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(patient?.patient_profile?.id || patient?.id || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [generalInstructions, setGeneralInstructions] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Dynamic medicine items
  const [items, setItems] = useState([
    {
      medicine_id: '',
      dosage: '1 tablet',
      frequency: FREQUENCY_OPTIONS[0],
      duration_days: 5,
      quantity_prescribed: 10,
      instructions: 'Take after meals with warm water',
    },
  ]);

  // Load patients if not provided
  useEffect(() => {
    if (!patient) {
      directoryApi.getPatients()
        .then((data) => {
          setPatientsList(data);
          if (data.length > 0 && !selectedPatientId) {
            setSelectedPatientId(data[0].patient_profile?.id || data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [patient]);

  // Load medicine catalog
  useEffect(() => {
    setLoadingCatalog(true);
    medicinesApi.catalog()
      .then((data) => setCatalog(data))
      .catch(() => {})
      .finally(() => setLoadingCatalog(false));
  }, []);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        medicine_id: catalog[0]?.id || '',
        dosage: '1 tablet',
        frequency: FREQUENCY_OPTIONS[0],
        duration_days: 5,
        quantity_prescribed: 10,
        instructions: '',
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      
      // Auto-update quantity based on days and frequency
      if (field === 'duration_days' || field === 'frequency') {
        const days = Number(field === 'duration_days' ? value : copy[index].duration_days) || 5;
        const freqText = field === 'frequency' ? value : copy[index].frequency;
        let perDay = 1;
        if (freqText.includes('Twice') || freqText.includes('2 ਵਾਰ')) perDay = 2;
        else if (freqText.includes('Thrice') || freqText.includes('3 ਵਾਰ')) perDay = 3;
        copy[index].quantity_prescribed = days * perDay;
      }
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const patId = Number(selectedPatientId);
    if (!patId) {
      setError('Please select a patient (ਮਰੀਜ਼ ਚੁਣੋ)');
      return;
    }

    if (!diagnosis.trim()) {
      setError('Please specify diagnosis (ਬਿਮਾਰੀ ਜਾਂ ਲੱਛਣ ਦਰਜ ਕਰੋ)');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].medicine_id) {
        setError(`Please select a medicine for item #${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        patient_id: patId,
        appointment_id: appointmentId ? Number(appointmentId) : undefined,
        diagnosis: diagnosis.trim(),
        instructions: generalInstructions.trim() || undefined,
        items: items.map((it) => ({
          medicine_id: Number(it.medicine_id),
          dosage: it.dosage,
          frequency: it.frequency,
          duration_days: Number(it.duration_days) || 5,
          quantity_prescribed: Number(it.quantity_prescribed) || 10,
          instructions: it.instructions?.trim() || undefined,
        })),
      };

      const res = await prescriptionsApi.create(payload);
      if (onCreated) onCreated(res);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900">{t('write_prescription')} (e-Prescription)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Patient Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ਮਰੀਜ਼ ਚੁਣੋ (Select Patient) <span className="text-red-500">*</span>
            </label>
            {patient ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{patient.full_name || patient.patient_name}</p>
                  <p className="text-slate-500">
                    {patient.village || 'Nabha'} • {patient.phone ? `+91 ${patient.phone}` : ''}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  ID: #{patient.patient_profile?.id || patient.id}
                </span>
              </div>
            ) : (
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">-- ਮਰੀਜ਼ ਚੁਣੋ --</option>
                {patientsList.map((p) => (
                  <option key={p.id} value={p.patient_profile?.id || p.id}>
                    {p.full_name} ({p.village || 'Nabha'}) - +91 {p.phone}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ਬਿਮਾਰੀ / ਜਾਂਚ (Clinical Diagnosis) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Acute Viral Bronchitis / Fever with body aches / Hypertension"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Medicines List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <Pill className="w-4 h-4 text-emerald-600" />
                <span>ਦਵਾਈਆਂ (Prescribed Medicines)</span>
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center space-x-1 text-xs text-emerald-700 font-bold hover:text-emerald-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ਹੋਰ ਦਵਾਈ ਜੋੜੋ (Add Medicine)</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">ਦਵਾਈ #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Medicine Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                        ਦਵਾਈ ਦਾ ਨਾਮ (Catalog)
                      </label>
                      <select
                        value={item.medicine_id}
                        onChange={(e) => handleItemChange(idx, 'medicine_id', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="">-- ਦਵਾਈ ਚੁਣੋ --</option>
                        {catalog.map((med) => (
                          <option key={med.id} value={med.id}>
                            {med.name} ({med.strength}) - ₹{med.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                        ਖ਼ੁਰਾਕ (Dosage)
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                          placeholder="e.g. 1 tablet"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                          required
                        />
                        <select
                          onChange={(e) => e.target.value && handleItemChange(idx, 'dosage', e.target.value)}
                          className="bg-slate-100 border border-slate-300 rounded-lg px-1.5 text-[11px] text-slate-600"
                        >
                          <option value="">Presets</option>
                          {DOSAGE_PRESETS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Frequency, Duration, Quantity */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                        ਕਦੋਂ ਲੈਣੀ ਹੈ (Frequency)
                      </label>
                      <select
                        value={item.frequency}
                        onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                      >
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                        ਦਿਨ (Duration)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={item.duration_days}
                        onChange={(e) => handleItemChange(idx, 'duration_days', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                        ਕੁੱਲ ਗਿਣਤੀ (Total Qty)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={item.quantity_prescribed}
                        onChange={(e) => handleItemChange(idx, 'quantity_prescribed', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  {/* Item Instruction */}
                  <div>
                    <input
                      type="text"
                      value={item.instructions}
                      onChange={(e) => handleItemChange(idx, 'instructions', e.target.value)}
                      placeholder="ਵਿਸ਼ੇਸ਼ ਹਦਾਇਤ (e.g. ਕੋਸੇ ਪਾਣੀ ਨਾਲ / ਖਾਣੇ ਤੋਂ ਪਹਿਲਾਂ)"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-[11px] text-slate-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Advice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ਡਾਕਟਰ ਦੀ ਸਲਾਹ / ਪਰਹੇਜ਼ (General Advice & Dietary Instructions)
            </label>
            <textarea
              rows="2"
              value={generalInstructions}
              onChange={(e) => setGeneralInstructions(e.target.value)}
              placeholder="e.g. Drink warm fluids, avoid cold drinks and dust, rest for 3 days."
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              ਰੱਦ ਕਰੋ (Cancel)
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'ਜਾਰੀ ਹੋ ਰਿਹਾ ਹੈ...' : 'ਪਰਚੀ ਜਾਰੀ ਕਰੋ (Issue e-Prescription)'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
