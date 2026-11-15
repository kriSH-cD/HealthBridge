import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { 
  InteractiveTriage3D, 
  ANATOMY_HOTSPOTS, 
  AMBULANCE_HOTSPOTS 
} from '../components/InteractiveTriage3D';
import { InteractiveTriagePage } from '../pages/InteractiveTriagePage';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';

describe('InteractiveTriage3D Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the 3D triage container or accessible fallback with controls', () => {
    render(
      <InteractiveTriage3D />
    );

    // Verify mode switches exist
    expect(screen.getByText(/ਮਰੀਜ਼ ਟ੍ਰਾਈਏਜ/i)).toBeInTheDocument();
    expect(screen.getByText(/108 ALS ਐਂਬੂਲੈਂਸ/i)).toBeInTheDocument();

    // Verify dispatch button
    expect(screen.getByText(/Dispatch 108 EMS/i)).toBeInTheDocument();
  });

  it('allows switching between Anatomy Mode and Ambulance Fleet Mode', () => {
    render(
      <InteractiveTriage3D />
    );

    const ambulanceBtn = screen.getByText(/108 ALS ਐਂਬੂਲੈਂਸ/i);
    fireEvent.click(ambulanceBtn);

    // Verify ambulance hotspot index buttons exist
    expect(screen.getByRole('button', { name: 'ventilator' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'defibrillator' })).toBeInTheDocument();
  });

  it('invokes onSelectHotspot callback when an anatomical hotspot is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <InteractiveTriage3D onSelectHotspot={handleSelect} />
    );

    // Click brain hotspot button
    const brainBtn = screen.getByRole('button', { name: 'brain' });
    fireEvent.click(brainBtn);

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'brain', severity: 'CRITICAL' })
    );

    // Telemetry text updates
    expect(screen.getAllByText(/Brain \/ Cranium/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Neurological/i)).toBeInTheDocument();
  });

  it('triggers onDispatchTrigger with severity and clinical diagnosis on button click', () => {
    const handleDispatch = vi.fn();
    render(
      <InteractiveTriage3D onDispatchTrigger={handleDispatch} />
    );

    const dispatchBtn = screen.getByRole('button', { name: /Dispatch 108 EMS/i });
    fireEvent.click(dispatchBtn);

    expect(handleDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: expect.any(String),
        complaint: expect.any(String),
        hotspot: expect.any(Object)
      })
    );
  });
});

describe('InteractiveTriagePage', () => {
  it('renders the ISD Capstone header and cue card helper', () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <InteractiveTriagePage />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    );

    // Verify Capstone Badge & Banner
    expect(screen.getAllByText(/ISD CAPSTONE/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Interactive Systems & 3D Simulation Engine/i)).toBeInTheDocument();

    // Open video cue cards drawer
    const cueCardsBtn = screen.getByText(/10-Min Video Cue Cards/i);
    fireEvent.click(cueCardsBtn);

    expect(screen.getByText(/ISD Online Video Evaluation Guide/i)).toBeInTheDocument();
    expect(screen.getByText(/Q1: Experience/i)).toBeInTheDocument();
    expect(screen.getByText(/Q2: Tools & Concepts/i)).toBeInTheDocument();
  });
});
