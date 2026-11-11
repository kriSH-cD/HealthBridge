import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookAppointmentForm } from '../components/BookAppointmentForm';
import { appointmentsApi } from '../services/api';

vi.mock('../services/api', () => ({
  directoryApi: {
    getDoctors: vi.fn().mockResolvedValue([
      { full_name: 'Dr. Kaur', village: 'Alhoran', doctor_profile: { id: 7, specialization: 'Pediatrics', is_available: true } },
      { full_name: 'Dr. Away', village: 'Mehas', doctor_profile: { id: 8, specialization: 'ENT', is_available: false } },
    ]),
  },
  appointmentsApi: { book: vi.fn().mockResolvedValue({ id: 1 }) },
}));

describe('BookAppointmentForm', () => {
  it('lists only available doctors and posts the booking', async () => {
    const onBooked = vi.fn();
    render(<BookAppointmentForm onBooked={onBooked} onCancel={() => {}} />);

    await screen.findByText(/Dr\. Kaur/);
    expect(screen.queryByText(/Dr\. Away/)).toBeNull();

    fireEvent.change(screen.getByLabelText(/Doctor/), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText(/Symptoms/), { target: { value: 'Cough' } });
    fireEvent.click(screen.getByRole('button', { name: /Book/ }));

    await waitFor(() => expect(onBooked).toHaveBeenCalled());
    expect(appointmentsApi.book).toHaveBeenCalledWith(expect.objectContaining({
      doctor_id: 7, symptom_summary: 'Cough', appointment_time: '09:00 AM', appointment_type: 'IN_PERSON',
    }));
  });
});
