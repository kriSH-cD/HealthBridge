import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { directoryApi } from '../services/api';
import { AppointmentsPanel } from '../components/AppointmentsPanel';
import { BookAppointmentForm } from '../components/BookAppointmentForm';
import { 
  User, 
  Stethoscope, 
  Pill, 
  Hospital, 
  MapPin, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  AlertTriangle,
  Users,
  Activity
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientError, setPatientError] = useState(null);
  const [booking, setBooking] = useState(false);
  const [appointmentsKey, setAppointmentsKey] = useState(0);

  // If role is DOCTOR, ASHA_WORKER, or HOSPITAL_ADMIN, test fetching the restricted patient list!
  useEffect(() => {
    if (['DOCTOR', 'ASHA_WORKER', 'HOSPITAL_ADMIN'].includes(user?.role)) {
      setLoadingPatients(true);
      directoryApi.getPatients()
        .then((data) => setPatients(data))
        .catch((err) => {
          console.error("Failed to fetch restricted patients list:", err);
          setPatientError("RBAC: Restricted access error");
        })
        .finally(() => setLoadingPatients(false));
    }
  }, [user]);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl border border-emerald-300">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">
                {t('welcome')}, {user?.full_name?.replace(' [DEMO DATA]', '')}
              </h1>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center space-x-2 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.village || 'Nabha City'}, Punjab</span>
              <span>•</span>
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>+91 {user?.phone}</span>
            </p>
          </div>
        </div>

        {/* Synthetic Demo Tag */}
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-2 text-right">
          <p className="text-[11px] font-bold text-amber-900 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('demo_badge')}</span>
          </p>
          <p className="text-[10px] text-amber-700">Account ID: #{user?.id} • Verified Demo</p>
        </div>
      </div>

      {/* Role-Specific View */}
      {user?.role === 'PATIENT' && (
        <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Synthetic ABHA Card */}
          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
              <ShieldCheck className="w-36 h-36" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 mb-4">
              Nabha Digital Health ID (DEMO ABHA)
            </p>
            <h3 className="text-lg font-bold">{user?.full_name?.replace(' [DEMO DATA]', '')}</h3>
            <p className="font-mono text-sm tracking-wider text-amber-300 my-2">
              {user?.patient_profile?.abha_id || `91-${user?.id}098-7654-3210-DEMO`}
            </p>
            <div className="grid grid-cols-2 text-xs text-emerald-100 gap-2 mt-4 pt-3 border-t border-emerald-700">
              <div>
                <span className="text-[10px] text-emerald-300 block">ਉਮਰ / ਲਿੰਗ:</span>
                <span>{user?.patient_profile?.age || 45} Yrs • {user?.patient_profile?.gender || 'Male'}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-300 block">ਬਲੱਡ ਗਰੁੱਪ:</span>
                <span className="font-bold text-white">{user?.patient_profile?.blood_group || 'B+'}</span>
              </div>
            </div>
          </div>

          {/* Health Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>ਸਿਹਤ ਜਾਣਕਾਰੀ (Health Records)</span>
            </h3>
            <div className="text-xs text-slate-600 space-y-2">
              <p>
                <strong>ਪੁਰਾਣੀ ਬਿਮਾਰੀ (Chronic):</strong>{' '}
                <span className="text-slate-800">{user?.patient_profile?.chronic_conditions || 'None reported'}</span>
              </p>
              <p>
                <strong>ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ:</strong>{' '}
                <span className="text-slate-800">{user?.patient_profile?.emergency_contact || '+91 9876543991'}</span>
              </p>
              <p>
                <strong>ਸੰਬੰਧਿਤ ਪੀ.ਐਚ.ਸੀ:</strong>{' '}
                <span className="text-slate-800">Civil Hospital Nabha Sector</span>
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button className="flex-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold py-2 rounded-lg hover:bg-emerald-100 transition">
                ਪਰਚੀਆਂ ਦੇਖੋ (Prescriptions)
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>ਤੁਰੰਤ ਸੇਵਾਵਾਂ (Quick Actions)</span>
            </h3>
            <div className="space-y-2">
              <button type="button" onClick={() => setBooking(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-between transition">
                <span>ਡਾਕਟਰ ਨਾਲ ਮੁਲਾਕਾਤ ਬੁੱਕ ਕਰੋ</span>
                <span>→</span>
              </button>
              <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-between transition">
                <span>ਨੇੜਲੇ ਮੈਡੀਕਲ ਸਟੋਰ 'ਤੇ ਦਵਾਈ ਲੱਭੋ</span>
                <span>→</span>
              </button>
              <button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-between transition">
                <span>AI ਲੱਛਣ ਜਾਂਚ ਸ਼ੁਰੂ ਕਰੋ</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
        {booking && (
          <BookAppointmentForm
            onCancel={() => setBooking(false)}
            onBooked={() => { setBooking(false); setAppointmentsKey((k) => k + 1); }}
          />
        )}
        <AppointmentsPanel role="PATIENT" refreshKey={appointmentsKey} />
        </div>
      )}

      {user?.role === 'DOCTOR' && (
        <div className="space-y-6">
          <AppointmentsPanel role="DOCTOR" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">ਵਿਸ਼ੇਸ਼ਤਾ (Specialization)</span>
              <h3 className="text-lg font-bold text-slate-900">{user?.doctor_profile?.specialization}</h3>
              <p className="text-xs text-slate-500">{user?.doctor_profile?.hospital_name}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">ਲਾਇਸੈਂਸ & ਤਜਰਬਾ</span>
              <h3 className="text-lg font-bold text-slate-900">{user?.doctor_profile?.experience_years} ਸਾਲ ਦਾ ਤਜਰਬਾ</h3>
              <p className="text-xs font-mono text-emerald-700">Reg: {user?.doctor_profile?.license_number}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">ਸਲਾਹ ਫੀਸ (Fee)</span>
              <h3 className="text-lg font-bold text-slate-900">
                {user?.doctor_profile?.consultation_fee === 0 ? 'ਮੁਫ਼ਤ (ਸਰਕਾਰੀ)' : `₹${user?.doctor_profile?.consultation_fee}`}
              </h3>
              <p className="text-xs text-emerald-600 font-semibold">ਲਾਈਵ ਓ.ਪੀ.ਡੀ ਸੇਵਾ ਉਪਲਬਧ</p>
            </div>
          </div>

          {/* Patient Directory (RBAC Protected Data) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>ਰਜਿਸਟਰਡ ਮਰੀਜ਼ਾਂ ਦੀ ਸੂਚੀ (RBAC Protected: {patients.length})</span>
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                Doctor Authorized Access
              </span>
            </div>

            {loadingPatients ? (
              <p className="text-xs text-slate-400 py-4">ਮਰੀਜ਼ਾਂ ਦਾ ਡਾਟਾ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...</p>
            ) : patientError ? (
              <p className="text-xs text-red-600 py-4">{patientError}</p>
            ) : patients.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">ਕੋਈ ਮਰੀਜ਼ ਰਜਿਸਟਰਡ ਨਹੀਂ। ਹੋਮ ਪੇਜ 'ਤੇ ਡੈਮੋ ਡਾਟਾ ਸੀਡ ਕਰੋ।</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {patients.map((pt) => (
                  <div key={pt.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{pt.full_name}</p>
                      <p className="text-slate-500">
                        ਪਿੰਡ: {pt.village} • ਮੋਬਾਈਲ: {pt.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded">
                        ਬਲੱਡ: {pt.patient_profile?.blood_group || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {user?.role === 'PHARMACY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>ਫਾਰਮੇਸੀ ਪ੍ਰੋਫਾਈਲ ਵੇਰਵਾ</span>
            </h3>
            <div className="text-xs text-slate-600 space-y-2">
              <p>
                <strong>ਦੁਕਾਨ ਦਾ ਨਾਮ:</strong> {user?.pharmacy_profile?.pharmacy_name || user?.full_name}
              </p>
              <p>
                <strong>ਪਤਾ:</strong> {user?.pharmacy_profile?.address}
              </p>
              <p>
                <strong>ਖੁੱਲ੍ਹਣ ਦਾ ਸਮਾਂ:</strong> {user?.pharmacy_profile?.operating_hours}
              </p>
              <p>
                <strong>ਲਾਇਸੈਂਸ ਨੰਬਰ:</strong> {user?.pharmacy_profile?.license_number}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>ਦਵਾਈ ਸਟਾਕ ਪ੍ਰਬੰਧਨ (Inventory Management)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ਅਗਲੇ ਪੜਾਅ ਵਿੱਚ: ਜ਼ਰੂਰੀ ਦਵਾਈਆਂ ਦਾ ਲਾਈਵ ਸਟਾਕ ਅੱਪਡੇਟ ਕਰੋ ਤਾਂ ਜੋ ਨਾਭਾ ਦੇ ਪਿੰਡਾਂ ਦੇ ਮਰੀਜ਼ ਦੇਖ ਸਕਣ।
            </p>
            <button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2 px-4 rounded-xl transition">
              ਸਟਾਕ ਸੂਚੀ ਵੇਖੋ (View Stock)
            </button>
          </div>
        </div>
      )}

      {user?.role === 'HOSPITAL_ADMIN' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Hospital className="w-4 h-4 text-red-600" />
            <span>ਹਸਪਤਾਲ ਪ੍ਰਬੰਧਨ (Civil Hospital Nabha Bed Status)</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl text-center">
              <p className="text-xs text-slate-500">ਕੁੱਲ ਬਿਸਤਰੇ</p>
              <p className="text-2xl font-bold text-slate-900">100</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl text-center">
              <p className="text-xs text-emerald-700">ਉਪਲਬਧ ਬਿਸਤਰੇ</p>
              <p className="text-2xl font-bold text-emerald-800">24</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <p className="text-xs text-blue-700">ਆਕਸੀਜਨ ਸੁਵਿਧਾ</p>
              <p className="text-2xl font-bold text-blue-800">ਹਾਂ</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl text-center">
              <p className="text-xs text-amber-700">ਐਮਰਜੈਂਸੀ ਓ.ਪੀ.ਡੀ</p>
              <p className="text-2xl font-bold text-amber-800">24x7</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

