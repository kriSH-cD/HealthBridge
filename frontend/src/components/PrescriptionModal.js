import React from 'react';
import { 
  X, 
  Printer, 
  CheckCircle, 
  Clock, 
  FileText, 
  Stethoscope, 
  User, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  QrCode 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const PrescriptionModal = ({ prescription, onClose, onFindMedicines }) => {
  const { t } = useLanguage();

  if (!prescription) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 print:m-0 print:border-none print:shadow-none">
        
        {/* Modal Top Bar (hidden on print) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900">{t('prescriptions_title')}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ਪ੍ਰਿੰਟ ਕਰੋ (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Prescription Body */}
        <div className="p-8 space-y-6 print:p-4 text-slate-800">
          
          {/* Header */}
          <div className="border-b-2 border-emerald-600 pb-4 flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-lg flex items-center justify-center">
                  ਸ
                </span>
                <div>
                  <h1 className="text-xl font-bold text-emerald-900 leading-tight">ਸਿਹਤ ਸੇਤੂ (SehatSetu)</h1>
                  <p className="text-[11px] text-emerald-700 font-medium">Nabha Rural Telemedicine & Health Network · ਪੰਜਾਬ</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-600">
                <p className="font-bold text-slate-900">{prescription.doctor_name}</p>
                <p>{prescription.doctor_qualification} · {prescription.doctor_specialization}</p>
                <p className="text-slate-500">{prescription.doctor_hospital}</p>
                <p className="text-[11px] font-mono text-emerald-700 mt-0.5">Reg. License: {prescription.doctor_license}</p>
              </div>
            </div>

            {/* Token & QR info */}
            <div className="text-right flex flex-col items-end">
              <div className="bg-slate-100 border border-slate-300 rounded-lg p-2.5 flex items-center space-x-2">
                <QrCode className="w-9 h-9 text-slate-700" />
                <div className="text-left text-[10px]">
                  <span className="text-slate-400 block font-semibold uppercase">e-Rx Token</span>
                  <span className="font-mono font-bold text-slate-800">{prescription.prescription_number}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                ਤਾਰੀਖ (Date): <strong>{prescription.issue_date}</strong>
              </p>
              {prescription.valid_until && (
                <p className="text-[11px] text-slate-400">
                  ਮਿਆਦ (Valid): {prescription.valid_until}
                </p>
              )}
            </div>
          </div>

          {/* Patient Info Strip */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">ਮਰੀਜ਼ ਦਾ ਨਾਮ (Patient)</span>
              <span className="font-bold text-slate-900">{prescription.patient_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">ਉਮਰ / ਲਿੰਗ</span>
              <span className="text-slate-800">
                {[prescription.patient_age != null && `${prescription.patient_age} ਸਾਲ`, prescription.patient_gender].filter(Boolean).join(' • ') || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">ਪਿੰਡ / ਸ਼ਹਿਰ (Village)</span>
              <span className="text-slate-800">{prescription.patient_village || 'Nabha'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">ABHA Health ID</span>
              <span className="font-mono text-emerald-700 font-bold">{prescription.patient_abha_id || 'DEMO-ABHA-NBH'}</span>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="flex items-start space-x-3 text-xs">
            <span className="font-bold text-slate-700 whitespace-nowrap">ਜਾਂਚ (Diagnosis):</span>
            <span className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-lg font-semibold flex-1">
              {prescription.diagnosis}
            </span>
          </div>

          {/* Rx Medicine Table */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black text-emerald-800 font-serif italic">℞</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">ਨਿਰਧਾਰਿਤ ਦਵਾਈਆਂ (Prescribed Medicines)</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">ਦਵਾਈ ਦਾ ਨਾਮ (Medicine)</th>
                    <th className="py-2.5 px-3">ਖ਼ੁਰਾਕ (Dosage)</th>
                    <th className="py-2.5 px-3">ਸਮਾਂ (Frequency)</th>
                    <th className="py-2.5 px-3">ਦਿਨ</th>
                    <th className="py-2.5 px-3 text-right">ਗਿਣਤੀ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(prescription.items || []).map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{it.medicine_name}</p>
                        <p className="text-[11px] text-slate-500">{it.generic_name} {it.strength ? `(${it.strength})` : ''}</p>
                        {it.instructions && (
                          <p className="text-[10px] text-emerald-700 italic mt-0.5">ℹ {it.instructions}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{it.dosage}</td>
                      <td className="py-2.5 px-3 text-slate-700">{it.frequency}</td>
                      <td className="py-2.5 px-3 text-slate-700">{it.duration_days} ਦਿਨ</td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">{it.quantity_prescribed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* General Advice / Instructions */}
          {prescription.instructions && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 text-xs">
              <span className="font-bold text-emerald-900 block mb-1">ਡਾਕਟਰ ਦੀ ਸਲਾਹ / ਪਰਹੇਜ਼ (Advice):</span>
              <p className="text-emerald-800 leading-relaxed">{prescription.instructions}</p>
            </div>
          )}

          {/* Footer Signature & Status */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-xs">
            <div>
              <div className="flex items-center space-x-1.5 mb-1">
                {prescription.is_dispensed ? (
                  <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-100 px-2.5 py-1 rounded-full text-[11px]">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>ਦਵਾਈ ਮਿਲ ਚੁੱਕੀ ਹੈ (Dispensed)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-amber-700 font-bold bg-amber-100 px-2.5 py-1 rounded-full text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>ਦਵਾਈ ਬਕਾਇਆ ਹੈ (Pending Dispense)</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                SehatSetu Digital Rx ID: {prescription.prescription_number}
              </p>
            </div>

            <div className="text-right">
              <div className="inline-block border-b border-slate-400 pb-1 px-4 mb-1">
                <span className="font-serif italic font-bold text-slate-700">Dr. {prescription.doctor_name?.split(' ')?.[1] || prescription.doctor_name}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium flex items-center justify-end space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                <span>ਡਿਜੀਟਲ ਦਸਤਖ਼ਤ (Digitally Signed)</span>
              </p>
            </div>
          </div>

        </div>

        {/* Modal Bottom Actions (hidden on print) */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          {!prescription.is_dispensed && onFindMedicines ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onFindMedicines(prescription.items?.[0]?.generic_name || prescription.items?.[0]?.medicine_name);
              }}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
            >
              ਨੇੜਲੀ ਫਾਰਮੇਸੀ 'ਤੇ ਦਵਾਈ ਦੀ ਉਪਲਬਧਤਾ ਵੇਖੋ →
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-semibold text-slate-800 transition"
          >
            ਬੰਦ ਕਰੋ (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
