import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HealthHistory } from '../components/HealthHistory';

vi.mock('../services/api', () => ({
  clinicalApi: {
    prescriptions: vi.fn().mockResolvedValue([{
      id: 1, diagnosis: 'Viral fever', issue_date: '2026-11-13', valid_until: '2026-12-13', doctor_name: 'Dr. Kaur [DEMO DATA]',
      items: [{ medicine_name: 'Paracetamol', strength: '500 mg', dosage: '500 mg', frequency: '1-0-1', duration_days: 3, quantity_prescribed: 6 }],
    }]),
    records: vi.fn().mockResolvedValue([{
      id: 2, title: 'OPD visit', diagnosis: 'Hypertension', record_date: '2026-11-10', doctor_name: 'Dr. Kaur',
      vitals: { bp: '138/88', pulse: 76 },
    }]),
  },
}));

describe('HealthHistory', () => {
  it('shows prescriptions, then visit notes with vitals', async () => {
    render(<HealthHistory />);
    expect(await screen.findByText(/Paracetamol 500 mg/)).toBeInTheDocument();
    expect(screen.getByText(/1-0-1 · 3 days · qty 6/)).toBeInTheDocument();
    expect(screen.queryByText(/DEMO DATA/)).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: /Visit notes/ }));
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('138/88')).toBeInTheDocument();
  });
});
