import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

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
    login: vi.fn().mockResolvedValue({
      access_token: "mock_jwt_token",
      role: "PATIENT",
      user_id: 1,
      full_name: "Balwinder Singh",
    }),
    register: vi.fn().mockResolvedValue({
      id: 2,
      phone: "9812345678",
      full_name: "New User",
      role: "PATIENT",
    }),
  },
  directoryApi: {
    getDoctors: vi.fn().mockResolvedValue([]),
    getPharmacies: vi.fn().mockResolvedValue([]),
    getPatients: vi.fn().mockResolvedValue([]),
  },
  systemApi: {
    getHealth: vi.fn().mockResolvedValue({ status: "online" }),
    seedDemoData: vi.fn().mockResolvedValue({ status: "success" }),
  },
}));

describe('Auth Pages (Login and Register)', () => {
  it('renders login page with quick demo account buttons', () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </LanguageProvider>
    );

    expect(screen.getByPlaceholderText(/9876543201/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    
    // Check quick demo buttons
    expect(screen.getByText(/Civil Hosp/i)).toBeInTheDocument();
    expect(screen.getByText(/Jan Aushadhi/i)).toBeInTheDocument();
  });

  it('autofills doctor demo credentials upon clicking quick test button', () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </LanguageProvider>
    );

    const doctorBtn = screen.getByText(/Civil Hosp/i);
    fireEvent.click(doctorBtn);

    const phoneInput = screen.getByPlaceholderText(/9876543201/i);
    expect(phoneInput.value).toBe('9876543201');
  });

  it('renders register page with role switching', () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/register']}>
            <Routes>
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </LanguageProvider>
    );

    expect(screen.getByPlaceholderText(/Jaswinder Singh/i)).toBeInTheDocument();
    expect(screen.getByText(/ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ/i)).toBeInTheDocument();

    // Verify role buttons exist
    const patientRole = screen.getByRole('button', { name: /ਮਰੀਜ਼/i });
    const doctorRole = screen.getByRole('button', { name: /ਡਾਕਟਰ/i });
    const pharmaRole = screen.getByRole('button', { name: /ਮੈਡੀਕਲ ਸਟੋਰ/i });

    expect(patientRole).toBeInTheDocument();
    expect(doctorRole).toBeInTheDocument();
    expect(pharmaRole).toBeInTheDocument();

    // Switch to doctor role and verify doctor fields appear
    fireEvent.click(doctorRole);
    expect(screen.getByPlaceholderText(/General Physician/i)).toBeInTheDocument();
  });
});
