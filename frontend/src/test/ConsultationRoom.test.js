import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ConsultationRoom } from '../pages/ConsultationRoom';
import { consultationsApi } from '../services/api';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../services/api', () => ({
  consultationsApi: {
    get: vi.fn(),
    updateStatus: vi.fn(),
    setFallback: vi.fn(),
    sendSignal: vi.fn(),
    getSignals: vi.fn().mockResolvedValue([]),
    sendChat: vi.fn(),
    getChat: vi.fn().mockResolvedValue([]),
  },
  authApi: {
    getMe: vi.fn(),
  },
  medicinesApi: {
    catalog: vi.fn().mockResolvedValue([]),
  },
}));

// Mock RTCPeerConnection and mediaDevices for JSDOM
global.RTCPeerConnection = vi.fn().mockImplementation(() => ({
  addTrack: vi.fn(),
  createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'fake-sdp' }),
  createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'fake-sdp' }),
  setLocalDescription: vi.fn().mockResolvedValue(),
  setRemoteDescription: vi.fn().mockResolvedValue(),
  addIceCandidate: vi.fn().mockResolvedValue(),
  close: vi.fn(),
  signalingState: 'stable',
}));

global.RTCSessionDescription = vi.fn().mockImplementation((d) => d);
global.RTCIceCandidate = vi.fn().mockImplementation((c) => c);

const sampleConsultation = {
  id: 1,
  room_id: 'sehatsetu-nabha-room-apt-nbh-2026-0003',
  appointment_id: 3,
  doctor_id: 3,
  patient_id: 3,
  status: 'INITIATED',
  consultation_type: 'VIDEO',
  low_bandwidth_fallback: false,
  doctor: {
    id: 3,
    full_name: 'Dr. Jaswinder Singh Brar',
    specialization: 'Pediatrics',
    hospital_name: 'Bhadson PHC',
    village: 'Bir Bhadson',
  },
  patient: {
    id: 3,
    full_name: 'Sukhwinder Singh',
    age: 28,
    gender: 'Male',
    village: 'Rohti Chhanna',
    abha_id: '91-0003-0021-0039-DEMO',
  },
  ice_servers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

const renderRoom = (roomId = 'sehatsetu-nabha-room-apt-nbh-2026-0003') => {
  return render(
    <LanguageProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[`/consultation/${roomId}`]}>
          <Routes>
            <Route path="/consultation/:roomId" element={<ConsultationRoom />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

describe('ConsultationRoom Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: vi.fn().mockReturnValue([
          { stop: vi.fn(), enabled: true },
          { stop: vi.fn(), enabled: true },
        ]),
        getVideoTracks: vi.fn().mockReturnValue([{ stop: vi.fn(), enabled: true }]),
        getAudioTracks: vi.fn().mockReturnValue([{ stop: vi.fn(), enabled: true }]),
      }),
    };
  });

  it('renders consultation room header with doctor and patient details', async () => {
    consultationsApi.get.mockResolvedValue(sampleConsultation);
    consultationsApi.updateStatus.mockResolvedValue({ ...sampleConsultation, status: 'CONNECTED' });

    renderRoom();

    const matches = await screen.findAllByText(/Dr. Jaswinder Singh Brar/i);
    expect(matches.length).toBeGreaterThan(0);
    expect(screen.getByText('sehatsetu-nabha-room-apt-nbh-2026-0003')).toBeInTheDocument();
    expect(screen.getByText(/2G\/3G ਆਡੀਓ/i)).toBeInTheDocument();
  });

  it('allows switching to 2G/3G audio-only mode and notifies server of fallback', async () => {
    consultationsApi.get.mockResolvedValue(sampleConsultation);
    consultationsApi.updateStatus.mockResolvedValue({ ...sampleConsultation, status: 'CONNECTED' });
    consultationsApi.setFallback.mockResolvedValue({
      ...sampleConsultation,
      low_bandwidth_fallback: true,
      consultation_type: 'AUDIO',
    });

    renderRoom();

    await screen.findAllByText(/Dr. Jaswinder Singh Brar/i);

    // Click 2G/3G audio button
    const audioBtn = screen.getByText(/2G\/3G ਆਡੀਓ/i);
    fireEvent.click(audioBtn);

    expect(consultationsApi.setFallback).toHaveBeenCalledWith(
      'sehatsetu-nabha-room-apt-nbh-2026-0003',
      expect.objectContaining({
        low_bandwidth_fallback: true,
        consultation_type: 'AUDIO',
      })
    );

    // Verify audio mode avatar stage is shown
    expect(await screen.findByText(/Low Bandwidth Voice Mode/i)).toBeInTheDocument();
  });

  it('opens end consultation modal, rates call quality, and completes session', async () => {
    consultationsApi.get.mockResolvedValue(sampleConsultation);
    consultationsApi.updateStatus.mockResolvedValue({ ...sampleConsultation, status: 'COMPLETED' });

    renderRoom();

    await screen.findAllByText(/Dr. Jaswinder Singh Brar/i);

    // Click End Call
    const endCallBtn = screen.getByRole('button', { name: /ਕਾਲ ਸਮਾਪਤ ਕਰੋ/i });
    fireEvent.click(endCallBtn);

    // Modal opens
    expect(await screen.findByText(/ਕੰਸਲਟੇਸ਼ਨ ਸਮਾਪਤ ਕਰੋ/i)).toBeInTheDocument();
    expect(screen.getByText(/ਕਾਲ ਗੁਣਵੱਤਾ/i)).toBeInTheDocument();

    // Submit completion
    const submitBtn = screen.getByRole('button', { name: /ਜਮ੍ਹਾਂ ਕਰੋ ਅਤੇ ਬਾਹਰ ਜਾਓ/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(consultationsApi.updateStatus).toHaveBeenCalledWith(
        'sehatsetu-nabha-room-apt-nbh-2026-0003',
        expect.objectContaining({
          status: 'COMPLETED',
          quality_rating: 5,
        })
      );
    });
  });
});
