import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MedicineSearch } from '../components/MedicineSearch';
import { medicinesApi } from '../services/api';

vi.mock('../services/api', () => ({ medicinesApi: { availability: vi.fn() } }));

const search = (q) => {
  fireEvent.change(screen.getByLabelText(/Medicine name/), { target: { value: q } });
  fireEvent.click(screen.getByRole('button'));
};

describe('MedicineSearch', () => {
  it('shows pharmacies with a call link', async () => {
    medicinesApi.availability.mockResolvedValue([{
      inventory_id: 1, medicine_name: 'Paracetamol', strength: '500 mg', pharmacy_name: 'Kisan Medical [DEMO DATA]',
      pharmacy_village: 'Alhoran', pharmacy_phone: '9876543301', unit_price: 12, stock_quantity: 40,
    }]);
    render(<MedicineSearch />);
    search('para');
    expect(await screen.findByText(/Kisan Medical • Alhoran/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Call/ })).toHaveAttribute('href', 'tel:9876543301');
    expect(medicinesApi.availability).toHaveBeenCalledWith('para');
  });

  it('says so when nothing is in stock', async () => {
    medicinesApi.availability.mockResolvedValue([]);
    render(<MedicineSearch />);
    search('xyz');
    expect(await screen.findByText(/Not in stock/)).toBeInTheDocument();
  });
});
