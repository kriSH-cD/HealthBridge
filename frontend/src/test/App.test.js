import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock API requests
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  authApi: {
    getMe: vi.fn().mockRejectedValue(new Error("No token")),
    login: vi.fn(),
    register: vi.fn(),
  },
  directoryApi: {
    getDoctors: vi.fn().mockResolvedValue([]),
    getPharmacies: vi.fn().mockResolvedValue([]),
    getPatients: vi.fn().mockResolvedValue([]),
  },
  systemApi: {
    getHealth: vi.fn().mockResolvedValue({ status: "online" }),
    getDirectApiHealth: vi.fn().mockResolvedValue({
      status: "online",
      database: { status: "healthy", type: "PostgreSQL" },
      region: "Nabha, Patiala, Punjab"
    }),
    seedDemoData: vi.fn().mockResolvedValue({ status: "success", message: "Demo data seeded" }),
  },
}));

describe('SehatSetu Frontend Application', () => {
  it('renders application branding and Nabha healthcare mission', () => {
    render(<App />);
    expect(screen.getAllByText(/ਸਿਹਤ ਸੇਤੂ/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/01765-220100/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/108 ਐਮਰਜੈਂਸੀ/i)[0]).toBeInTheDocument();
  });

  it('displays the synthetic DEMO DATA disclaimer badge', () => {
    render(<App />);
    const demoBadges = screen.getAllByText(/DEMO DATA/i);
    expect(demoBadges.length).toBeGreaterThan(0);
  });

  it('switches languages smoothly to English and Hindi', () => {
    render(<App />);
    const langSelect = screen.getByRole('combobox', { name: /Language Selector/i });
    expect(langSelect).toBeInTheDocument();

    // Switch to English
    fireEvent.change(langSelect, { target: { value: 'en' } });
    expect(screen.getAllByText(/SehatSetu/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Find Doctors/i)[0]).toBeInTheDocument();

    // Switch to Hindi
    fireEvent.change(langSelect, { target: { value: 'hi' } });
    expect(screen.getAllByText(/सेहत सेतु/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/डॉक्टर खोजें/i)[0]).toBeInTheDocument();
  });
});
