import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CompleteVisitForm } from '../components/CompleteVisitForm';
import { clinicalApi } from '../services/api';

vi.mock('../services/api', () => ({
  clinicalApi: {
    catalogue: vi.fn().mockResolvedValue([{ id: 3, name: 'Paracetamol', strength: '500 mg' }]),
    completeVisit: vi.fn().mockResolvedValue({ appointment: { id: 9, status: 'COMPLETED' } }),
  },
}));

describe('CompleteVisitForm', () => {
  it('sends diagnosis, filled vitals only, and a prescription with auto quantity', async () => {
    const onDone = vi.fn();
    render(<CompleteVisitForm appointment={{ id: 9, patient_name: 'Ram' }} onDone={onDone} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText(/Diagnosis/), { target: { value: 'Viral fever' } });
    fireEvent.change(screen.getByLabelText('BP'), { target: { value: '120/80' } });
    fireEvent.change(screen.getByLabelText(/Add medicine/), { target: { value: 'para' } });
    fireEvent.click(await screen.findByRole('button', { name: /Paracetamol 500 mg/ }));
    fireEvent.change(screen.getByLabelText('Days'), { target: { value: '3' } }); // 1-0-1 x 3 = 6
    fireEvent.click(screen.getByRole('button', { name: /Save & complete/ }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(clinicalApi.completeVisit).toHaveBeenCalledWith(9, expect.objectContaining({
      diagnosis: 'Viral fever',
      vitals: { bp: '120/80' },
      prescription: expect.objectContaining({
        items: [expect.objectContaining({ medicine_id: 3, frequency: '1-0-1', duration_days: 3, quantity_prescribed: 6 })],
      }),
    }));
  });
});
