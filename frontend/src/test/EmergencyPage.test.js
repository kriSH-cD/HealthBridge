import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EmergencyPage } from '../pages/EmergencyPage';
import { hospitalsApi, ambulancesApi } from '../services/api';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../services/api', () => ({
  hospitalsApi: {
    list: vi.fn(),
    getSummary: vi.fn(),
    get: vi.fn(),
    updateBeds: vi.fn(),
  },
  ambulancesApi: {
    list: vi.fn(),
    getSummary: vi.fn(),
    get: vi.fn(),
    requestAmbulance: vi.fn(),
    listRequests: vi.fn(),
    updateRequestStatus: vi.fn(),
  },
  authApi: {
    getMe: vi.fn(),
  },
  medicinesApi: {
    catalog: vi.fn().mockResolvedValue([]),
  },
}));

const sampleHospitals = [
  {
    id: 1,
    hospital_name: 'Sub-Divisional Civil Hospital Nabha',
    address: 'Circular Road, Near Cantt Gate, Nabha',
    emergency_phone: '01765-220102',
    total_beds: 100,
    available_beds: 28,
    has_oxygen: true,
    has_emergency: true,
    created_at: '2026-11-12T10:00:00Z',
    updated_at: '2026-11-12T10:00:00Z',
  },
  {
    id: 2,
    hospital_name: 'Community Health Centre (CHC) Bhadson',
    address: 'Main Bhadson-Nabha Road, Bhadson',
    emergency_phone: '01765-260222',
    total_beds: 30,
    available_beds: 9,
    has_oxygen: true,
    has_emergency: true,
    created_at: '2026-11-12T10:00:00Z',
    updated_at: '2026-11-12T10:00:00Z',
  },
  {
    id: 3,
    hospital_name: 'Alhoran Rural Health Post',
    address: 'Alhoran Gate Road, Alhoran',
    emergency_phone: '+91-98765-43405',
    total_beds: 6,
    available_beds: 0,
    has_oxygen: false,
    has_emergency: false,
    created_at: '2026-11-12T10:00:00Z',
    updated_at: '2026-11-12T10:00:00Z',
  },
];

const sampleSummary = {
  total_facilities: 3,
  total_beds: 136,
  total_available_beds: 37,
  total_occupied_beds: 99,
  overall_occupancy_rate: 73,
  oxygen_facilities: 2,
  emergency_facilities: 2,
  critical_facilities: 1,
  last_updated: '2026-11-12T10:00:00Z',
};

const renderPage = () => {
  return render(
    <LanguageProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/emergency']}>
          <Routes>
            <Route path="/emergency" element={<EmergencyPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

describe('EmergencyPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ambulancesApi.list.mockResolvedValue([]);
    ambulancesApi.getSummary.mockResolvedValue({ total_ambulances: 0, available_ambulances: 0 });
  });

  it('renders emergency dashboard with live bed count and emergency helplines', async () => {
    hospitalsApi.list.mockResolvedValue(sampleHospitals);
    hospitalsApi.getSummary.mockResolvedValue(sampleSummary);

    renderPage();

    // Check emergency action ribbon
    const ambulanceRibbon = await screen.findAllByText(/108 ਐਂਬੂਲੈਂਸ/i);
    expect(ambulanceRibbon.length).toBeGreaterThan(0);
    const phoneMatches = await screen.findAllByText(/01765-220102/i);
    expect(phoneMatches.length).toBeGreaterThan(0);

    // Check summary statistics
    expect(screen.getByText('37')).toBeInTheDocument(); // total_available_beds
    expect(screen.getByText(/Sub-Divisional Civil Hospital Nabha/i)).toBeInTheDocument();
    expect(screen.getByText(/Community Health Centre \(CHC\) Bhadson/i)).toBeInTheDocument();
  });

  it('filters hospitals by search term and oxygen availability', async () => {
    hospitalsApi.list.mockResolvedValue(sampleHospitals);
    hospitalsApi.getSummary.mockResolvedValue(sampleSummary);

    renderPage();

    await screen.findByText(/Sub-Divisional Civil Hospital Nabha/i);

    // Search for Bhadson
    const searchInput = screen.getByPlaceholderText(/ਹਸਪਤਾਲ ਦਾ ਨਾਮ ਜਾਂ ਪਿੰਡ ਖੋਜੋ/i);
    fireEvent.change(searchInput, { target: { value: 'Bhadson' } });

    expect(screen.getByText(/Community Health Centre \(CHC\) Bhadson/i)).toBeInTheDocument();
    expect(screen.queryByText(/Alhoran Rural Health Post/i)).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    // Filter by oxygen
    const oxygenFilterBtn = screen.getByRole('button', { name: /ਆਕਸੀਜਨ ਸਮਰਥਿਤ/i });
    fireEvent.click(oxygenFilterBtn);

    // Alhoran has no oxygen, so it should be filtered out
    expect(screen.queryByText(/Alhoran Rural Health Post/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Sub-Divisional Civil Hospital Nabha/i)).toBeInTheDocument();
  });

  it('shows bed status tags like Available and Full', async () => {
    hospitalsApi.list.mockResolvedValue(sampleHospitals);
    hospitalsApi.getSummary.mockResolvedValue(sampleSummary);

    renderPage();

    await screen.findByText(/Sub-Divisional Civil Hospital Nabha/i);

    // Full hospital shows bed full tag
    const fullTag = screen.getByText(/ਬੈੱਡ ਭਰੇ ਹੋਏ ਹਨ/i);
    expect(fullTag).toBeInTheDocument();
  });

  it('displays inter-facility referral action when rural facility has no available beds', async () => {
    hospitalsApi.list.mockResolvedValue(sampleHospitals);
    hospitalsApi.getSummary.mockResolvedValue(sampleSummary);

    renderPage();

    await screen.findByText(/Sub-Divisional Civil Hospital Nabha/i);

    // Alhoran has available_beds = 0 and is not civil, so it should trigger referral CTA
    expect(screen.getByText(/ਸਿਵਲ ਹਸਪਤਾਲ ਨਾਭਾ ਰੈਫ਼ਰ ਕਰੋ/i)).toBeInTheDocument();
    expect(screen.getByText(/ਨਾਭਾ ਕਾਲ \(01765-220102\)/i)).toBeInTheDocument();
  });

  it('displays critical capacity alert when regional beds are low', async () => {
    hospitalsApi.list.mockResolvedValue(sampleHospitals);
    hospitalsApi.getSummary.mockResolvedValue({
      ...sampleSummary,
      critical_bed_alert: true,
      total_available_beds: 14,
    });

    renderPage();

    expect(await screen.findByText(/ਖੇਤਰੀ ਬੈੱਡ ਸਮਰੱਥਾ ਨਾਜ਼ੁਕ ਪੱਧਰ 'ਤੇ ਹੈ/i)).toBeInTheDocument();
  });

  it('hydrates from local cache when network call fails', async () => {
    localStorage.setItem('sehatsetu_cached_hospitals', JSON.stringify(sampleHospitals));
    localStorage.setItem('sehatsetu_cached_emergency_summary', JSON.stringify(sampleSummary));

    hospitalsApi.list.mockRejectedValue(new Error('Network error'));
    hospitalsApi.getSummary.mockRejectedValue(new Error('Network error'));

    renderPage();

    expect(await screen.findByText(/Sub-Divisional Civil Hospital Nabha/i)).toBeInTheDocument();
    expect(screen.getByText(/ਔਫਲਾਈਨ ਕੈਸ਼ਡ ਮੋਡ/i)).toBeInTheDocument();
  });

  it('renders 108 ambulance fleet and handles emergency dispatch request', async () => {
    const sampleAmbulances = [
      {
        id: 1,
        vehicle_number: 'PB-11-AB-1081',
        ambulance_type: 'ALS',
        station_location: 'Sub-Divisional Civil Hospital Nabha',
        driver_name: 'Gurmeet Singh',
        driver_phone: '+91-98765-43501',
        paramedic_name: 'Satnam Singh',
        status: 'AVAILABLE',
        has_oxygen: true,
        has_ventilator: true,
      },
    ];

    hospitalsApi.list.mockResolvedValue(sampleHospitals);
    hospitalsApi.getSummary.mockResolvedValue(sampleSummary);
    ambulancesApi.list.mockResolvedValue(sampleAmbulances);
    ambulancesApi.getSummary.mockResolvedValue({ total_ambulances: 1, available_ambulances: 1 });
    ambulancesApi.requestAmbulance.mockResolvedValue({
      id: 1,
      request_number: 'EMR-NBH-2026-0001',
      caller_name: 'Balwinder Singh',
      caller_phone: '9876543101',
      pickup_village: 'Alhoran',
      status: 'DISPATCHED',
      ambulance: sampleAmbulances[0],
      destination_hospital: sampleHospitals[0],
    });

    renderPage();

    // Verify ambulance fleet rendered
    expect(await screen.findByText('PB-11-AB-1081')).toBeInTheDocument();
    expect(screen.getByText(/Gurmeet Singh/i)).toBeInTheDocument();

    // Open dispatch modal
    const dispatchBtns = screen.getAllByRole('button', { name: /108 ਐਂਬੂਲੈਂਸ/i });
    fireEvent.click(dispatchBtns[0]);

    // Modal title should appear
    expect(await screen.findByText(/108 ਐਮਰਜੈਂਸੀ ਐਂਬੂਲੈਂਸ ਤਤਕਾਲ ਬੇਨਤੀ/i)).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/ਜਿਵੇਂ: ਗੁਰਮੀਤ ਸਿੰਘ/i), {
      target: { value: 'Balwinder Singh' },
    });
    fireEvent.change(screen.getByPlaceholderText(/98765-XXXXX/i), {
      target: { value: '9876543101' },
    });
    fireEvent.change(screen.getByPlaceholderText(/ਛਾਤੀ ਵਿੱਚ ਗੰਭੀਰ ਦਰਦ/i), {
      target: { value: 'Severe chest pain radiating to left arm' },
    });

    // Submit request
    fireEvent.click(screen.getByRole('button', { name: /108 ਐਂਬੂਲੈਂਸ ਰਵਾਨਾ ਕਰੋ/i }));

    await waitFor(() => {
      expect(ambulancesApi.requestAmbulance).toHaveBeenCalledTimes(1);
    });

    // Verify confirmation
    expect(await screen.findByText(/108 ਐਂਬੂਲੈਂਸ ਰਵਾਨਾ ਕਰ ਦਿੱਤੀ ਗਈ ਹੈ!/i)).toBeInTheDocument();
    expect(screen.getByText('EMR-NBH-2026-0001')).toBeInTheDocument();
  });
});
