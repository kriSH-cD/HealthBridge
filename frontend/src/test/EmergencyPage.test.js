import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EmergencyPage } from '../pages/EmergencyPage';
import { hospitalsApi } from '../services/api';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../services/api', () => ({
  hospitalsApi: {
    list: vi.fn(),
    getSummary: vi.fn(),
    get: vi.fn(),
    updateBeds: vi.fn(),
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
  });

  it('renders emergency dashboard with live bed count and emergency helplines', async () => {
    hospitalsApi.list.mockResolvedValue(sampleHospitals);
    hospitalsApi.getSummary.mockResolvedValue(sampleSummary);

    renderPage();

    // Check emergency action ribbon
    expect(await screen.findByText(/108 ਐਂਬੂਲੈਂਸ/i)).toBeInTheDocument();
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
});
