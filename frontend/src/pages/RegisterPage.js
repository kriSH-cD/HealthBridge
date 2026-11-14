import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { NABHA_VILLAGES } from '../i18n/translations';
import { 
  UserPlus, 
  Stethoscope, 
  User as UserIcon, 
  Pill, 
  AlertCircle,
  MapPin,
  Check
} from 'lucide-react';

export const RegisterPage = () => {
  const { t, language } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('PATIENT');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [village, setVillage] = useState('Nabha City');
  const [preferredLang, setPreferredLang] = useState(language);

  // Role specific state
  const [patientData, setPatientData] = useState({
    age: '',
    gender: 'Male',
    blood_group: 'B+',
    emergency_contact: '',
    chronic_conditions: '',
  });

  const [doctorData, setDoctorData] = useState({
    specialization: 'General Medicine',
    license_number: '',
    hospital_name: 'Civil Hospital Nabha',
    consultation_fee: 0,
    experience_years: 5,
  });

  const [pharmacyData, setPharmacyData] = useState({
    pharmacy_name: '',
    license_number: '',
    address: 'Circular Road, Nabha',
    operating_hours: '08:00 AM - 08:00 PM',
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        phone,
        full_name: fullName,
        password,
        role,
        preferred_language: preferredLang,
        village,
      };

      if (role === 'PATIENT') {
        payload.patient_data = {
          ...patientData,
          age: patientData.age ? parseInt(patientData.age, 10) : null,
        };
      } else if (role === 'DOCTOR') {
        payload.doctor_data = {
          ...doctorData,
          consultation_fee: parseFloat(doctorData.consultation_fee || 0),
          experience_years: parseInt(doctorData.experience_years || 1, 10),
        };
      } else if (role === 'PHARMACY') {
        payload.pharmacy_data = {
          ...pharmacyData,
          contact_phone: phone,
        };
      }

      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      console.error("Registration failed:", err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : "ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਅਸਫਲ ਰਹੀ। ਕਿਰਪਾ ਕਰਕੇ ਜਾਣਕਾਰੀ ਚੈੱਕ ਕਰੋ।";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-xl w-full mx-auto px-4 py-10 flex flex-col justify-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">{t('register_title')}</h2>
          <p className="text-xs text-slate-500">
            ਸਿਹਤ ਸੇਤੂ ਨਾਭਾ ਨਾਲ ਜੁੜੋ ਅਤੇ ਸਿਹਤ ਸੇਵਾਵਾਂ ਤੱਕ ਤੁਰੰਤ ਪਹੁੰਚ ਪਾਓ
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selection Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            {t('role_label')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRole('PATIENT')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition ${
                role === 'PATIENT'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              <span>{t('role_patient')}</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('DOCTOR')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition ${
                role === 'DOCTOR'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <Stethoscope className="w-5 h-5" />
              <span>{t('role_doctor')}</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('PHARMACY')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition ${
                role === 'PHARMACY'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <Pill className="w-5 h-5" />
              <span>{t('role_pharmacy')}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('full_name_label')} *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jaswinder Singh"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('phone_label')} *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('password_label')} (ਘੱਟੋ-ਘੱਟ 6 ਅੱਖਰ) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('village_label')} *
              </label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {NABHA_VILLAGES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Role-Specific Fields */}
          {role === 'PATIENT' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ਮਰੀਜ਼ ਪ੍ਰੋਫਾਈਲ ਵੇਰਵਾ (Patient Details)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('age_label')}</label>
                  <input
                    type="number"
                    value={patientData.age}
                    onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                    placeholder="45"
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('gender_label')}</label>
                  <select
                    value={patientData.gender}
                    onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Male">{t('male')}</option>
                    <option value="Female">{t('female')}</option>
                    <option value="Other">{t('other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('blood_group_label')}</label>
                  <select
                    value={patientData.blood_group}
                    onChange={(e) => setPatientData({ ...patientData, blood_group: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('emergency_contact_label')}</label>
                <input
                  type="text"
                  value={patientData.emergency_contact}
                  onChange={(e) => setPatientData({ ...patientData, emergency_contact: e.target.value })}
                  placeholder="ਸੰਪਰਕ ਨੰਬਰ"
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {role === 'DOCTOR' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ਡਾਕਟਰ ਵੇਰਵਾ (Doctor Professional Profile)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('specialization_label')} *</label>
                  <input
                    type="text"
                    required
                    value={doctorData.specialization}
                    onChange={(e) => setDoctorData({ ...doctorData, specialization: e.target.value })}
                    placeholder="e.g. General Physician"
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('license_label')} *</label>
                  <input
                    type="text"
                    required
                    value={doctorData.license_number}
                    onChange={(e) => setDoctorData({ ...doctorData, license_number: e.target.value })}
                    placeholder="e.g. PB-MC-2024-XXXX"
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('hospital_name_label')}</label>
                  <input
                    type="text"
                    value={doctorData.hospital_name}
                    onChange={(e) => setDoctorData({ ...doctorData, hospital_name: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('fee_label')}</label>
                  <input
                    type="number"
                    value={doctorData.consultation_fee}
                    onChange={(e) => setDoctorData({ ...doctorData, consultation_fee: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {role === 'PHARMACY' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ਫਾਰਮੇਸੀ / ਮੈਡੀਕਲ ਸਟੋਰ ਵੇਰਵਾ
              </h4>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('pharmacy_name_label')} *</label>
                <input
                  type="text"
                  required
                  value={pharmacyData.pharmacy_name}
                  onChange={(e) => setPharmacyData({ ...pharmacyData, pharmacy_name: e.target.value })}
                  placeholder="e.g. Kisan Medicos"
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('license_label')} *</label>
                  <input
                    type="text"
                    required
                    value={pharmacyData.license_number}
                    onChange={(e) => setPharmacyData({ ...pharmacyData, license_number: e.target.value })}
                    placeholder="DL-NABHA-2024"
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('operating_hours_label')}</label>
                  <input
                    type="text"
                    value={pharmacyData.operating_hours}
                    onChange={(e) => setPharmacyData({ ...pharmacyData, operating_hours: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md transition disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? "ਖਾਤਾ ਬਣ ਰਿਹਾ ਹੈ..." : t('register')}</span>
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-600">
            ਪਹਿਲਾਂ ਹੀ ਖਾਤਾ ਹੈ?{' '}
            <Link to="/login" className="font-bold text-emerald-700 hover:underline">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

