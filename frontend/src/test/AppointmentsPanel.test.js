import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppointmentsPanel } from '../components/AppointmentsPanel';
import { appointmentsApi } from '../services/api';

vi.mock('../services/api', () => ({ appointmentsApi: { list: vi.fn(), setStatus: vi.fn() } }));

const ymd = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString('en-CA'); };
const appt = (id, offset, status = 'SCHEDULED') => ({
  id, appointment_number: `APT-${id}`, appointment_date: ymd(offset), appointment_time: '10:00 AM',
  appointment_type: 'IN_PERSON', status, doctor_name: `Dr. ${id}`, patient_name: 'Patient',
});

describe('AppointmentsPanel', () => {
  it('slips the earliest upcoming scheduled visit, skipping past and cancelled ones', async () => {
    appointmentsApi.list.mockResolvedValue([appt(1, -2), appt(2, 1, 'CANCELLED'), appt(3, 1), appt(4, 5)]);
    render(<AppointmentsPanel role="PATIENT" />);
    expect(await screen.findByText('APT-3')).toBeInTheDocument();
    expect(screen.getByText(/Tomorrow/)).toBeInTheDocument();
    expect(screen.queryByText('APT-4')).toBeNull();
  });

  it('shows no slip when nothing is upcoming', async () => {
    appointmentsApi.list.mockResolvedValue([appt(1, -1)]);
    render(<AppointmentsPanel role="PATIENT" />);
    expect(await screen.findByText('Dr. 1')).toBeInTheDocument();
    expect(screen.queryByText(/Next visit/)).toBeNull();
  });
});
