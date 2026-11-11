import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PrescriptionsList } from '../components/PrescriptionsList';
import { prescriptionsApi } from '../services/api';
import { LanguageProvider } from '../context/LanguageContext';

vi.mock('../services/api', () => ({
  prescriptionsApi: {
    list: vi.fn(),
    dispense: vi.fn(),
  },
  medicinesApi: {
    catalog: vi.fn().mockResolvedValue([]),
  },
  directoryApi: {
    getPatients: vi.fn().mockResolvedValue([]),
  },
}));

const sampleRx = (id = 1, isDispensed = false) => ({
  id,
  prescription_number: `RX-NBH-2026-000${id}`,
  patient_name: 'Harpreet Singh',
  patient_village: 'Alhoran',
  patient_age: 45,
  patient_gender: 'Male',
  doctor_name: 'Dr. Gurpreet Singh',
  doctor_qualification: 'MBBS, MD',
  doctor_specialization: 'General Medicine',
  doctor_hospital: 'Civil Hospital Nabha',
  doctor_license: 'PMC-2015-4421',
  issue_date: '2026-11-14',
  diagnosis: 'Acute Bronchitis and Fever',
  instructions: 'Drink warm water and rest',
  is_dispensed: isDispensed,
  items: [
    {
      id: 101,
      medicine_name: 'Amoxicillin 500mg',
      generic_name: 'Amoxicillin',
      dosage: '1 capsule',
      frequency: 'Thrice daily',
      duration_days: 5,
      quantity_prescribed: 15,
      instructions: 'Take after meals',
    },
  ],
});

const renderWithLanguage = (ui) => render(<LanguageProvider>{ui}</LanguageProvider>);

describe('PrescriptionsList Component', () => {
  it('renders patient digital prescriptions and opens modal on click', async () => {
    prescriptionsApi.list.mockResolvedValue([sampleRx(1, false)]);

    renderWithLanguage(<PrescriptionsList role="PATIENT" />);

    expect(await screen.findByText('RX-NBH-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Acute Bronchitis and Fever')).toBeInTheDocument();
    expect(screen.getByText(/Amoxicillin 500mg/i)).toBeInTheDocument();

    // Click View / Print
    const viewBtn = screen.getByText(/View \/ Print|ਪਰਚੀ ਵੇਖੋ/i);
    fireEvent.click(viewBtn);

    // Modal opens
    expect(await screen.findByText('ਸਿਹਤ ਸੇਤੂ (SehatSetu)')).toBeInTheDocument();
    expect(screen.getAllByText('Dr. Gurpreet Singh').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Harpreet Singh').length).toBeGreaterThan(0);
  });

  it('allows pharmacy to dispense a pending prescription', async () => {
    prescriptionsApi.list.mockResolvedValue([sampleRx(2, false)]);
    prescriptionsApi.dispense.mockResolvedValue({
      message: 'Prescription dispensed successfully',
      prescription: sampleRx(2, true),
    });

    renderWithLanguage(<PrescriptionsList role="PHARMACY" />);

    expect(await screen.findByText('RX-NBH-2026-0002')).toBeInTheDocument();
    const dispenseBtn = screen.getByRole('button', { name: /ਦਵਾਈ ਦਿਓ/i });
    expect(dispenseBtn).toBeInTheDocument();

    fireEvent.click(dispenseBtn);
    await waitFor(() => {
      expect(prescriptionsApi.dispense).toHaveBeenCalledWith(2);
    });
  });
});
